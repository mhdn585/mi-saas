import time
import uuid

from app.extensions import db


def _now_ms() -> int:
    return int(time.time() * 1000)


class Product(db.Model):
    __tablename__ = "products"

    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    store_id = db.Column(
        db.String(36),
        db.ForeignKey("stores.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    name = db.Column(db.String(80), nullable=False)
    description = db.Column(db.Text, nullable=False, default="")
    price = db.Column(db.Numeric(10, 2), nullable=False, default=0)
    stock = db.Column(db.Integer, nullable=False, default=0)
    published = db.Column(db.Boolean, nullable=False, default=True)
    created_at = db.Column(db.BigInteger, default=_now_ms, nullable=False)
    updated_at = db.Column(
        db.BigInteger, default=_now_ms, onupdate=_now_ms, nullable=False
    )

    product_images = db.relationship(
        "ProductImage",
        backref="product",
        cascade="all, delete-orphan",
        passive_deletes=True,
        order_by="ProductImage.position",
        lazy="selectin",
    )

    __table_args__ = (
        db.Index("ix_products_store_published_created", "store_id", "published", "created_at"),
        db.Index("ix_products_store_created", "store_id", "created_at"),
        db.CheckConstraint("TRIM(name) <> ''", name="name_not_blank"),
        db.CheckConstraint("price >= 0", name="price_non_negative"),
        db.CheckConstraint("stock >= 0", name="stock_non_negative"),
    )

    @property
    def image_urls(self) -> list[str]:
        return [link.media_asset.url for link in self.product_images]

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "storeId": self.store_id,
            "name": self.name,
            "description": self.description or "",
            "price": float(self.price),
            "stock": self.stock,
            "images": self.image_urls,
            "published": self.published,
            "createdAt": self.created_at,
            "updatedAt": self.updated_at,
        }
