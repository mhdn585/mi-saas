import time

from app.extensions import db


def _now_ms() -> int:
    return int(time.time() * 1000)


class ProductImage(db.Model):
    __tablename__ = "product_images"

    product_id = db.Column(
        db.String(36),
        db.ForeignKey("products.id", ondelete="CASCADE"),
        primary_key=True,
    )
    media_asset_id = db.Column(
        db.String(36),
        db.ForeignKey("media_assets.id", ondelete="RESTRICT"),
        primary_key=True,
    )
    position = db.Column(db.SmallInteger, nullable=False)
    created_at = db.Column(db.BigInteger, default=_now_ms, nullable=False)

    __table_args__ = (
        db.UniqueConstraint("product_id", "position"),
        db.CheckConstraint("position >= 0", name="position_positive"),
        db.Index("ix_product_images_media_asset", "media_asset_id"),
    )

    media_asset = db.relationship(
        "MediaAsset",
        lazy="joined",
        innerjoin=False,
    )
