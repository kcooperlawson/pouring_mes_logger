"""The career milestone ladder (milestones.py) and /api/summary/career.

A tier is a total that has been passed, not something anybody awards, so the
only things worth checking are that the ladder is sane, that the progress bar
measures the gap being climbed rather than the distance from zero, and that
the endpoint reports the caller's own lifetime total.
"""
import pathlib
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

from _boot import boot  # noqa: E402

boot(fresh=True)

from starlette.testclient import TestClient  # noqa: E402

import api.main  # noqa: E402
import crud  # noqa: E402
import milestones  # noqa: E402

FAILS, CHECKS = [], 0


def check(cond, label):
    global CHECKS
    CHECKS += 1
    if not cond:
        FAILS.append(label)
        print(f"  FAIL  {label}")


print("=" * 66)
print("MILESTONES: the career ladder")
print("=" * 66)

tiers = milestones.TIERS
check([t[0] for t in tiers] == sorted(t[0] for t in tiers), "the ladder only ever goes up")
check(len({t[0] for t in tiers}) == len(tiers), "...with no rung repeated")
check(tiers[-1][0] == 10_000_000, f"it tops out at ten million (got {tiers[-1][0]})")
# Paced against this floor: a strong day is three or four thousand units, so a
# ladder whose first rungs are hundreds is spent before first break.
check(tiers[0][0] >= 1_000, f"the first rung is a day's work, not an hour's (got {tiers[0][0]})")
check(all(b[0] >= a[0] * 2 for a, b in zip(tiers, tiers[1:])),
      "every rung is at least double the one below it, so none of them go by unnoticed")
check(all(t[1] and t[2] for t in tiers), "every rung has a name and a badge")

check(milestones.current(0) is None, "nobody starts with a badge")
check(milestones.next_tier(0)[0] == 1_000, "the first one is a day or so away from a standing start")
check(milestones.current(999) is None and milestones.current(1_000)[0] == 1_000,
      "a tier is reached by passing the number, not approaching it")
check(milestones.current(30_000)[0] == 25_000 and milestones.next_tier(30_000)[0] == 50_000,
      "the highest one passed is the one held")
check(len(milestones.earned(100_000)) == 5,
      f"everything below it stays earned (got {len(milestones.earned(100_000))})")
# The case that prompted the re-pacing: a big day should not clear a handful
# of badges in one go.
check(len(milestones.earned(4_000)) == 1,
      f"a strong single day earns one badge, not five (got {len(milestones.earned(4_000))})")
check(milestones.next_tier(10_000_000) is None and milestones.progress(20_000_000)["pct"] == 100.0,
      "past the top rung there is nothing left to chase, and nothing breaks")

# The bar measures the rung being climbed. Measured from zero, somebody on
# 600,000 would sit at 60% of a million for months on end and never appear to
# move; measured from the rung below, they are 40% of the way from 500k to 1M.
p = milestones.progress(600_000)
check(p["current"][0] == 500_000 and p["next"][0] == 1_000_000,
      f"between rungs, both ends are known (got {p['current']}, {p['next']})")
check(p["pct"] == 20.0, f"...and the bar measures the gap between them, not the distance from zero (got {p['pct']})")
check(p["remaining"] == 400_000, f"...with what is left to the next one (got {p['remaining']})")
check(milestones.progress(0)["pct"] == 0.0, "a fresh start reads as empty rather than as nearly there")

# --- the endpoint ----------------------------------------------------------
client = TestClient(api.main.app)
CSRF = {"x-mes-client": "1"}

check(client.get("/api/summary/career").status_code == 401, "anonymous is refused")

client.post("/api/auth/login", json={"username": "operator", "pin": "1234"}, headers=CSRF)
body = client.get("/api/summary/career").json()
check(body["units_lifetime"] == 0 and body["current"] is None,
      f"a new operator has nothing yet (got {body['units_lifetime']})")
check(body["next"]["at"] == 1_000 and body["remaining"] == 1_000,
      f"...and the first rung to go (got {body['next']}, {body['remaining']})")
check(len(body["tiers"]) == len(tiers), "the whole ladder comes with it, so locked badges can be shown too")

crud.add_hourly_log(operator_name="Demo Operator", pump_station="Badge Pump", shift="Shift 1",
                    cartridge_type="V2", resin_type="Grey", lot_number="LOT-M1",
                    bottles=140, scrap_empty=0, scrap_filled=0)
crud.add_hourly_log(operator_name="Somebody Else", pump_station="Badge Pump", shift="Shift 1",
                    cartridge_type="V2", resin_type="Grey", lot_number="LOT-M1",
                    bottles=9_000, scrap_empty=0, scrap_filled=0)
body = client.get("/api/summary/career").json()
check(body["units_lifetime"] == 140,
      f"the lifetime total is this operator's own, not the floor's (got {body['units_lifetime']})")
check(body["current"] is None and body["next"]["at"] == 1_000,
      f"...and 140 units is still short of the first rung (got {body['current']}, {body['next']})")
check(body["units_today"] == 140, f"today's share of it comes too, for the ring (got {body['units_today']})")

check(crud.operator_lifetime_units("demo operator ") == 140,
      "the total is found however the name was typed, like every other per-operator reader")
check(crud.operator_lifetime_units("Nobody At All") == 0, "somebody with no logs has no total, rather than an error")

print("\n" + "=" * 66)
if FAILS:
    print(f"{len(FAILS)} of {CHECKS} MILESTONE CHECKS FAILED:")
    for f in FAILS:
        print(f"  - {f}")
else:
    print(f"ALL {CHECKS} MILESTONE ASSERTIONS PASSED")
raise SystemExit(1 if FAILS else 0)
