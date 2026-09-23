"""utils._get_pg_bin() finding pg_dump on a portable/bundled-database PC.

The bug this guards: the portable fallback used pgserver.POSTGRES_BIN_PATH,
which reads as the obvious way to find pgserver's bundled binaries but does
not actually exist at that name - it lives in pgserver's private _commands
submodule, and that submodule's own __all__ leaves it out of the wildcard
import pgserver/__init__.py does. So `pgserver.POSTGRES_BIN_PATH` has always
raised AttributeError, silently swallowed by this function's own try/except,
which skipped the whole portable-database branch on every PC that needed it -
"generate a backup" failed with "pg_dump was not found" on any PC running the
bundled database with no separately-installed PostgreSQL, which describes
every portable install by definition. A dev machine with a real PostgreSQL
install and PG_BIN_DIR set never reached this branch and never saw it fail.

Exercised with PG_BIN_DIR, PATH and the Program Files scan all disabled, so
the only way this can pass is the pgserver-bundled path actually being found -
mirroring a real portable PC, which has none of those three either.
"""
import glob as glob_module
import os
import pathlib
import shutil
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT))

import utils  # noqa: E402

FAILS, CHECKS = [], 0


def check(cond, label):
    global CHECKS
    CHECKS += 1
    if not cond:
        FAILS.append(label)
        print(f"  FAIL  {label}")


print("=" * 66)
print("PG_BIN LOOKUP: finding pg_dump on a portable PC")
print("=" * 66)

import pgserver  # noqa: E402

real_bin_dir = os.path.dirname(os.path.abspath(pgserver.__file__)) + os.sep + "pginstall" + os.sep + "bin"
check(os.path.isdir(real_bin_dir),
      f"pgserver actually ships its bundled binaries where this fix expects them ({real_bin_dir})")
check(os.path.isfile(os.path.join(real_bin_dir, "pg_dump.exe" if os.name == "nt" else "pg_dump")),
      "...and pg_dump itself is one of them")

# The exact attribute the old code trusted - proving the bug is real, not a
# guess about pgserver's internals.
had_it = hasattr(pgserver, "POSTGRES_BIN_PATH")
check(not had_it,
      "pgserver.POSTGRES_BIN_PATH does not exist at the top level - confirming why the old lookup failed "
      "(if this ever starts passing, a pgserver upgrade changed its exports and the comment above is stale)")

# Simulate a portable PC: nothing in PG_BIN_DIR, nothing on PATH, no
# separately-installed PostgreSQL for the Program Files scan to find.
real_which, real_glob = shutil.which, glob_module.glob
os.environ.pop("PG_BIN_DIR", None)
utils.shutil.which = lambda name: None
utils.glob.glob = lambda *a, **k: []
try:
    found = utils._get_pg_bin("pg_dump")
finally:
    utils.shutil.which = real_which
    utils.glob.glob = real_glob

check(os.path.isfile(found),
      f"with PATH, PG_BIN_DIR and the Program Files scan all unavailable - the portable case - "
      f"pg_dump is still found (got {found!r})")
check(os.path.normcase(os.path.abspath(found)) == os.path.normcase(os.path.abspath(
      os.path.join(real_bin_dir, "pg_dump.exe" if os.name == "nt" else "pg_dump"))),
      "...and it is pgserver's own bundled copy, not something found by accident")

print("\n" + "=" * 66)
if FAILS:
    print(f"{len(FAILS)} of {CHECKS} PG_BIN LOOKUP CHECKS FAILED:")
    for f in FAILS:
        print(f"  - {f}")
else:
    print(f"ALL {CHECKS} PG_BIN LOOKUP ASSERTIONS PASSED")
raise SystemExit(1 if FAILS else 0)
