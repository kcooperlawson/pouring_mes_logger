"""Update a plant PC by uploading the package through the browser, over a
real HTTP connection to a real running server - proving the feature this
exists for: a phone with no path to the update server or a USB stick, just
the file and a signed-in session.

    venv\\Scripts\\python.exe dev\\simulate_upload_update.py

What it does:

  1. builds a throwaway plant PC in a temp folder from the working tree,
     with its own scratch database, deliberately left on an old version so
     a real upgrade actually has to happen;
  2. starts that plant's real api.main app under uvicorn, in a subprocess,
     the same way START_HERE.bat does;
  3. signs in as a manager over HTTP and POSTs a garbage file at
     /api/updates/upload, and expects it refused with nothing saved;
  4. builds a real signed package from the CURRENT working tree and POSTs
     its actual bytes at /api/updates/upload - the exact thing a phone's
     file picker would send - and expects the real manifest back;
  5. POSTs /api/updates/apply-uploaded for that upload, and expects the
     plant's own VERSION file to change on disk and the server to leave a
     restart marker behind - proving the browser-uploaded package went
     through the identical trusted pipeline a USB stick or the self-hosted
     update server already use, not a shortcut around it.

Nothing here touches the real project folder, its .env, its logs, or any
database the app uses.
"""
import os
import shutil
import socket
import subprocess
import sys
import tarfile
import tempfile
import time
from pathlib import Path

PROJECT = Path(__file__).resolve().parent.parent
PY = str(PROJECT / "venv" / "Scripts" / "python.exe") if os.name == "nt" else sys.executable
WORK = Path(tempfile.mkdtemp(prefix="upload_update_sim_"))
PLANT = WORK / "plant_pc"
DB = "formlabs_upload_sim"

FAILS, CHECKS = [], 0

sys.path.insert(0, str(PROJECT / "dev"))


def check(cond, label):
    global CHECKS
    CHECKS += 1
    print(f"  {'PASS' if cond else 'FAIL'}  {label}", flush=True)
    if not cond:
        FAILS.append(label)


def scratch_db_url():
    from simulate_gateway_network import production_credentials
    import sqlalchemy as sa
    from sqlalchemy.engine import URL

    user, password, prod = production_credentials()
    assert prod != DB, "refusing to run against the real database"
    admin = sa.create_engine(URL.create("postgresql", user, password, "localhost", 5432, "postgres"),
                             isolation_level="AUTOCOMMIT")
    with admin.connect() as c:
        c.execute(sa.text(f"DROP DATABASE IF EXISTS {DB} WITH (FORCE)"))
        c.execute(sa.text(f"CREATE DATABASE {DB}"))
    admin.dispose()
    return URL.create("postgresql", user, password, "localhost", 5432,
                      DB).render_as_string(hide_password=False)


def free_port():
    with socket.socket() as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def build_plant(db_url):
    """The working tree as it is right now - HEAD may carry uncommitted
    changes, and this plant should run exactly what this machine is about
    to package, the same as `git archive HEAD` would silently NOT do."""
    ignore = shutil.ignore_patterns("venv", "backups", "logs", "uploads", "updates", "rollback",
                                    ".git", "pgdata", "certs", "node_modules", "dist",
                                    "__pycache__", "_to_delete")
    shutil.copytree(PROJECT, PLANT, ignore=ignore)
    if (PROJECT / "frontend" / "dist").is_dir():
        shutil.copytree(PROJECT / "frontend" / "dist", PLANT / "frontend" / "dist")
    # Carry this machine's own PG_BIN_DIR over, when it has one set. Without
    # it, pg_dump is found by scanning Program Files for whatever PostgreSQL
    # happens to be installed there - fine on a real PC with exactly one, but
    # this dev machine has more than one version on it, and the backup step
    # failing against a database it was never meant to run against is a fact
    # about this machine's own setup, not about the feature being tested.
    pg_bin_dir = ""
    real_env = PROJECT / ".env"
    if real_env.is_file():
        for line in real_env.read_text(encoding="utf-8").splitlines():
            if line.strip().startswith("PG_BIN_DIR="):
                pg_bin_dir = line.split("=", 1)[1].strip().strip("'\"")
                break
    env_lines = ["DB_URL=" + db_url, "GATEWAY_ENCRYPTION_KEY="]
    if pg_bin_dir:
        env_lines.append(f"PG_BIN_DIR={pg_bin_dir}")
    (PLANT / ".env").write_text("\n".join(env_lines) + "\n", encoding="utf-8")
    # Deliberately old: this plant has to actually need the update it is
    # about to be handed, the same as any real PC waiting on one.
    (PLANT / "VERSION").write_text("PT-V0.01\n", encoding="utf-8")


def boot_database():
    out = subprocess.run([PY, "-c", "import crud; crud.init_db()"], cwd=str(PLANT),
                         capture_output=True, text=True, timeout=900)
    return out.returncode == 0, (out.stderr or "").strip()[-400:]


def start_server(port):
    proc = subprocess.Popen(
        [PY, "-m", "uvicorn", "api.main:app", "--host", "127.0.0.1", "--port", str(port), "--log-level", "warning"],
        cwd=str(PLANT), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
    base = f"http://127.0.0.1:{port}"
    import requests
    for _ in range(60):
        try:
            if requests.get(base + "/api/auth/me", timeout=2).status_code in (200, 401):
                return proc, base
        except requests.RequestException:
            pass
        if proc.poll() is not None:
            break
        time.sleep(1)
    out = proc.stdout.read() if proc.stdout else ""
    proc.kill()
    raise RuntimeError("the plant's server never came up:\n" + out[-2000:])


def main():
    import requests

    print("=" * 66)
    print("UPLOAD UPDATE SIM: a package carried in over HTTP, not a USB stick")
    print("=" * 66)

    db_url = scratch_db_url()
    build_plant(db_url)
    ok, detail = boot_database()
    check(ok, f"the plant's database comes up on PT-V0.01 ({detail})")

    port = free_port()
    proc, base = start_server(port)
    try:
        session = requests.Session()
        r = session.post(base + "/api/auth/login", json={"username": "manager", "pin": "admin123"},
                         headers={"x-mes-client": "1"}, timeout=15)
        check(r.status_code == 200, f"signing in to the plant over HTTP works (got {r.status_code})")

        # A garbage upload, exactly like a wrong file picked by mistake.
        r = session.post(base + "/api/updates/upload",
                         files={"file": ("update.zip", b"not a real package", "application/zip")},
                         headers={"x-mes-client": "1"}, timeout=30)
        check(r.status_code == 400, f"a garbage upload is refused (got {r.status_code})")
        check(len(list((PLANT / "updates").glob("uploaded_*.zip"))) == 0,
              "...and nothing from it is left sitting in updates\\")

        # The real thing: a signed package built from the current tree,
        # uploaded exactly as a phone's file picker would send it.
        sys.path.insert(0, str(PROJECT / "dev"))
        import make_update

        packages = WORK / "packages"
        out, manifest = make_update.build_release(notes="carried in from a phone", out_dir=packages)
        with open(out, "rb") as fh:
            r = session.post(base + "/api/updates/upload",
                             files={"file": ("update.zip", fh, "application/zip")},
                             headers={"x-mes-client": "1"}, timeout=120)
        check(r.status_code == 200, f"the real package is accepted (got {r.status_code} {r.text[:200]})")
        uploaded = r.json()
        check(uploaded["to_version"] == manifest["to_version"],
              f"...reporting the package's own version back correctly (got {uploaded})")

        r = session.post(base + "/api/updates/apply-uploaded",
                         json={"filename": uploaded["filename"], "allow_older": False},
                         headers={"x-mes-client": "1"}, timeout=1800)
        check(r.status_code == 200, f"applying the upload succeeds (got {r.status_code} {r.text[:300]})")
        result = r.json()
        check(result.get("ok") is True, f"...and the pipeline itself reports success (got {result})")
        check(result.get("version") == manifest["to_version"],
              f"...landing on exactly the version that was uploaded (got {result.get('version')})")

        on_disk = (PLANT / "VERSION").read_text(encoding="utf-8").strip()
        check(on_disk == manifest["to_version"],
              f"the plant's own VERSION file changed for real, on disk (got {on_disk!r})")
        check((PLANT / "updates" / ".restart-requested").exists() or result.get("restarting"),
              "a restart was actually requested, the same as any other successful apply")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=10)
        except subprocess.TimeoutExpired:
            proc.kill()

    print()
    print("=" * 66)
    if FAILS:
        print(f"{len(FAILS)} of {CHECKS} UPLOAD UPDATE CHECKS FAILED:")
        for f in FAILS:
            print("  - " + f)
    else:
        print(f"ALL {CHECKS} UPLOAD UPDATE CHECKS PASSED")
    print("=" * 66)
    print(f"\nWorking folder (delete when done): {WORK}")
    return 1 if FAILS else 0


if __name__ == "__main__":
    raise SystemExit(main())
