"""Auto-update: a plant PC finds out about a newer signed release on its
own and can apply it from the browser, instead of someone carrying a USB
stick in. See api/update_check.py for the GitHub-polling and apply logic
this router is a thin HTTP wrapper around, dev/update_publish.py (via
dev/make_update.py's build_release()) for the "push a release" half, and
setup/apply_update.py for the actual trusted install pipeline both the USB
path and this one now share unchanged.

Three routes:

  GET  /updates/status   - "is something newer available" (managers+admins,
                            same audience as the banner that reads this)
  POST /updates/apply    - downloads and installs the latest release
                            (admin console only - this restarts the server)
  POST /updates/publish  - builds a package from whatever has changed since
                            --from and uploads it to GitHub (admin console
                            only, and only does anything useful on a machine
                            that holds dev/update_signing_private.pem and a
                            GITHUB_RELEASE_TOKEN - see dev/update_publish.py)
"""
import contextlib
import io
import json
import os
import sys
import uuid
import zipfile
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile

from api import update_check
from api.deps import get_current_user, require_admin_console, require_role
from api.schemas.updates import (ApplyUpdateOut, ApplyUploadedRequest, ApplyVersionRequest,
                                 AvailableUpdate, PublishUpdateOut, PublishUpdateRequest,
                                 RestorePoint, UpdateAttempt, UpdateSourceOut,
                                 UpdateSourceRequest, UpdateStatusOut, UploadedPackage)

ROOT = Path(__file__).resolve().parent.parent.parent
sys.path.insert(0, str(ROOT / "setup"))
sys.path.insert(0, str(ROOT / "dev"))

router = APIRouter(prefix="/updates", tags=["updates"])

# A phone on a slow connection uploading the whole app is the case this
# exists for, but "the whole app" has a real size - a little over 10 MB
# today. 300 MB is generous headroom for that to grow without ever being big
# enough to let a stray or hostile upload fill the disk.
MAX_UPLOAD_BYTES = 300 * 1024 * 1024


@router.get("/changelog")
def changelog(user: dict = Depends(get_current_user)) -> dict:
    """What changed, in the words the release was written up in.

    Read from CHANGELOG.md on disk rather than a copy pasted into the app, so
    the PC always shows the notes for the version it is actually running -
    the file ships inside every update package alongside the code it
    describes, and cannot drift from it.

    Any signed-in person can read it. It is the same text that goes out with
    the release; there is nothing in it to keep from an operator, and "what
    changed this morning" is a fair question from anybody standing at a
    station that looks different than it did yesterday.
    """
    root = Path(__file__).resolve().parent.parent.parent
    path = root / "CHANGELOG.md"
    version = ""
    try:
        version = (root / "VERSION").read_text(encoding="utf-8").strip()
    except OSError:
        pass
    try:
        return {"version": version, "markdown": path.read_text(encoding="utf-8")}
    except OSError:
        # A missing changelog is a thin install, not a broken one - say so
        # instead of 500ing a screen somebody opened out of curiosity.
        return {"version": version, "markdown": ""}


@router.get("/status", response_model=UpdateStatusOut)
def get_status(force: bool = False, user: dict = Depends(require_role("manager", "admin"))):
    return {**update_check.status(force=force),
            "publish_enabled": update_check.publish_enabled()}


@router.get("/source", response_model=UpdateSourceOut)
def get_source(user: dict = Depends(require_role("manager", "admin"))):
    return update_check.source_info()


@router.put("/source", response_model=UpdateSourceOut)
def set_source(body: UpdateSourceRequest, user: dict = Depends(require_admin_console)):
    """Point this PC at an update server - "192.168.0.15", or a full address.
    Blank goes back to GitHub. Written to this PC's .env, which no update
    ever overwrites."""
    try:
        return update_check.set_source(body.address, body.token)
    except update_check.CheckError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    except OSError as exc:
        raise HTTPException(status_code=500, detail=f"could not write .env ({exc})")


@router.get("/history", response_model=list[UpdateAttempt])
def history(user: dict = Depends(require_admin_console)) -> list:
    """What this PC has been through, newest first.

    Written by setup/apply_update.py itself, one line per attempt, so a
    failure that rolled itself back is on the list beside the installs that
    worked. A screen that only shows what is available cannot answer "what
    happened this morning".
    """
    path = ROOT / "updates" / "history.jsonl"
    out = []
    try:
        for line in path.read_text(encoding="utf-8").splitlines():
            line = line.strip()
            if not line:
                continue
            try:
                row = json.loads(line)
            except ValueError:
                continue
            out.append(UpdateAttempt(
                at=str(row.get("at", "")), from_version=str(row.get("from") or ""),
                to_version=str(row.get("to") or ""), ok=bool(row.get("ok")),
                detail=str(row.get("detail", ""))))
    except OSError:
        return []
    return list(reversed(out))[:50]


@router.get("/restore-points", response_model=list[RestorePoint])
def restore_points(user: dict = Depends(require_admin_console)) -> list:
    """The copies taken aside before each update, newest first. Applying an
    older release is the normal way back; these are what is left if even that
    cannot be done, and knowing they exist is half of trusting the button."""
    folder = ROOT / "rollback"
    out = []
    try:
        entries = sorted(folder.iterdir(), key=lambda p: p.stat().st_mtime, reverse=True)
    except OSError:
        return []
    for entry in entries:
        if not entry.is_dir():
            continue
        version = entry.name.split("_")[0]
        out.append(RestorePoint(
            name=entry.name, version=version,
            at=datetime.fromtimestamp(entry.stat().st_mtime).isoformat(timespec="seconds")))
    return out[:20]


@router.get("/available", response_model=list[AvailableUpdate])
def available(user: dict = Depends(require_role("manager", "admin"))):
    """Every version the source offers, newest first - older ones included,
    which is what you want on the day a new release turns out to be wrong."""
    try:
        return update_check.list_available()
    except update_check.CheckError as exc:
        raise HTTPException(status_code=409, detail=str(exc))


@router.post("/apply", response_model=ApplyUpdateOut)
def apply_update_route(body: ApplyVersionRequest | None = None,
                       user: dict = Depends(require_admin_console)):
    body = body or ApplyVersionRequest()
    try:
        if body.version:
            result = update_check.apply_version(body.version, allow_older=body.allow_older)
        else:
            result = update_check.apply_latest()
    except update_check.CheckError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    mode = "manual"
    if result["ok"]:
        import self_restart  # setup/self_restart.py
        # Asked for right before this response goes out, not after: the
        # server stops a couple of seconds from now, and this response has
        # to be on its way before that happens.
        mode = self_restart.request_restart(root=ROOT)

    return ApplyUpdateOut(ok=result["ok"], version=result["version"],
                          log=result["log"], restarting=mode != "manual",
                          restart_mode=mode)


@router.post("/upload", response_model=UploadedPackage)
async def upload(file: UploadFile = File(...), user: dict = Depends(require_admin_console)):
    """A package carried in through the browser instead of the network - a
    phone with no path to the update server, or a laptop with the file
    already on it. Saved, checked, and reported back; applying it is a
    separate, explicit step (/apply-uploaded), the same two-step shape as
    every other install here.

    "Checked" means the same integrity and signature checks
    setup/apply_update.py runs on any other package, run here before a
    single byte of it can ever be applied - a package that fails either one
    is deleted again immediately. Nothing about arriving via upload instead
    of GitHub or a USB stick lowers the bar; it is the same signed, checksummed
    file, carried a different way.
    """
    import apply_update  # setup/apply_update.py
    import update_signing  # setup/update_signing.py

    if not (file.filename or "").lower().endswith(".zip"):
        raise HTTPException(status_code=400, detail="That isn't a .zip file - an update package always is one.")

    updates_dir = ROOT / "updates"
    updates_dir.mkdir(exist_ok=True)
    # Named by this PC, never by whatever the phone called it - a filename
    # is a path component the moment something reads it back off disk, and
    # the one the browser sent is not something to trust with that.
    saved_name = f"uploaded_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.zip"
    saved_path = updates_dir / saved_name

    written = 0
    try:
        with open(saved_path, "wb") as out:
            while chunk := await file.read(1024 * 1024):
                written += len(chunk)
                if written > MAX_UPLOAD_BYTES:
                    raise HTTPException(
                        status_code=413,
                        detail=f"That's over {MAX_UPLOAD_BYTES // (1024 * 1024)} MB, which is far bigger than a "
                               f"real update package - stopped reading it rather than filling the disk.")
                out.write(chunk)
    except HTTPException:
        saved_path.unlink(missing_ok=True)
        raise
    except OSError as exc:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(status_code=500, detail=f"could not save the upload ({exc})")

    # The zip has to be fully closed before a rejected file can be deleted -
    # Windows refuses to unlink a file this same process still has open,
    # unlike POSIX, so nothing here deletes saved_path from inside the `with`
    # block below. rejection is worked out first and acted on after.
    rejection: str | None = None
    manifest: dict = {}
    try:
        with zipfile.ZipFile(saved_path) as zf:
            try:
                manifest = apply_update.read_manifest(zf)
            except ValueError as exc:
                rejection = str(exc)
            if not rejection:
                problems = apply_update.check_package(zf, manifest)
                if problems:
                    rejection = "This isn't a valid update package: " + "; ".join(problems[:3])
            if not rejection:
                sig_ok, sig_detail = update_signing.verify(manifest)
                if not sig_ok:
                    rejection = (f"Signature check failed: {sig_detail}. This did not come from the real "
                                f"signing key, or was altered after it was built - refusing it.")
    except zipfile.BadZipFile:
        rejection = "That file isn't a zip at all, or it didn't arrive whole - try uploading it again."

    if rejection:
        saved_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail=rejection)

    to_version = str(manifest.get("to_version", ""))
    here = update_check.current_version()
    return UploadedPackage(
        filename=saved_name, to_version=to_version,
        from_version=manifest.get("from_version"), notes=str(manifest.get("notes", "")),
        file_count=len(manifest.get("files", [])), size_bytes=written,
        current=to_version == here,
        newer=update_check.version_tuple(to_version) > update_check.version_tuple(here),
    )


@router.post("/apply-uploaded", response_model=ApplyUpdateOut)
def apply_uploaded_route(body: ApplyUploadedRequest, user: dict = Depends(require_admin_console)):
    """Applies a package /upload already checked and saved. Takes a bare
    filename, not a path - it is resolved against updates\\ and nowhere
    else can ever be reached through this route, upload or otherwise."""
    import apply_update  # setup/apply_update.py

    name = os.path.basename(body.filename)
    path = ROOT / "updates" / name
    if name != body.filename or not path.is_file():
        raise HTTPException(status_code=404, detail="That upload isn't on this PC any more - upload it again.")

    try:
        update_check.refuse_on_a_development_checkout()
    except update_check.CheckError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    log_capture = io.StringIO()
    with contextlib.redirect_stdout(log_capture):
        code = apply_update.apply(str(path), root=str(ROOT), assume_yes=True, allow_older=body.allow_older)
    version = apply_update.read_version(str(ROOT))
    ok = code == 0

    mode = "manual"
    if ok:
        import self_restart  # setup/self_restart.py
        mode = self_restart.request_restart(root=ROOT)

    return ApplyUpdateOut(ok=ok, version=version, log=log_capture.getvalue(),
                          restarting=mode != "manual", restart_mode=mode)


@router.post("/publish", response_model=PublishUpdateOut)
def publish_update_route(req: PublishUpdateRequest,
                         user: dict = Depends(require_admin_console)):
    if not update_check.publish_enabled():
        raise HTTPException(
            status_code=403,
            detail="Publishing is switched off on this machine. It signs a release that every "
                   "plant PC will trust, so it only runs where the signing key lives: set "
                   "MES_ALLOW_PUBLISH=1 in that PC's .env, or publish from the command line "
                   "with dev/make_update.py --publish.")

    try:
        import make_update  # dev/make_update.py
        import update_publish  # dev/update_publish.py
    except ImportError:
        # dev/ never ships in an update package, so a plant PC simply
        # doesn't have these - say that rather than raising a 500.
        raise HTTPException(status_code=409,
                            detail="This PC doesn't have the release-building tools (dev/), "
                                   "which only exist in the development copy of the project.")

    try:
        out, manifest = make_update.build_release(req.from_version, req.notes)
    except RuntimeError as exc:
        raise HTTPException(status_code=409, detail=str(exc))
    except FileNotFoundError as exc:
        # No signing key on this machine - see update_signing.sign()'s own
        # message, which already says exactly what to run and why.
        raise HTTPException(status_code=409, detail=str(exc))

    try:
        result = update_publish.publish_release(out, manifest)
    except update_publish.PublishError as exc:
        raise HTTPException(status_code=409, detail=str(exc))

    return PublishUpdateOut(**result)
