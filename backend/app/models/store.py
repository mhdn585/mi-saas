import time
import uuid

from app.config import CURRENCIES
from app.extensions import db


def _now_ms() -> int:
    return int(time.time() * 1000)


class Store(db.Model):
    __tablename__ = "stores"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(60), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    currency = db.Column(db.String(3), nullable=False, default="USD")
    logo_asset_id = db.Column(
        db.String(36),
        db.ForeignKey("media_assets.id", ondelete="SET NULL"),
        nullable=True,
    )
    # Tema de personalización de la tienda pública: JSON con 7 colores
    # camelCase (bg, fg, surface, muted, line, accent, accentFg) en hex.
    # NULL = colores por defecto del sistema.
    theme = db.Column(db.JSON, nullable=True)
    created_at = db.Column(db.BigInteger, default=_now_ms, nullable=False)
    updated_at = db.Column(
        db.BigInteger, default=_now_ms, onupdate=_now_ms, nullable=False
    )

    __table_args__ = (
        db.CheckConstraint("TRIM(name) <> ''", name="name_not_blank"),
        db.CheckConstraint(
            f"currency IN ({', '.join(repr(c) for c in CURRENCIES)})",
            name="currency_valid",
        ),
    )

    products = db.relationship(
        "Product",
        backref="store",
        cascade="all, delete-orphan",
        passive_deletes=True,
        lazy=True,
    )

    logo_asset = db.relationship("MediaAsset", lazy="joined", innerjoin=False)

    @property
    def logo(self) -> str | None:
        return self.logo_asset.url if self.logo_asset else None

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description or "",
            "currency": self.currency,
            "logo": self.logo,
            "theme": self.theme,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
