"""tema de personalización en stores + paletas guardadas por tienda

Revision ID: 0004
Revises: 0003
Create Date: 2026-10-01
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0004"
down_revision: str | None = "0003"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("theme", sa.JSON(), nullable=True),
    )
    op.create_table(
        "saved_palettes",
        sa.Column("id", sa.String(36), nullable=False),
        sa.Column("store_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(40), nullable=False),
        sa.Column("colors", sa.JSON(), nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.Column("updated_at", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("id", name="pk_saved_palettes"),
        sa.ForeignKeyConstraint(
            ["store_id"],
            ["stores.id"],
            name="fk_saved_palettes_store_id_stores",
            ondelete="CASCADE",
        ),
        sa.UniqueConstraint("store_id", "name", name="uq_saved_palettes_store_id_name"),
        sa.CheckConstraint("TRIM(name) <> ''", name="ck_saved_palettes_name_not_blank"),
    )
    op.create_index(
        op.f("ix_saved_palettes_store_id"), "saved_palettes", ["store_id"]
    )


def downgrade() -> None:
    op.drop_index(op.f("ix_saved_palettes_store_id"), table_name="saved_palettes")
    op.drop_table("saved_palettes")
    op.drop_column("stores", "theme")
