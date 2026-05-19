"""initial schema

Revision ID: 0001_initial
Revises:
Create Date: 2026-05-19 00:00:00
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "0001_initial"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "teams",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("competition", sa.String(), nullable=False),
    )
    op.create_table(
        "players",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("role", sa.String()),
        sa.Column("batting_hand", sa.String()),
        sa.Column("bowling_style", sa.String()),
    )
    op.create_index("ix_players_name", "players", ["name"])

    op.create_table(
        "venues",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("city", sa.String()),
        sa.Column("country", sa.String()),
        sa.Column("avg_first_innings", sa.Integer()),
        sa.Column("pitch_character", sa.String()),
    )

    op.create_table(
        "matches",
        sa.Column("id", sa.String(), primary_key=True),
        sa.Column("competition", sa.String(), nullable=False),
        sa.Column("season", sa.String()),
        sa.Column("match_date", sa.Date(), nullable=False),
        sa.Column("venue_id", sa.String(), sa.ForeignKey("venues.id")),
        sa.Column("team_home_id", sa.String(), sa.ForeignKey("teams.id")),
        sa.Column("team_away_id", sa.String(), sa.ForeignKey("teams.id")),
        sa.Column("toss_winner_id", sa.String(), sa.ForeignKey("teams.id")),
        sa.Column("toss_decision", sa.String()),
        sa.Column("winner_id", sa.String(), sa.ForeignKey("teams.id")),
        sa.Column("result_margin", sa.String()),
        sa.Column("created_at", sa.DateTime()),
    )
    op.create_index("ix_matches_competition", "matches", ["competition"])
    op.create_index("ix_matches_season", "matches", ["season"])
    op.create_index("ix_matches_match_date", "matches", ["match_date"])

    op.create_table(
        "innings",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("match_id", sa.String(), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("innings_number", sa.Integer(), nullable=False),
        sa.Column("batting_team_id", sa.String(), sa.ForeignKey("teams.id")),
        sa.Column("bowling_team_id", sa.String(), sa.ForeignKey("teams.id")),
        sa.Column("total_runs", sa.Integer()),
        sa.Column("total_wickets", sa.Integer()),
        sa.Column("total_overs", sa.Float()),
    )
    op.create_index("ix_innings_match_id", "innings", ["match_id"])

    op.create_table(
        "balls",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("match_id", sa.String(), sa.ForeignKey("matches.id"), nullable=False),
        sa.Column("innings_number", sa.Integer(), nullable=False),
        sa.Column("over", sa.Integer(), nullable=False),
        sa.Column("ball", sa.Integer(), nullable=False),
        sa.Column("batter_id", sa.String(), sa.ForeignKey("players.id")),
        sa.Column("non_striker_id", sa.String(), sa.ForeignKey("players.id")),
        sa.Column("bowler_id", sa.String(), sa.ForeignKey("players.id")),
        sa.Column("runs_batter", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("runs_extras", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("runs_total", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("extras_type", sa.String()),
        sa.Column("wicket", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("dismissal_kind", sa.String()),
        sa.Column("dismissed_id", sa.String(), sa.ForeignKey("players.id")),
        sa.Column("phase", sa.String()),
        sa.Column("is_boundary", sa.Boolean(), server_default=sa.false()),
        sa.Column("wagon_zone", sa.Integer()),
        sa.Column("line", sa.String()),
        sa.Column("length", sa.String()),
        sa.Column("shot", sa.String()),
    )
    op.create_index("ix_balls_batter_id", "balls", ["batter_id"])
    op.create_index("ix_balls_bowler_id", "balls", ["bowler_id"])
    op.create_index("ix_balls_phase", "balls", ["phase"])
    op.create_index("ix_balls_match_innings_over_ball", "balls",
                    ["match_id", "innings_number", "over", "ball"])
    op.create_index("ix_balls_batter_bowler", "balls",
                    ["batter_id", "bowler_id"])


def downgrade() -> None:
    op.drop_table("balls")
    op.drop_table("innings")
    op.drop_table("matches")
    op.drop_table("venues")
    op.drop_table("players")
    op.drop_table("teams")