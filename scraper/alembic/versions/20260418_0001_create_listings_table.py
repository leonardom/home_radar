"""Create listings table

Revision ID: 20260418_0001
Revises:
Create Date: 2026-04-18 00:00:00

"""

from __future__ import annotations

import sqlalchemy as sa

from alembic import op

# revision identifiers, used by Alembic.
revision = "20260418_0001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "listings",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("source", sa.String(), nullable=False),
        sa.Column("department", sa.String(), nullable=False),
        sa.Column("listing_url", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=True),
        sa.Column("cover_image_url", sa.String(), nullable=True),
        sa.Column("region", sa.String(), nullable=True),
        sa.Column("status", sa.String(), nullable=True),
        sa.Column("price_raw", sa.String(), nullable=True),
        sa.Column("price_value", sa.Float(), nullable=True),
        sa.Column("price_frequency", sa.String(), nullable=True),
        sa.Column("beds", sa.Integer(), nullable=True),
        sa.Column("receptions", sa.Integer(), nullable=True),
        sa.Column("baths", sa.Integer(), nullable=True),
        sa.Column("property_type", sa.String(), nullable=True),
        sa.Column("scraped_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("content_hash", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("last_seen_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("source", "listing_url", name="uq_listings_source_url"),
    )


def downgrade() -> None:
    op.drop_table("listings")
