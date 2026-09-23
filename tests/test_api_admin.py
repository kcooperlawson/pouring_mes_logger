"""IT Admin Console, ported from pages/Admin_Panel.py: user roster, extra
abilities, crash reports, the suggestions inbox, database utilities and
plant-wide configuration.

Deliberately does NOT exercise real backup creation/restore/prune: they shell
out to pg_dump/psql against a fixed "backups/" directory on disk shared with
this actual dev machine's real backup history, not a per-database scratch
folder - restoring or pruning for real would touch real files outside this
test's throwaway database. Access control and the read-only status/list
endpoints are covered instead; see api/routers/admin.py's module docstring.
"""
import pathlib
import sys
from datetime import date

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from _boot import boot  # noqa: E402

boot(fresh=True)

from starlette.testclient import TestClient  # noqa: E402

import crud  # noqa: E402
import api.main  # noqa: E402

FAILS, CHECKS = [], 0


def check(cond, label):
    global CHECKS
    CHECKS += 1
    if not cond:
        FAILS.append(label)
        print(f"  FAIL  {label}")


client = TestClient(api.main.app)
CSRF = {"x-mes-client": "1"}


def login(username, pin):
    return client.post("/api/auth/login", json={"username": username, "pin": pin}, headers=CSRF)


def find(rows, key, value):
    return next((r for r in rows if r[key] == value), None)


print("=" * 66)
print("API ADMIN: the IT Admin Console")
print("=" * 66)

# --- access control ----------------------------------------------------
r = login("operator", "1234")
check(r.status_code == 200, f"operator can log in (got {r.status_code})")
r = client.get("/api/admin/users")
check(r.status_code == 403, f"an operator is refused the admin console (got {r.status_code})")
client.post("/api/auth/logout", headers=CSRF)

r = client.get("/api/admin/users")
check(r.status_code == 401, f"an anonymous request is refused too (got {r.status_code})")

r = login("manager", "admin123")
check(r.status_code == 200, f"the seeded admin account can log in (got {r.status_code})")
r = client.get("/api/admin/users")
check(r.status_code == 200, f"an admin reaches the console (got {r.status_code})")

# --- roster --------------------------------------------------------------
users = client.get("/api/admin/users").json()
check(find(users, "username", "operator") is not None, "the seeded operator shows up in the roster")
check(find(users, "username", "manager")["role"] == "admin", "the seeded admin shows the admin role")

r = client.post("/api/admin/users", json={
    "full_name": "New Hire", "email": "newhire@plant.local", "username": "newhire",
    "pin": "1234", "role": "operator", "shift": "Shift 1", "target_lph": 400.0,
}, headers=CSRF)
check(r.status_code == 201, f"a new operator account can be created (got {r.status_code})")
new_id = r.json()["id"]

r = client.post("/api/admin/users", json={
    "full_name": "Dup", "email": "newhire@plant.local", "username": "someoneelse",
    "pin": "1234", "role": "operator", "shift": "Shift 1", "target_lph": 400.0,
}, headers=CSRF)
check(r.status_code == 409, f"a duplicate email is refused, not silently accepted (got {r.status_code})")

r = client.post("/api/admin/users", json={
    "full_name": "Bad Pin", "email": "badpin@plant.local", "username": "badpin",
    "pin": "12", "role": "admin", "shift": "Shift 1", "target_lph": 400.0,
}, headers=CSRF)
check(r.status_code == 400, f"an admin PIN under the 6-character minimum is refused (got {r.status_code})")

r = client.put(f"/api/admin/users/{new_id}/role-shift", json={"role": "packer", "shift": "Shift 2"}, headers=CSRF)
check(r.status_code == 200, f"role and shift can be changed (got {r.status_code})")
updated = find(client.get("/api/admin/users").json(), "id", new_id)
check(updated["role"] == "packer" and updated["shift"] == "Shift 2", f"the change actually took (got {updated})")

r = client.put(f"/api/admin/users/{new_id}/pin", json={"pin": "5678"}, headers=CSRF)
check(r.status_code == 200, f"a PIN reset succeeds (got {r.status_code})")
r = login("newhire", "5678")
check(r.status_code == 200, "the new PIN actually works")
client.post("/api/auth/logout", headers=CSRF)
login("manager", "admin123")

r = client.post(f"/api/admin/users/{new_id}/unlock", headers=CSRF)
check(r.status_code == 200, f"unlock succeeds even on an account that was never locked (got {r.status_code})")

self_id = find(client.get("/api/admin/users").json(), "username", "manager")["id"]
r = client.delete(f"/api/admin/users/{self_id}", headers=CSRF)
check(r.status_code == 400, f"an admin cannot delete their own account (got {r.status_code})")

r = client.delete(f"/api/admin/users/{new_id}", headers=CSRF)
check(r.status_code == 200, f"deleting somebody else's account succeeds (got {r.status_code})")
check(find(client.get("/api/admin/users").json(), "id", new_id) is None, "...and they're actually gone")

# --- extra abilities -------------------------------------------------------
demo_id = find(client.get("/api/admin/users").json(), "username", "operator")["id"]
r = client.get(f"/api/admin/users/{demo_id}/abilities")
check(r.status_code == 200, f"an operator's ability sheet loads (got {r.status_code})")
sheet = r.json()
view_scada = find(sheet["abilities"], "key", "view_scada")
check(view_scada["status"] == "" and view_scada["can_grant"] is True,
      f"view_scada isn't role-granted to an operator, and the admin holds it themselves to give it (got {view_scada})")

r = client.post(f"/api/admin/users/{demo_id}/abilities/view_scada", headers=CSRF)
check(r.status_code == 200, f"granting an extra ability succeeds (got {r.status_code})")
sheet = client.get(f"/api/admin/users/{demo_id}/abilities").json()
check(find(sheet["abilities"], "key", "view_scada")["status"] == "granted", "the grant actually took")
check(len(sheet["history"]) >= 1 and sheet["history"][0]["active"] is True, "the grant appears in history as active")

r = client.delete(f"/api/admin/users/{demo_id}/abilities/view_scada", headers=CSRF)
check(r.status_code == 200, f"revoking it succeeds (got {r.status_code})")
sheet = client.get(f"/api/admin/users/{demo_id}/abilities").json()
check(find(sheet["abilities"], "key", "view_scada")["status"] == "", "the revoke actually took")
check(any(not h["active"] for h in sheet["history"]), "the revoked grant is kept in history, not deleted")

# --- crash reports ---------------------------------------------------------
r = client.get("/api/admin/error-reports")
check(r.status_code == 200 and r.json() == [], f"no crash reports on a fresh plant (got {r.json()})")

crud.record_error_report(
    {"page": "Some_Page.py", "error_type": "ValueError", "message": "boom",
     "traceback": "Traceback (most recent call last):\n  boom"},
    user_name="Demo Operator", user_role="operator", app_version="1.0.0")
r = client.get("/api/admin/error-reports")
check(r.status_code == 200 and len(r.json()) == 1, f"a logged crash shows up (got {r.json()})")
report = r.json()[0]
check(report["resolved"] is False and report["hits"] == 1, f"a fresh report is open with one hit (got {report})")

r = client.post(f"/api/admin/error-reports/{report['id']}/resolve", json={"note": "fixed it"}, headers=CSRF)
check(r.status_code == 200, f"resolving a crash report succeeds (got {r.status_code})")
check(client.get("/api/admin/error-reports").json() == [], "a resolved report drops out of the open list")
resolved = client.get("/api/admin/error-reports?include_resolved=true").json()[0]
check(resolved["resolved"] is True and resolved["note"] == "fixed it",
      f"...but is kept, resolved, with its note (got {resolved})")

# --- suggestions -----------------------------------------------------------
check(client.get("/api/admin/suggestions").json() == [], "no suggestions on a fresh plant")
crud.add_suggestion("Demo Operator", "operator", "Bug Report", "the button is upside down")
sug = client.get("/api/admin/suggestions").json()
check(len(sug) == 1 and sug[0]["status"] == "Open", f"a submitted suggestion shows up as Open (got {sug})")

r = client.put(f"/api/admin/suggestions/{sug[0]['id']}", json={"status": "Implemented", "admin_notes": "shipped it"}, headers=CSRF)
check(r.status_code == 200, f"updating a suggestion's status succeeds (got {r.status_code})")
updated_sug = client.get("/api/admin/suggestions").json()[0]
check(updated_sug["status"] == "Implemented" and updated_sug["admin_notes"] == "shipped it",
      f"the status and note both took (got {updated_sug})")

r = client.delete(f"/api/admin/suggestions/{sug[0]['id']}", headers=CSRF)
check(r.status_code == 200, f"deleting a suggestion succeeds (got {r.status_code})")
check(client.get("/api/admin/suggestions").json() == [], "...and it's gone")

# --- WIP clear -------------------------------------------------------------
wip = client.get("/api/admin/wip").json()
check(wip == {"poured_today": 0, "packed_today": 0, "wip": 0}, f"no WIP on a fresh plant (got {wip})")

crud.add_hourly_log("Demo Operator", "New Pump #1", "Shift 1", "V2", "Standard Clear V5", "L1",
                    bottles=50, scrap_empty=0, scrap_filled=0, log_type="Hourly Bottle Count")
wip = client.get("/api/admin/wip").json()
check(wip["wip"] == 50, f"an unpacked pour shows up as WIP (got {wip})")

r = client.post("/api/admin/wip/clear", headers=CSRF)
check(r.status_code == 200 and r.json()["cleared"] == 50, f"clearing WIP reports what it cleared (got {r.json()})")
check(client.get("/api/admin/wip").json()["wip"] == 0, "WIP is back to zero after clearing")

r = client.post("/api/admin/wip/clear", headers=CSRF)
check(r.json()["cleared"] == 0, "clearing an already-balanced WIP is a no-op, not a negative packing log")

# --- backups: read-only surface only, see module docstring -----------------
r = client.get("/api/admin/backups/status")
check(r.status_code == 200, f"backup status loads (got {r.status_code})")
status = r.json()
check(set(status) >= {"state", "count", "newest", "age_hours", "message", "due_after_hours", "keep_backups"},
      f"the status payload carries every field the console needs (got {status})")

r = client.get("/api/admin/backups")
check(r.status_code == 200 and isinstance(r.json(), list), f"the backup file list loads as a list (got {r.json()})")

r = client.post("/api/admin/backups/restore", json={"filename": "../../etc/passwd"}, headers=CSRF)
check(r.status_code == 404, f"a filename that was never actually listed is refused, not shelled out to (got {r.status_code})")

# --- plant configuration ---------------------------------------------------
r = client.get("/api/admin/settings")
check(r.status_code == 200, f"plant settings load (got {r.status_code})")
settings = r.json()
check(settings["simple_mode"] is True, f"a fresh plant boots in logging mode (got {settings['simple_mode']})")

base_update = {
    "shift_1_start": "06:00", "shift_1_hours": 8.0, "shift_1_break_mins": 60,
    "shift_2_start": "14:00", "shift_2_hours": 8.0, "shift_2_break_mins": 60,
    "shift_count": 2, "target_lph": 450.0, "yield_target_pct": 98.5,
    "enable_packing": True, "enable_bulk_pour": False, "enable_device_gateway": False,
    "operating_days": [0, 1, 2, 3, 4], "use_work_orders": False,
    "pump_form_url": "", "pump_form_label": "",
}
r = client.put("/api/admin/settings", json=base_update, headers=CSRF)
check(r.status_code == 200, f"saving plant settings succeeds (got {r.status_code})")
result = r.json()
check(result["saved"]["target_lph"] == 450.0, f"the new rate target took (got {result['saved']['target_lph']})")
check(result["saved"]["operating_days_desc"] == "Monday to Friday",
      f"the operating-days description reads back correctly (got {result['saved']['operating_days_desc']})")
check(result["pump_form_warning"] is None and result["orders_off_warning"] is None and result["no_admin_warning"] is None,
      f"nothing to warn about on a clean save (got {result})")

r = client.put("/api/admin/settings", json={**base_update, "pump_form_url": "javascript:alert(1)"}, headers=CSRF)
result = r.json()
check(result["pump_form_warning"] is not None, f"an unsafe pump-form URL is refused with a warning (got {result})")
check(result["saved"]["pump_form_url"] == "", "...and not saved")

# Demote the only admin, then try to flip the plant into execution mode:
# the mode switch must be refused (nobody could reach this console again),
# while every other field on the same save still goes through.
mgr_id = find(client.get("/api/admin/users").json(), "username", "manager")["id"]
client.put(f"/api/admin/users/{mgr_id}/role-shift", json={"role": "manager", "shift": "Shift 1"}, headers=CSRF)
r = client.put("/api/admin/settings", json={**base_update, "use_work_orders": True, "target_lph": 475.0}, headers=CSRF)
check(r.status_code == 200, f"the save call itself still succeeds (got {r.status_code})")
result = r.json()
check(result["no_admin_warning"] is not None, f"switching to execution mode with no admin is refused (got {result})")
check(result["saved"]["simple_mode"] is True, "...and the plant stays in logging mode")
check(result["saved"]["target_lph"] == 475.0, "...while the other field on the same save still took")
# restore admin so later assertions (if any were added after this point) keep working
client.put(f"/api/admin/users/{mgr_id}/role-shift", json={"role": "admin", "shift": "Shift 1"}, headers=CSRF)

# --- pump stations -----------------------------------------------------
r = client.post("/api/admin/pumps", json={"station_name": "Test Pump Z"}, headers=CSRF)
check(r.status_code == 201, f"adding a pump station succeeds (got {r.status_code})")
pumps = client.get("/api/admin/pumps").json()
new_pump = find(pumps, "station_name", "Test Pump Z")
check(new_pump is not None and new_pump["target_lph"] is None, f"a new pump has no rate override yet (got {new_pump})")
check(new_pump["effective_lph"] == 475.0, f"it falls back to the plant figure (got {new_pump['effective_lph']})")

r = client.put(f"/api/admin/pumps/{new_pump['id']}/rate", json={"target_lph": 500.0}, headers=CSRF)
check(r.status_code == 200, f"setting a pump's own rate succeeds (got {r.status_code})")
updated_pump = find(client.get("/api/admin/pumps").json(), "id", new_pump["id"])
check(updated_pump["target_lph"] == 500.0 and updated_pump["effective_lph"] == 500.0,
      f"the pump now expects its own rate (got {updated_pump})")

r = client.put(f"/api/admin/pumps/{new_pump['id']}/rate", json={"target_lph": 0}, headers=CSRF)
reverted_pump = find(client.get("/api/admin/pumps").json(), "id", new_pump["id"])
check(reverted_pump["target_lph"] is None, f"a rate of 0 reverts the pump to the plant default (got {reverted_pump})")

r = client.delete(f"/api/admin/pumps/{new_pump['id']}", headers=CSRF)
check(r.status_code == 200, f"deleting a pump station succeeds (got {r.status_code})")
check(find(client.get("/api/admin/pumps").json(), "id", new_pump["id"]) is None, "...and it's gone")

# --- downtime reasons: the id-vs-name bug fix -------------------------
r = client.post("/api/admin/downtime-reasons", json={"reason_name": "Test Reason Z"}, headers=CSRF)
check(r.status_code == 201, f"adding a downtime reason succeeds (got {r.status_code})")
reasons = client.get("/api/admin/downtime-reasons").json()
new_reason = find(reasons, "reason_name", "Test Reason Z")
check(new_reason is not None and isinstance(new_reason["id"], int),
      f"the admin list carries a real id, not just the name (got {new_reason})")

r = client.delete(f"/api/admin/downtime-reasons/{new_reason['id']}", headers=CSRF)
check(r.status_code == 200, f"deleting by id succeeds (got {r.status_code})")
check(find(client.get("/api/admin/downtime-reasons").json(), "reason_name", "Test Reason Z") is None,
      "the reason is actually gone - the original page's delete-by-name call could never do this")

# --- uploading an update package from the browser ---------------------------
# Deliberately does NOT call /apply-uploaded with a real, valid package: that
# invokes setup/apply_update.py's real pipeline against THIS project's own
# real root, the same reason this file never exercises real backup
# create/restore. The rejection paths are all safe to call for real - a
# rejected upload is deleted again immediately - and the one accept path is
# cleaned up by hand right after. The full accept-and-apply round trip is
# proven for real on a disposable plant PC by dev/simulate_upload_update.py.
import io  # noqa: E402
import json  # noqa: E402
import shutil  # noqa: E402
import tempfile  # noqa: E402
import zipfile  # noqa: E402

sys.path.insert(0, str(ROOT / "dev"))
import make_update  # noqa: E402

login("operator", "1234")
r = client.post("/api/updates/upload", files={"file": ("update.zip", io.BytesIO(b"anything"), "application/zip")},
                headers=CSRF)
check(r.status_code == 403, f"uploading an update is admin-console only (got {r.status_code})")

login("manager", "admin123")

r = client.post("/api/updates/upload", files={"file": ("notes.txt", io.BytesIO(b"hello"), "text/plain")},
                headers=CSRF)
check(r.status_code == 400, f"a file that isn't even named .zip is refused outright (got {r.status_code})")

updates_dir = ROOT / "updates"
before = set(updates_dir.iterdir()) if updates_dir.is_dir() else set()

r = client.post("/api/updates/upload", files={"file": ("update.zip", io.BytesIO(b"not actually a zip"), "application/zip")},
                headers=CSRF)
check(r.status_code == 400, f"a file that isn't a real zip is refused (got {r.status_code})")
check(set(updates_dir.iterdir()) == before, "...and nothing it saved along the way is left behind")

# A real zip with no update manifest in it at all.
bad_zip = io.BytesIO()
with zipfile.ZipFile(bad_zip, "w") as zf:
    zf.writestr("hello.txt", "not an update")
bad_zip.seek(0)
r = client.post("/api/updates/upload", files={"file": ("update.zip", bad_zip, "application/zip")}, headers=CSRF)
check(r.status_code == 400 and "manifest" in r.json()["detail"],
      f"a zip with no manifest is refused with a plain reason (got {r.status_code}, {r.json()})")
check(set(updates_dir.iterdir()) == before, "...and again, nothing lingers")

# A real, correctly-built package, tampered with after signing - the same
# tamper this project's own signature tests already use elsewhere.
scratch = pathlib.Path(tempfile.mkdtemp(prefix="test_upload_"))
try:
    good_path, good_manifest = make_update.build_release(notes="uploaded from a phone", out_dir=scratch)
    tampered = io.BytesIO()
    with zipfile.ZipFile(good_path) as src, zipfile.ZipFile(tampered, "w", zipfile.ZIP_DEFLATED) as dst:
        for item in src.infolist():
            data = src.read(item.filename)
            if item.filename == "mes_update.json":
                doc = json.loads(data)
                doc["to_version"] = "PT-V0.01"  # signature no longer matches
                data = json.dumps(doc, indent=2).encode()
            dst.writestr(item, data)
    tampered.seek(0)
    r = client.post("/api/updates/upload", files={"file": ("update.zip", tampered, "application/zip")}, headers=CSRF)
    check(r.status_code == 400 and "signature" in r.json()["detail"].lower(),
          f"a package altered after it was signed is refused, not silently accepted (got {r.status_code}, {r.json()})")
    check(set(updates_dir.iterdir()) == before, "...and it isn't left sitting in updates\\ either")

    # The genuine article: accepted, reported correctly, and nothing else
    # about it (its actual bytes) is trusted differently for having arrived
    # this way.
    with open(good_path, "rb") as fh:
        r = client.post("/api/updates/upload", files={"file": ("update.zip", fh, "application/zip")}, headers=CSRF)
    check(r.status_code == 200, f"a real, validly-signed package upload succeeds (got {r.status_code} {r.text[:200]})")
    uploaded = r.json()
    check(uploaded["to_version"] == good_manifest["to_version"] and uploaded["notes"] == "uploaded from a phone",
          f"...and reports the package's own manifest back accurately (got {uploaded})")
    check(uploaded["filename"] != "update.zip",
          "...saved under a name this PC picked, not the one the browser sent")
    check(uploaded["current"] is True and uploaded["newer"] is False,
          f"...and correctly reads as this PC's own running version, not newer (got {uploaded})")
    saved = updates_dir / uploaded["filename"]
    check(saved.is_file(), f"...and it is really sitting in updates\\ under that name ({saved})")
finally:
    shutil.rmtree(scratch, ignore_errors=True)
    for extra in set(updates_dir.iterdir() if updates_dir.is_dir() else []) - before:
        extra.unlink(missing_ok=True)
check(set(updates_dir.iterdir()) == before, "the test cleaned up after itself - nothing it uploaded is left in updates\\")

# /apply-uploaded's own safe-to-call-for-real paths: nothing past these
# checks ever runs setup/apply_update.py's real pipeline.
r = client.post("/api/updates/apply-uploaded", json={"filename": "not_a_real_file.zip"}, headers=CSRF)
check(r.status_code == 404, f"applying a filename that was never uploaded is refused (got {r.status_code})")
r = client.post("/api/updates/apply-uploaded", json={"filename": "../../../../etc/passwd"}, headers=CSRF)
check(r.status_code == 404,
      f"a filename that tries to walk out of updates\\ is refused the same way, not treated as a real path (got {r.status_code})")

login("manager", "admin123")

print("\n" + "=" * 66)
if FAILS:
    print(f"{len(FAILS)} of {CHECKS} API ADMIN CHECKS FAILED:")
    for f in FAILS:
        print(f"  - {f}")
else:
    print(f"ALL {CHECKS} API ADMIN ASSERTIONS PASSED")
raise SystemExit(1 if FAILS else 0)
