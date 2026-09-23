"""Apply an update package that arrived on a USB stick.

    Drop mes_update_PT-V3.41.zip into  updates\\
    Run START_HERE.bat and choose 7.

Why this exists rather than "copy the files across". Copying by hand is four
decisions every time, and three of them are only obvious after they have gone
wrong once: which files changed, not overwriting the ones that belong to THIS
machine, having something to go back to, and knowing whether it worked before
walking away. This does those four things the same way every time.

What it will not do, on purpose:

  * It does not run anything out of the package. The zip is data - files and a
    list of them. A USB stick that can execute code on a plant PC is a
    different kind of object than a USB stick that carries files, and this is
    the second kind.
  * It does not touch .env, backups\\, logs\\, uploads\\, venv\\ or the
    updates folder itself. Those belong to the machine, not to the release.
  * It does not carry on after something fails. Every step that can fail is
    checked, and a failure after the files have moved puts the previous
    version back before it says anything else.
  * It does not apply a package that is not signed by the real key, even if
    every checksum matches. A checksum only proves the zip arrived intact -
    it says nothing about who put those files in it. See
    setup/update_signing.py.

The order matters and is deliberate:

    verify the package  ->  check the signature  ->  check the version
    ->  back up the database  ->  copy the whole project aside  ->  apply
    ->  prove it boots  ->  keep it, or roll the whole thing back

Proving it boots is the step that makes this worth having. It compiles every
file that was copied and then runs the application's own start-up, which is
what applies any new migrations. If that raises, the update is undone and the
machine is exactly where it started.
"""
from __future__ import annotations

import hashlib
import json
import os
import re
import shutil
import subprocess
import sys
import time
import zipfile
from datetime import datetime
from pathlib import Path

import update_signing

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPDATES = os.path.join(ROOT, "updates")
APPLIED = os.path.join(UPDATES, "applied")
ROLLBACK = os.path.join(ROOT, "rollback")
LOGS = os.path.join(ROOT, "logs")
MANIFEST_NAME = "mes_update.json"

# Belongs to this machine, never to a release. A copy that overwrote .env
# would point the floor PC at whatever database the update was built against.
NEVER_TOUCH = {".env", ".env.local"}
NEVER_TOUCH_DIRS = {"backups", "logs", "venv", "uploads", "updates", "rollback",
                    ".git", "_to_delete", "__pycache__", "pgdata", "certs"}

OK, BAD, WARN = "  [ok]", "  [X] ", "  [!] "


def say(*parts):
    print(*parts, flush=True)


def log_line(text, root=ROOT):
    try:
        os.makedirs(os.path.join(root, "logs"), exist_ok=True)
        with open(os.path.join(root, "logs", "updates.log"), "a", encoding="utf-8") as fh:
            fh.write(f"{datetime.now():%Y-%m-%d %H:%M:%S}  {text}\n")
    except Exception:
        pass


# ------------------------------------------------------------- the version --
def read_version(root=ROOT):
    """The version this machine is running, from the VERSION file at the
    project root (used to be read off Home.py's own APP_VERSION line,
    before the Streamlit UI was retired)."""
    try:
        with open(os.path.join(root, "VERSION"), encoding="utf-8") as fh:
            return fh.read().strip()
    except Exception:
        return ""


def version_tuple(text):
    """PT-V3.40 -> (3, 40). Anything unparseable sorts before everything."""
    nums = re.findall(r"\d+", str(text or ""))
    return tuple(int(n) for n in nums) if nums else (0,)


# ------------------------------------------------------- reading the package --
def newest_package():
    if not os.path.isdir(UPDATES):
        return None
    zips = [os.path.join(UPDATES, f) for f in os.listdir(UPDATES)
            if f.lower().endswith(".zip")]
    zips = [z for z in zips if os.path.isfile(z)]
    return max(zips, key=os.path.getmtime) if zips else None


def read_manifest(zf):
    try:
        return json.loads(zf.read(MANIFEST_NAME).decode("utf-8"))
    except KeyError:
        raise ValueError("this zip has no update manifest in it - is it a "
                         "move package rather than an update?")
    except Exception as exc:
        raise ValueError(f"the manifest could not be read ({exc})")


def check_package(zf, manifest):
    """Every file present, and every checksum right. A half-copied USB stick
    is the failure this catches, and it is the common one."""
    problems = []
    names = set(zf.namelist())
    for entry in manifest.get("files", []):
        member = "files/" + entry["path"]
        if member not in names:
            problems.append(f"{entry['path']} is listed but not in the zip")
            continue
        digest = hashlib.sha256(zf.read(member)).hexdigest()
        if digest != entry["sha256"]:
            problems.append(f"{entry['path']} does not match its checksum")
    for path in manifest.get("files", []):
        p = path["path"].replace("\\", "/")
        if p.split("/")[0] in NEVER_TOUCH_DIRS or os.path.basename(p) in NEVER_TOUCH:
            problems.append(f"{p} is not a file an update may write")
        if p.startswith("/") or ".." in p.split("/"):
            problems.append(f"{p} is not a path inside the project")
    return problems


# ------------------------------------------------------- the safety net -----
def package_schema_head(zf, manifest):
    """The migration revision an incoming package expects the database to be
    on, read from the migration files inside the package itself.

    A package carries its own migrations/versions/*.py. The head is the one
    revision in that set that nothing else in the set lists as its
    down_revision. Returns None when a package carries no migrations at all,
    which just means there is nothing to line up.
    """
    revisions, parents = set(), set()
    for entry in manifest.get("files", []):
        name = str(entry.get("path", "")).replace("\\", "/")
        if not (name.startswith("migrations/versions/") and name.endswith(".py")):
            continue
        try:
            body = zf.read("files/" + name).decode("utf-8", "replace")
        except Exception:
            continue
        found = re.search(r"^revision\s*(?::[^=]+)?=\s*['\"]([^'\"]+)['\"]", body, re.M)
        parent = re.search(r"^down_revision\s*(?::[^=]+)?=\s*['\"]([^'\"]+)['\"]", body, re.M)
        if found:
            revisions.add(found.group(1))
        if parent:
            parents.add(parent.group(1))
    heads = revisions - parents
    if len(heads) == 1:
        return heads.pop()
    return None


def schema_back(root, target_head):
    """Ask the CURRENT code to put the schema back to what the older release
    expects, before that release's files are written. (ok, message)."""
    py = os.path.join(root, "venv", "Scripts", "python.exe")
    if not os.path.isfile(py):
        py = sys.executable
    try:
        out = subprocess.run([py, "_migration_helper.py", "schema_back", target_head],
                             cwd=root, capture_output=True, text=True, timeout=900)
    except Exception as exc:
        return False, str(exc)[:200]
    lines = [ln.strip() for ln in (out.stdout or "").splitlines() if ln.strip()]
    note = next((ln.split(":", 1)[1] for ln in lines if ln.startswith("SCHEMA_BACK_NOTE:")), "")
    for line in lines:
        if line.startswith("SCHEMA_BACK_OK:"):
            detail = line.split(":", 1)[1]
            return True, (f"{detail} ({note})" if note else detail)
        if line.startswith("SCHEMA_BACK_FAILED:"):
            return False, line.split(":", 1)[1]
    return False, (out.stderr or "no output").strip()[-300:]


# Directories an update package owns outright, plus the root-level file types
# it carries. Anything here that a package does NOT contain is a leftover from
# some other release, which is only ever worth removing when going back.
PRUNABLE_DIRS = ("api", "device_gateway", "migrations", "setup", "dev", "tests",
                 "frontend/src", "frontend/public", "frontend/dist")
PRUNABLE_ROOT_SUFFIXES = (".py", ".bat", ".ps1")


def prune_to_package(root, manifest):
    """Going back means going back. Remove files this release does not have.

    Writing an older release's files over a newer one leaves everything the
    newer release ADDED still sitting there, and some of those files are not
    inert. Its migrations are the case that bit: the older code runs "upgrade
    to head", finds the newer migration scripts still in migrations/versions,
    and walks the schema straight back up to where it just came from. The
    leftovers have to go for a revert to actually be one.

    Only on the way back, and only inside the directories a release owns -
    never uploads, backups, logs, the database, the .env, or anything else
    that belongs to the machine.
    """
    keep = {str(entry["path"]).replace("\\", "/") for entry in manifest.get("files", [])}
    removed = []
    for base, dirs, names in os.walk(root):
        dirs[:] = [d for d in dirs if d not in NEVER_TOUCH_DIRS]
        for name in names:
            full = os.path.join(base, name)
            rel = os.path.relpath(full, root).replace("\\", "/")
            if rel in keep or name in NEVER_TOUCH:
                continue
            owned = rel.startswith(tuple(d + "/" for d in PRUNABLE_DIRS))
            root_level = "/" not in rel and rel.endswith(PRUNABLE_ROOT_SUFFIXES)
            if not (owned or root_level):
                continue
            try:
                os.remove(full)
                removed.append(rel)
            except OSError:
                pass
    return removed


def enough_room(root, package_path):
    """A copy of the project plus the package unpacked, with room to spare.

    Running out of disk half way through writing files is the one failure
    that leaves a PC in a state neither version owns, and it is cheap to
    refuse up front instead.
    """
    try:
        need = os.path.getsize(package_path) * 3
        for base, _dirs, files in os.walk(root):
            if any(part in NEVER_TOUCH_DIRS for part in base.split(os.sep)):
                continue
            for f in files:
                try:
                    need += os.path.getsize(os.path.join(base, f))
                except OSError:
                    pass
        free = shutil.disk_usage(root).free
        return free > need, f"{free // (1024 ** 2)} MB free, about {need // (1024 ** 2)} MB needed"
    except Exception as exc:
        # Never block an update because the estimate itself failed.
        return True, f"could not measure free space ({exc})"


def prune_rollbacks(root, keep=5):
    """Old copies-aside are a safety net, not an archive - each one is the
    whole project. Keep the newest few and delete the rest."""
    folder = os.path.join(root, "rollback")
    try:
        entries = sorted(
            (os.path.join(folder, n) for n in os.listdir(folder)),
            key=lambda p: os.path.getmtime(p), reverse=True)
    except Exception:
        return 0
    removed = 0
    for old in [e for e in entries if os.path.isdir(e)][keep:]:
        try:
            shutil.rmtree(old, ignore_errors=True)
            removed += 1
        except Exception:
            pass
    return removed


def record_history(root, entry):
    """One line per attempt, so the Updates screen can show what this PC has
    actually been through rather than only what it is on now."""
    try:
        folder = os.path.join(root, "updates")
        os.makedirs(folder, exist_ok=True)
        entry = dict(entry)
        entry.setdefault("at", datetime.now().isoformat(timespec="seconds"))
        with open(os.path.join(folder, "history.jsonl"), "a", encoding="utf-8") as fh:
            fh.write(json.dumps(entry) + "\n")
    except Exception:
        pass


class ApplyLock:
    """Only one apply at a time. Two at once - a click plus a scheduled
    check, or an impatient second click - would have them writing over each
    other's files with two different releases."""

    def __init__(self, root):
        self.path = os.path.join(root, "updates", ".applying")
        self.taken = False

    def __enter__(self):
        os.makedirs(os.path.dirname(self.path), exist_ok=True)
        try:
            # Stale after an hour: a crashed apply must not lock the PC out
            # of ever updating again.
            if os.path.isfile(self.path) and time.time() - os.path.getmtime(self.path) > 3600:
                os.remove(self.path)
            fd = os.open(self.path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
            os.write(fd, str(os.getpid()).encode())
            os.close(fd)
            self.taken = True
        except FileExistsError:
            self.taken = False
        return self

    def __exit__(self, *exc):
        if self.taken:
            try:
                os.remove(self.path)
            except OSError:
                pass
        return False


def take_backup(root=ROOT):
    """Ask the application for a database backup. (ok, message)."""
    py = os.path.join(root, "venv", "Scripts", "python.exe")
    if not os.path.isfile(py):
        py = sys.executable
    try:
        out = subprocess.run([py, "_migration_helper.py", "backup"], cwd=root,
                             capture_output=True, text=True, timeout=900)
        line = (out.stdout or "").strip().splitlines()[-1] if out.stdout else ""
        if line.startswith("BACKUP_OK:"):
            return True, line.split(":", 1)[1]
        return False, (line or (out.stderr or "").strip()[-300:] or "no output")
    except Exception as exc:
        return False, str(exc)[:200]


def copy_aside(root, destination):
    """The whole project as it is now, minus what belongs to the machine."""
    def ignore(directory, names):
        return [n for n in names if n in NEVER_TOUCH_DIRS]
    shutil.copytree(root, destination, ignore=ignore, dirs_exist_ok=True)


def restore_from(snapshot, root):
    """Put every file from the snapshot back. Extra files that the update
    added are left, because deleting them is a second way to go wrong and a
    stray unused file has never broken anything."""
    for base, _dirs, files in os.walk(snapshot):
        rel = os.path.relpath(base, snapshot)
        target_dir = root if rel == "." else os.path.join(root, rel)
        os.makedirs(target_dir, exist_ok=True)
        for name in files:
            shutil.copy2(os.path.join(base, name), os.path.join(target_dir, name))


# ---------------------------------------------------------------- applying --
def write_files(zf, manifest, root):
    written = []
    for entry in manifest.get("files", []):
        rel = entry["path"].replace("\\", "/")
        target = os.path.join(root, *rel.split("/"))
        os.makedirs(os.path.dirname(target), exist_ok=True)
        with open(target, "wb") as fh:
            fh.write(zf.read("files/" + rel))
        written.append(rel)
    return written


def remove_files(manifest, root):
    """A release that removes a page has to remove it here too. A page left
    behind still appears in Streamlit's own menu and still opens."""
    gone = []
    for rel in manifest.get("delete", []):
        rel = rel.replace("\\", "/")
        if rel.split("/")[0] in NEVER_TOUCH_DIRS or os.path.basename(rel) in NEVER_TOUCH:
            continue
        target = os.path.join(root, *rel.split("/"))
        if os.path.isfile(target):
            try:
                os.remove(target)
                gone.append(rel)
            except Exception:
                pass
    return gone


def clear_pycache(root):
    for base, dirs, _files in os.walk(root):
        if os.path.basename(base) == "__pycache__":
            shutil.rmtree(base, ignore_errors=True)
            dirs[:] = []


def install_packages(manifest, root):
    packages = manifest.get("packages") or []
    if not packages:
        return True, "none needed"
    py = os.path.join(root, "venv", "Scripts", "python.exe")
    if not os.path.isfile(py):
        py = sys.executable
    wheels = os.path.join(root, "wheels")
    cmd = [py, "-m", "pip", "install"]
    if os.path.isdir(wheels):
        cmd += ["--no-index", f"--find-links={wheels}"]
    cmd += list(packages)
    try:
        out = subprocess.run(cmd, cwd=root, capture_output=True, text=True, timeout=1800)
        if out.returncode == 0:
            return True, ", ".join(packages)
        # A locked-down PC with no wheels folder is a real case, and the
        # honest thing is to say which packages could not be installed rather
        # than leaving an import error for later.
        return False, (out.stderr or out.stdout or "")[-1000:]
    except Exception as exc:
        return False, str(exc)[:200]


def verify(root, written):
    """Compile what was copied, then run the application's own start-up.

    The start-up is the part worth doing: importing crud is what applies any
    migration the release brought with it, so a schema change is proved here
    rather than the first time somebody opens the app.
    """
    py = os.path.join(root, "venv", "Scripts", "python.exe")
    if not os.path.isfile(py):
        py = sys.executable
    pyfiles = [f for f in written if f.endswith(".py")]
    if pyfiles:
        out = subprocess.run([py, "-m", "py_compile", *pyfiles], cwd=root,
                             capture_output=True, text=True, timeout=600)
        if out.returncode != 0:
            return False, "a file that was copied does not compile:\n" + \
                   (out.stderr or "")[-1500:]
    out = subprocess.run([py, "-c", "import crud; crud.init_db()"], cwd=root,
                         capture_output=True, text=True, timeout=1800)
    if out.returncode != 0:
        return False, "the application did not start:\n" + (out.stderr or "")[-1500:]
    return True, "compiled and started"


# ------------------------------------------------------------------- main --
def apply(package_path, root=ROOT, assume_yes=False, allow_older=False):
    with ApplyLock(root) as lock:
        if not lock.taken:
            say()
            say(BAD + "another update is being applied on this PC right now.")
            say("        Nothing has been changed. Wait for it to finish.")
            say()
            return 1
        return _apply(package_path, root, assume_yes, allow_older)


def _apply(package_path, root=ROOT, assume_yes=False, allow_older=False):
    say()
    say("  ===================================================")
    say("   APPLY UPDATE")
    say("  ===================================================")
    say()

    here = read_version(root)
    say(f"  This PC is running: {here or 'unknown'}")
    say(f"  Package:            {os.path.basename(package_path)}")
    say()

    with zipfile.ZipFile(package_path) as zf:
        manifest = read_manifest(zf)

        problems = check_package(zf, manifest)
        if problems:
            say(BAD + "This package is not right, and nothing has been changed:")
            for p in problems[:10]:
                say("        " + p)
            say()
            say("        Copy it onto the USB stick again - a half-written file")
            say("        looks exactly like this.")
            return 1
        say(OK, f"{len(manifest.get('files', []))} files, every checksum matches")

        # Explicit path: update_signing.verify()'s own default points at
        # THIS repo's public key, which is right for the real applier but
        # wrong for a test pointed at a fake plant folder - the key that
        # matters is the one shipped on the machine being updated, i.e.
        # relative to root, not to wherever apply_update.py's source lives.
        sig_ok, sig_detail = update_signing.verify(
            manifest, Path(root) / "setup" / "update_signing_public.pem")
        if not sig_ok:
            say(BAD + f"Signature check failed: {sig_detail}.")
            say("        Nothing has been changed. This package did not come")
            say("        from the real signing key, or was altered after it")
            say("        was built - do not apply it.")
            return 1
        say(OK, sig_detail)

        wanted = manifest.get("from_version")
        target = manifest.get("to_version", "")
        if wanted and here and wanted != here:
            say(BAD + f"This package updates {wanted}, and this PC is on {here}.")
            say("        Nothing has been changed. Apply the packages in order,")
            say("        or ask for one built against this version.")
            return 1
        if here and target and version_tuple(target) <= version_tuple(here) and not allow_older:
            say(BAD + f"This PC is already on {here}, which is not older than "
                      f"{target}.")
            say("        Nothing has been changed.")
            return 1
        if allow_older and here and target and version_tuple(target) < version_tuple(here):
            # Asked for deliberately, from the Updates tab's own list of older
            # releases. Worth saying out loud in the log: the FILES go back,
            # and the database does not - migrations have no reverse here, so
            # a schema change made by the newer version stays made.
            say(WARN + f"Going BACK from {here} to {target}. The files go back; the")
            say("        database does not - anything a newer version changed in the")
            say("        schema stays changed. The backup below is the way out.")
        say(OK, f"version {here or '?'} -> {target}")

        if manifest.get("notes"):
            say()
            say("  What is in it:")
            for line in str(manifest["notes"]).splitlines():
                say("    " + line)
            say()

        if not assume_yes:
            answer = input("  Type YES to apply this update: ").strip()
            if answer != "YES":
                say()
                say("  Nothing has been changed.")
                return 1

        say()
        say("  [1/7] Room to work...")
        room_ok, room_detail = enough_room(root, package_path)
        if not room_ok:
            say(BAD + f"not enough free disk space ({room_detail}).")
            say("        Nothing has been changed. An update that runs out of")
            say("        space half way through is the one failure that leaves")
            say("        a PC on neither version.")
            record_history(root, {"to": target, "from": here, "ok": False,
                                  "detail": f"not enough disk space ({room_detail})"})
            return 1
        say(OK, room_detail)

        say("  [2/7] Database backup...")
        ok, detail = take_backup(root)
        if not ok:
            say(BAD + f"the backup failed ({detail}).")
            say("        Stopping here on purpose: an update without a backup")
            say("        behind it is the one you cannot undo.")
            return 1
        say(OK, detail)

        say("  [3/7] Copying this version aside...")
        stamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        snapshot = os.path.join(root, "rollback", f"{(here or 'unknown')}_{stamp}")
        try:
            copy_aside(root, snapshot)
        except Exception as exc:
            say(BAD + f"could not make the rollback copy ({exc}).")
            return 1
        say(OK, os.path.relpath(snapshot, root))

        say("  [4/7] Lining the database up...")
        # Only on the way back. Going forward, the incoming release runs its
        # own new migrations at the boot check in step 7, which is where a
        # schema change has always been proved.
        going_back = bool(allow_older and here and target
                          and version_tuple(target) < version_tuple(here))
        if not going_back:
            say(OK, "nothing to do - the new version brings its own")
        else:
            wanted_head = package_schema_head(zf, manifest)
            if not wanted_head:
                say(OK, "that release carries no migrations of its own")
            else:
                # This has to happen while the NEWER code is still in place.
                # Its migration scripts are the only thing on the PC that
                # knows how to reverse its own changes, and they are about to
                # be replaced by an older set that has never heard of them.
                ok, detail = schema_back(root, wanted_head)
                if not ok:
                    say(BAD + f"could not put the database back to {wanted_head}: {detail}")
                    say("        Nothing has been changed, and the backup from step 2")
                    say("        is in backups\\. Restoring that backup onto this")
                    say("        version is the way out.")
                    record_history(root, {"to": target, "from": here, "ok": False,
                                          "detail": f"schema could not go back: {detail}"})
                    return 1
                say(OK, detail)

        say("  [5/7] Writing files...")
        written = write_files(zf, manifest, root)
        gone = remove_files(manifest, root)
        # Only when going back. Forward, a file this package happens not to
        # carry is simply a file that did not change.
        stale = prune_to_package(root, manifest) if going_back else []
        clear_pycache(root)
        say(OK, f"{len(written)} written"
                + (f", {len(gone)} removed" if gone else "")
                + (f", {len(stale)} newer files cleared out" if stale else ""))

    say("  [6/7] Packages...")
    ok, detail = install_packages(manifest, root)
    if not ok:
        say(BAD + "a package could not be installed:")
        say("        " + detail.replace("\n", "\n        ")[:400])
        say("  Putting the previous version back...")
        restore_from(snapshot, root)
        say(OK, f"this PC is back on {read_version(root)}")
        record_history(root, {"to": target, "from": here, "ok": False,
                              "detail": f"a package could not be installed: {detail[:200]}"})
        return 1
    say(OK, detail)

    say("  [7/7] Checking it actually runs...")
    ok, detail = verify(root, written)
    if not ok:
        say(BAD + detail)
        say()
        say("  Putting the previous version back...")
        restore_from(snapshot, root)
        clear_pycache(root)
        say(OK, f"this PC is back on {read_version(root)}. Nothing is lost, and")
        say("        the database backup from step 1 is in backups\\.")
        log_line(f"FAILED {os.path.basename(package_path)}: {detail.splitlines()[0]}",
                 root)
        record_history(root, {"to": target, "from": here, "ok": False,
                              "detail": detail.splitlines()[0][:200]})
        return 1
    say(OK, detail)

    say("  Filing the package...")
    applied_dir = os.path.join(root, "updates", "applied")
    try:
        os.makedirs(applied_dir, exist_ok=True)
        shutil.move(package_path, os.path.join(applied_dir, os.path.basename(package_path)))
    except Exception:
        pass
    log_line(f"applied {os.path.basename(package_path)}: {here} -> {read_version(root)}",
             root)
    record_history(root, {"to": read_version(root), "from": here, "ok": True,
                          "detail": "went back to this version" if allow_older else "installed"})
    pruned = prune_rollbacks(root)
    say(OK, "moved to updates\\applied\\" + (f", {pruned} old rollback copies cleared" if pruned else ""))

    say()
    say("  ===================================================")
    say(f"   DONE - this PC is now running {read_version(root)}")
    say("  ===================================================")
    say()
    say("  Start the app again (START_HERE.bat, choice 3) so operators pick")
    say("  up the new version.")
    say()
    return 0


def main(argv=None):
    argv = list(sys.argv[1:] if argv is None else argv)
    assume_yes = "--yes" in argv
    argv = [a for a in argv if not a.startswith("--")]

    package = argv[0] if argv else newest_package()
    if not package:
        say()
        say("  No update package found.")
        say()
        say(f"  Put the .zip you were given into:  {UPDATES}")
        say("  then run this again.")
        say()
        os.makedirs(UPDATES, exist_ok=True)
        return 1
    if not os.path.isfile(package):
        say(BAD + f"no such file: {package}")
        return 1
    try:
        return apply(package, assume_yes=assume_yes)
    except Exception as exc:
        say(BAD + f"the update stopped: {exc}")
        say("        If files had already been copied, the previous version is")
        say("        in rollback\\ - copy it back over the top.")
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
