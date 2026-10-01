"""esquema inicial: stores y products con constraints e índices

Revision ID: 0001
Revises:
Create Date: 2026-10-01
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

CURRENCIES = (
    "USD", "EUR", "MXN", "COP", "ARS", "CLP", "PEN",
    "BOB", "UYU", "VES", "DOP", "CRC", "GTQ", "PAB",
)


def upgrade() -> None:
    op.create_table(
        "stores",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("name", sa.String(60), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("currency", sa.String(3), nullable=False, server_default="USD"),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.Column("updated_at", sa.BigInteger(), nullable=False),
        sa.CheckConstraint("TRIM(name) <> ''", name="name_not_blank"),
        sa.CheckConstraint(
            f"currency IN ({', '.join(repr(c) for c in CURRENCIES)})",
            name="currency_valid",
        ),
    )
    op.create_table(
        "products",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("store_id", sa.String(36), nullable=False),
        sa.Column("name", sa.String(80), nullable=False),
        sa.Column("description", sa.Text(), nullable=False, server_default=""),
        sa.Column("price", sa.Numeric(10, 2), nullable=False, server_default="0"),
        sa.Column("stock", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("published", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.Column("updated_at", sa.BigInteger(), nullable=False),
        sa.ForeignKeyConstraint(
            ["store_id"],
            ["stores.id"],
            name="fk_products_store_id_stores",
            ondelete="CASCADE",
        ),
        sa.CheckConstraint("TRIM(name) <> ''", name="name_not_blank"),
        sa.CheckConstraint("price >= 0", name="price_non_negative"),
        sa.CheckConstraint("stock >= 0", name="stock_non_negative"),
    )
    op.create_index(
        "ix_products_store_id", "products", ["store_id"]
    )
    op.create_index(
        "ix_products_store_published_created",
        "products",
        ["store_id", "published", "created_at"],
    )
    op.create_index(
        "ix_products_store_created", "products", ["store_id", "created_at"]
    )


def downgrade() -> None:
    op.drop_index("ix_products_store_created", table_name="products")
    op.drop_index("ix_products_store_published_created", table_name="products")
    op.drop_index("ix_products_store_id", table_name="products")
    op.drop_table("products")
    op.drop_table("stores")
