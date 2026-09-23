from pydantic import BaseModel


class UpdateStatusOut(BaseModel):
    current_version: str
    latest_version: str | None
    update_available: bool
    notes: str | None = None
    published_at: str | None = None
    error: str | None = None
    # Whether THIS machine can build and sign a release (MES_ALLOW_PUBLISH=1
    # in its .env) - a plant PC has neither the key nor the dev tools, so the
    # page hides that half rather than offering a button that can only fail.
    publish_enabled: bool = False


class ApplyUpdateOut(BaseModel):
    ok: bool
    version: str
    log: str
    restarting: bool
    # "supervised" (the launcher will start it again), "relaunch" (nothing is
    # watching, so a helper will), or "manual" (somebody has to).
    restart_mode: str = "manual"


class PublishUpdateRequest(BaseModel):
    from_version: str = ""
    notes: str = ""


class PublishUpdateOut(BaseModel):
    html_url: str
    tag_name: str
    asset_name: str
    asset_size: int


class UpdateSourceOut(BaseModel):
    kind: str          # "server" (one you host) or "github"
    address: str       # the update server's address, when that's the source
    repo: str          # the GitHub repo, when that is
    token_set: bool


class UpdateSourceRequest(BaseModel):
    address: str = ""          # blank goes back to GitHub
    token: str | None = None   # None leaves whatever is already set alone


class UpdateAttempt(BaseModel):
    """One line out of updates/history.jsonl - what this PC actually went
    through, successes and failures alike."""
    at: str = ""
    from_version: str = ""
    to_version: str = ""
    ok: bool = False
    detail: str = ""


class RestorePoint(BaseModel):
    """A copy-aside taken before an update, still sitting in rollback\."""
    name: str
    version: str = ""
    at: str = ""


class AvailableUpdate(BaseModel):
    version: str
    notes: str = ""
    published_at: str = ""
    size: int | None = None
    current: bool = False
    newer: bool = False


class ApplyVersionRequest(BaseModel):
    version: str = ""          # blank means "the newest one"
    allow_older: bool = False  # installing an older release, deliberately


class UploadedPackage(BaseModel):
    """What a package uploaded straight from the browser turned out to be.
    Only ever returned once it has already passed the same integrity and
    signature checks setup/apply_update.py runs on any other package - a
    response here means it is genuine, not just that the upload succeeded.

    filename is what to hand back to /apply-uploaded - the name this PC
    saved it under, never the one the phone sent, which is never trusted as
    a path."""
    filename: str
    to_version: str
    from_version: str | None
    notes: str
    file_count: int
    size_bytes: int
    # Compared the same way the version list is (a numeric tuple, not string
    # order - "PT-V4.9" reads as older than "PT-V4.10" lexicographically,
    # which is wrong), so the confirmation panel can say "install" or "go
    # back to this" correctly without the browser guessing.
    current: bool
    newer: bool


class ApplyUploadedRequest(BaseModel):
    filename: str
    allow_older: bool = False
