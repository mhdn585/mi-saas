import time
import uuid

from app.extensions import db


def _now_ms() -> int:
    return int(time.time() * 1000)


class MediaAsset(db.Model):
    __tablename__ = "media_assets"

    STATUS_ACTIVE = "active"
    STATUS_ORPHAN = "orphan"
    STATUS_DELETED = "deleted"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    filename = db.Column(db.String(255), nullable=False, unique=True)
    mime_type = db.Column(db.String(100), nullable=False)
    format = db.Column(db.String(20), nullable=False)
    size_bytes = db.Column(db.Integer, nullable=False)
    width = db.Column(db.Integer, nullable=True)
    height = db.Column(db.Integer, nullable=True)
    status = db.Column(db.String(20), nullable=False, default=STATUS_ACTIVE)
    created_at = db.Column(db.BigInteger, default=_now_ms, nullable=False)
    updated_at = db.Column(
        db.BigInteger, default=_now_ms, onupdate=_now_ms, nullable=False
    )

    __table_args__ = (
        db.CheckConstraint(
            "status IN ('active', 'orphan', 'deleted')", name="status_valid"
        ),
        db.CheckConstraint("size_bytes >= 0", name="size_non_negative"),
        db.Index("ix_media_assets_status", "status"),
    )

    @property
    def url(self) -> str:
        return f"/media/{self.filename}"

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "filename": self.filename,
            "url": self.url,
            "mimeType": self.mime_type,
            "format": self.format,
            "sizeBytes": self.size_bytes,
            "width": self.width,
            "height": self.height,
            "status": self.status,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
