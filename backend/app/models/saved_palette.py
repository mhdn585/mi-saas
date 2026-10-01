import time
import uuid

from app.extensions import db


def _now_ms() -> int:
    return int(time.time() * 1000)


class SavedPalette(db.Model):
    """Personalización de colores guardada con nombre, reutilizable por la tienda."""

    __tablename__ = "saved_palettes"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id = db.Column(
        db.String(36),
        db.ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(40), nullable=False)
    colors = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.BigInteger, default=_now_ms, nullable=False)
    updated_at = db.Column(
        db.BigInteger, default=_now_ms, onupdate=_now_ms, nullable=False
    )

    __table_args__ = (
        db.CheckConstraint("TRIM(name) <> ''", name="name_not_blank"),
        db.UniqueConstraint("store_id", "name"),
    )

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "storeId": self.store_id,
            "name": self.name,
            "colors": self.colors,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
