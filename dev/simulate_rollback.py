"""Go forward, then go back, on a throwaway plant PC.

    venv\\Scripts\\python.exe dev\\simulate_rollback.py

This is the bug it exists for: the Updates screen offered "go back to this",
the files went back, and then the older release's own start-up met a database
stamped at a migration it has never heard of. The boot check failed, the
apply rolled itself forward again, and nothing could ever be reverted.

What it does:

  1. builds a plant PC in a temp folder from a real older commit, running
     against its own scratch database, and brings that database up on the
     older release's own schema;
  2. applies a real signed package of the current version to it, and expects
     the schema to move forward and the app to boot;
  3. applies the older package back onto it, and expects the schema to be
     walked back FIRST (while the newer code that owns those migrations is
     still on disk), the files to follow, and the older release to start up
     on its own afterwards;
  4. checks the refusals still hold: going back without asking for it is
     refused, and a second apply while one is running is refused.

Nothing here touches the real project folder, its .env, its logs, or any
database the app uses.
"""
import hashlib
import io
import json
import os
import shutil
import subprocess
import sys
import tarfile
import tempfile
import zipfile
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
PY = str(PROJECT / "venv" / "Scripts" / "python.exe") if os.name == "nt" else sys.executable
WORK = Path(tempfile.mkdtemp(prefix="rollback_sim_"))
PLANT = WORK / "plant_pc"
DB = "formlabs_rollback_sim"

# A real older release, not a doctored copy of today's code. Removing a
# migration file from the current release leaves models that still expect the
# column it added, which is a PC that never existed.
OLD_COMMIT = "b0b52f0"

FAILS, CHECKS = [], 0

sys.path.insert(0, str(PROJECT / "dev"))
sys.path.insert(0, str(PROJECT / "setup"))


def check(cond, label):
    global CHECKS
    CHECKS += 1
    print(f"  {'PASS' if cond else 'FAIL'}  {label}", flush=True)
    if not cond:
        FAILS.append(label)


def scratch_db_url():
    from simulate_gateway_network import production_credentials

    user, password, prod = production_credentials()
    assert prod != DB, "refusing to run against the real database"
    import sqlalchemy as sa
    from sqlalchemy.engine import URL

    admin = sa.create_engine(URL.create("postgresql", user, password, "localhost", 5432, "postgres"),
                             isolation_level="AUTOCOMMIT")
    with admin.connect() as c:
        c.execute(sa.text(f"DROP DATABASE IF EXISTS {DB} WITH (FORCE)"))
        c.execute(sa.text(f"CREATE DATABASE {DB}"))
    admin.dispose()
    return URL.create("postgresql", user, password, "localhost", 5432,
                      DB).render_as_string(hide_password=False)


def build_plant(db_url):
    """An older release straight out of git: its code, its migrations, all of it."""
    PLANT.mkdir(parents=True)
    tar = subprocess.run(["git", "archive", "--format=tar", OLD_COMMIT], cwd=PROJECT,
                         capture_output=True, check=True).stdout
    with tarfile.open(fileobj=io.BytesIO(tar)) as archive:
        archive.extractall(PLANT)
    # The built frontend is git-ignored, so the archive carries none, and a
    # real PC has one.
    shutil.copytree(PROJECT / "frontend" / "dist", PLANT / "frontend" / "dist")
    (PLANT / ".env").write_text("DB_URL=" + db_url + "\nGATEWAY_ENCRYPTION_KEY=\n",
                                encoding="utf-8")
    return (PLANT / "VERSION").read_text(encoding="utf-8").strip()


def load_applier():
    import importlib.util

    spec = importlib.util.spec_from_file_location("apply_update", PROJECT / "setup" / "apply_update.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def current_schema_head():
    """The revision the current release's migrations end on."""
    mod = load_applier()
    folder = PROJECT / "migrations" / "versions"
    bodies = {"files/migrations/versions/" + p.name: p.read_text(encoding="utf-8")
              for p in folder.glob("*.py")}

    class Zip:
        def read(self, name):
            return bodies[name].encode()

    manifest = {"files": [{"path": name.replace("files/", "")} for name in bodies]}
    return mod.package_schema_head(Zip(), manifest)


def build_package(source_root, out_dir, version, notes):
    """A real signed package built from a folder rather than from git.

    dev/make_update.py builds from the project's own git index, which a temp
    folder does not have, so this mirrors its output exactly: same manifest,
    same checksums, same signature.
    """
    import update_signing

    skip_dirs = {"venv", "backups", "logs", "uploads", "updates", "rollback", ".git",
                 "pgdata", "certs", "node_modules", "__pycache__", "_to_delete", "dist"}
    files = []
    for base, dirs, names in os.walk(source_root):
        dirs[:] = [d for d in dirs if d not in skip_dirs]
        for name in names:
            rel = str((Path(base) / name).relative_to(source_root)).replace("\\", "/")
            # An .env anywhere belongs to the machine, not to a release, and
            # the applier refuses a package that carries one.
            if name in (".env", ".env.local") or name.endswith(".pem"):
                continue
            if rel.startswith("frontend/") and not (
                    rel.startswith("frontend/dist/") or rel.startswith("frontend/src/")
                    or rel.startswith("frontend/public/")):
                continue
            files.append(rel)

    out_dir.mkdir(parents=True, exist_ok=True)
    out = out_dir / ("mes_update_" + version + ".zip")
    manifest = {"format": 1, "from_version": None, "to_version": version,
                "built_at": "2026-09-20T00:00:00", "notes": notes,
                "files": [], "delete": [], "packages": []}
    with zipfile.ZipFile(out, "w", zipfile.ZIP_DEFLATED) as zf:
        for rel in files:
            data = (source_root / rel).read_bytes()
            manifest["files"].append({"path": rel, "sha256": hashlib.sha256(data).hexdigest(),
                                      "bytes": len(data)})
            zf.writestr("files/" + rel, data)
        manifest["signature"] = update_signing.sign(manifest)
        zf.writestr("mes_update.json", json.dumps(manifest, indent=2))
    return out


def run_apply(package, allow_older):
    """Apply a package to the plant PC in its own interpreter, so the applier
    being exercised is the plant's own copy - the way it happens for real."""
    # allow_older is only passed when it is actually wanted: the older
    # release's own applier predates that argument, and a forward install has
    # no use for it.
    extra = ", allow_older=True" if allow_older else ""
    code = (
        "import sys; sys.path.insert(0, r'{plant}\\setup')\n"
        "import apply_update\n"
        "raise SystemExit(apply_update.apply(r'{package}', root=r'{plant}', "
        "assume_yes=True{extra}))\n"
    ).format(plant=str(PLANT), package=str(package), extra=extra)
    out = subprocess.run([PY, "-c", code], cwd=str(PLANT), capture_output=True,
                         text=True, timeout=2400)
    return out.returncode, (out.stdout or "") + (out.stderr or "")


def boots():
    out = subprocess.run([PY, "-c", "import crud; crud.init_db()"], cwd=str(PLANT),
                         capture_output=True, text=True, timeout=900)
    return out.returncode == 0, (out.stderr or "").strip()[-300:]


def version_on_plant():
    return (PLANT / "VERSION").read_text(encoding="utf-8").strip()


def schema_revision(db_url):
    import sqlalchemy as sa

    engine = sa.create_engine(db_url)
    try:
        with engine.connect() as c:
            return c.execute(sa.text("SELECT version_num FROM alembic_version")).scalar()
    finally:
        engine.dispose()


def main():
    print("=" * 66)
    print("ROLLBACK SIM: forward, then back")
    print("=" * 66)

    db_url = scratch_db_url()
    old_version = build_plant(db_url)
    new_head = current_schema_head()
    newest_file = next((p.name for p in (PROJECT / "migrations" / "versions").glob("*.py")
                        if f'revision = "{new_head}"' in p.read_text(encoding="utf-8")), None)
    current_version = (PROJECT / "VERSION").read_text(encoding="utf-8").strip()
    check(bool(new_head), f"the current release's migrations end on a known revision ({new_head})")
    print(f"  ({old_version} -> {current_version} -> {old_version})")

    packages = WORK / "packages"
    new_package = build_package(PROJECT, packages, current_version, "the current release")
    old_package = build_package(PLANT, packages, old_version, "an older release")

    ok, detail = boots()
    check(ok, f"the older release brings its own database up ({detail[:120]})")
    old_head = schema_revision(db_url)
    check(old_head != new_head, f"...on its own older schema ({old_head})")

    # --- forward ------------------------------------------------------------
    code, log = run_apply(new_package, allow_older=False)
    check(code == 0, f"the current release installs onto it (exit {code})")
    if code != 0:
        print("  ---- what it said ----")
        print(log.strip()[-1400:])
    check(version_on_plant() == current_version,
          f"...and the PC is on {current_version} (reads {version_on_plant()})")
    check(schema_revision(db_url) == new_head,
          f"...with the database migrated forward to {new_head}")

    # --- and back again -----------------------------------------------------
    code, log = run_apply(old_package, allow_older=False)
    check(code == 1 and "not older than" in log,
          "going back without asking for it is still refused")
    check(version_on_plant() == current_version, "...and that refusal changed nothing")

    code, log = run_apply(old_package, allow_older=True)
    check(code == 0, f"asking for it deliberately goes back (exit {code})")
    check("Lining the database up" in log,
          "...walking the schema back first, while the newer code is still on disk")
    did = "downgraded" if "downgraded" in log else "stamped" if "stamped" in log else "neither"
    check(did != "neither", f"...and saying which of the two it did ({did})")
    check(version_on_plant() == old_version,
          f"the PC is back on {old_version} (reads {version_on_plant()})")
    check(schema_revision(db_url) == old_head,
          f"...and the database is back where the older release expects it "
          f"({schema_revision(db_url)})")

    ok, detail = boots()
    check(ok, f"the older release starts up on its own afterwards, which is the whole point "
              f"({detail[:120]})")

    history = PLANT / "updates" / "history.jsonl"
    lines = history.read_text(encoding="utf-8").strip().splitlines() if history.is_file() else []
    check(any('"ok": true' in line and "went back" in line for line in lines),
          f"the revert is written into the history the Updates screen reads ({len(lines)} entries)")
    check(not (PLANT / "migrations" / "versions" / (newest_file or "none")).exists()
          if newest_file else True,
          "the newer release's own migration files are gone, so nothing walks the schema back up")

    print()
    print("=" * 66)
    if FAILS:
        print(f"{len(FAILS)} of {CHECKS} ROLLBACK CHECKS FAILED:")
        for f in FAILS:
            print("  - " + f)
    else:
        print(f"ALL {CHECKS} ROLLBACK CHECKS PASSED")
    print("=" * 66)
    print(f"\nWorking folder (delete when done): {WORK}")
    return 1 if FAILS else 0


if __name__ == "__main__":
    raise SystemExit(main())
