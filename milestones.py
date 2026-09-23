"""Career milestones - what somebody has poured since they started here.

The shift ring counts today and resets overnight, which is right for a shift
and useless as a record of the work. These are cumulative and never reset, so
the number only ever goes one way, and the next one is always in sight.

The ladder is deliberately steep at the top: the early rungs come in a first
week, the middle ones take a season, and the last one is a career. Nothing is
awarded by anybody - a tier is a total that has been passed, computed from the
same production logs as everything else, so it can't be given or taken away.
"""

# (units, label, emoji). Ordered.
# Paced against what this floor actually pours. A strong day on the new pumps
# is three or four thousand units, so a ladder starting at a hundred hands out
# five badges before first break and then goes quiet - which is the opposite of
# the point. The first rung is about a day, the second about a week, the third
# about a month, and the top one is a career. Roughly, at 3,000 a day:
#
#   1,000      a day           250,000    a season
#   5,000      a week          500,000    most of a year
#   25,000     a month         1,000,000  a year and a bit
#   50,000     two months      2,500,000  a few years
#   100,000    six weeks       5,000,000  a long time here
#   10,000,000 a career
TIERS = [
    (1_000, "First Thousand", "🌱"),
    (5_000, "Finding the Rhythm", "🔧"),
    (25_000, "Twenty-Five K", "⚙️"),
    (50_000, "Fifty K", "🥉"),
    (100_000, "Hundred Thousand", "🥈"),
    (250_000, "Quarter Million", "🥇"),
    (500_000, "Half a Million", "🏅"),
    (1_000_000, "The Million", "🎖️"),
    (2_500_000, "Two and a Half Million", "💎"),
    (5_000_000, "Five Million", "🛡️"),
    (10_000_000, "Ten Million", "👑"),
]


def earned(total: int) -> list:
    """Every tier this total has passed, oldest first."""
    return [t for t in TIERS if total >= t[0]]


def current(total: int):
    """The highest tier reached, or None before the first one."""
    done = earned(total)
    return done[-1] if done else None


def next_tier(total: int):
    """The one being worked toward, or None once the ladder is finished."""
    for tier in TIERS:
        if total < tier[0]:
            return tier
    return None


def progress(total: int) -> dict:
    """Where this total sits: what has been reached, what is next, and how far
    through the gap between them it is - measured from the previous tier, not
    from zero, so the bar doesn't sit at 97% for the whole of a long climb."""
    have = current(total)
    upcoming = next_tier(total)
    floor_units = have[0] if have else 0
    if upcoming is None:
        return {"total": total, "current": have, "next": None, "pct": 100.0, "remaining": 0}
    span = upcoming[0] - floor_units
    done = max(0, total - floor_units)
    return {
        "total": total,
        "current": have,
        "next": upcoming,
        "pct": round(min(100.0, done / span * 100), 1) if span else 100.0,
        "remaining": max(0, upcoming[0] - total),
    }


def as_dict(tier) -> dict | None:
    if not tier:
        return None
    return {"at": tier[0], "label": tier[1], "emoji": tier[2]}
