"""owner_id en stores: cada tienda pertenece a un usuario

Revision ID: 0007
Revises: 0006
Create Date: 2026-10-02
"""
from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0007"
down_revision: str | None = "0006"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.add_column(
        "stores",
        sa.Column("owner_id", sa.String(36), nullable=True),
    )
    op.create_index("ix_stores_owner_id", "stores", ["owner_id"])
    op.create_foreign_key(
        "fk_stores_owner_id_users",
        "stores",
        "users",
        ["owner_id"],
        ["id"],
        ondelete="CASCADE",
    )
    # Las tiendas existentes quedan sin dueño (NULL): se asignan con
    #   flask user claim-orphan-stores EMAIL


def downgrade() -> None:
    op.drop_constraint(
        "fk_stores_owner_id_users", "stores", type_="foreignkey"
    )
    op.drop_index("ix_stores_owner_id", table_name="stores")
    op.drop_column("stores", "owner_id")
