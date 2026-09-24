"""Whether an account has already been shown the interactive guide.

New hires get walked through the app once - what each screen is, how a shift
actually goes, where the PDF guides live - the moment they first sign in.
Recorded on the account so it survives a different device or a cleared
browser, the same reason last_station lives here instead of in the tab.

Defaulting to true for every account that already exists: the tour is for
someone who has never seen this screen before, not a surprise sprung on
people already running shifts.

Revision ID: 0026_tour_seen
Revises: 0025_pump_type
Create Date: 2026-09-24
"""
import sqlalchemy as sa
from alembic import op

revision = "0026_tour_seen"
down_revision = "0025_pump_type"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("users", sa.Column("tour_seen", sa.Boolean(), nullable=False, server_default=sa.true()))
    op.execute("UPDATE users SET tour_seen = TRUE")


def downgrade():
    op.drop_column("users", "tour_seen")
