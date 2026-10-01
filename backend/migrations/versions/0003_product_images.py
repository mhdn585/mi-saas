"""imágenes de producto normalizadas + logo de tienda referenciado

Revision ID: 0003
Revises: 0002
Create Date: 2026-10-01
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "product_images",
        sa.Column("product_id", sa.String(36), nullable=False),
        sa.Column("media_asset_id", sa.String(36), nullable=False),
        sa.Column("position", sa.SmallInteger(), nullable=False),
        sa.Column("created_at", sa.BigInteger(), nullable=False),
        sa.PrimaryKeyConstraint("product_id", "media_asset_id", name="pk_product_images"),
        sa.ForeignKeyConstraint(
            ["product_id"],
            ["products.id"],
            name="fk_product_images_product_id_products",
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["media_asset_id"],
            ["media_assets.id"],
            name="fk_product_images_media_asset_id_media_assets",
            ondelete="RESTRICT",
        ),
        sa.UniqueConstraint(
            "product_id", "position", name="uq_product_images_product_id_position"
        ),
        sa.CheckConstraint("position >= 0", name="position_positive"),
    )
    op.create_index(
        "ix_product_images_media_asset", "product_images", ["media_asset_id"]
    )
    op.add_column(
        "stores",
        sa.Column("logo_asset_id", sa.String(36), nullable=True),
    )
    op.create_foreign_key(
        "fk_stores_logo_asset_id_media_assets",
        "stores",
        "media_assets",
        ["logo_asset_id"],
        ["id"],
        ondelete="SET NULL",
    )


def downgrade() -> None:
    op.drop_constraint(
        "fk_stores_logo_asset_id_media_assets", "stores", type_="foreignkey"
    )
    op.drop_column("stores", "logo_asset_id")
    op.drop_index("ix_product_images_media_asset", table_name="product_images")
    op.drop_table("product_images")
