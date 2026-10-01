from sqlalchemy import func, or_, select

from app.errors import NotFoundError
from app.extensions import db
from app.models.media_asset import MediaAsset
from app.models.product import Product
from app.models.product_image import ProductImage
from app.repositories.product_repo import product_repository
from app.services import media_service


def list_products(store_id, search=None, published_only=False, page=1, per_page=50):
    stmt = select(Product).where(Product.store_id == store_id)
    if published_only:
        stmt = stmt.where(Product.published.is_(True))
    if search:
        term = f"%{search.strip().lower()}%"
        stmt = stmt.where(
            or_(
                func.lower(Product.name).like(term),
                func.lower(Product.description).like(term),
            )
        )
    stmt = stmt.order_by(Product.created_at.desc())
    return db.paginate(
        stmt, page=page, per_page=per_page, max_per_page=200, error_out=False
    )


def get_product(product_id, store_id=None):
    product = product_repository.find_by_id(product_id)
    if product is None:
        raise NotFoundError("Producto no encontrado")
    if store_id is not None and product.store_id != store_id:
        raise NotFoundError("Producto no encontrado")
    return product


def create_product(store_id: str, data: dict):
    data = dict(data)
    urls = data.pop("images", None) or []
    assets = media_service.resolve_asset_urls(urls)
    data["store_id"] = store_id
    product = product_repository.create(data)
    _set_links(product, assets)
    db.session.commit()
    return product


def update_product(product_id: str, patch: dict):
    patch = dict(patch)
    new_assets = None
    if "images" in patch:
        urls = patch.pop("images") or []
        new_assets = media_service.resolve_asset_urls(urls)
    product = product_repository.update(product_id, patch)
    if product is None:
        raise NotFoundError("Producto no encontrado")
    if new_assets is not None:
        old_ids = {link.media_asset_id for link in product.product_images}
        product.product_images.clear()
        db.session.flush()
        _set_links(product, new_assets)
        db.session.commit()
        media_service.release_assets(old_ids - {a.id for a in new_assets})
    return product


def delete_product(product_id: str):
    product = product_repository.find_by_id(product_id)
    if product is None:
        raise NotFoundError("Producto no encontrado")
    asset_ids = {link.media_asset_id for link in product.product_images}
    product_repository.remove(product_id)
    media_service.release_assets(asset_ids)


def _set_links(product: Product, assets: list[MediaAsset]) -> None:
    for position, asset in enumerate(assets):
        product.product_images.append(
            ProductImage(
                product_id=product.id,
                media_asset_id=asset.id,
                position=position,
            )
        )
        if asset.status == MediaAsset.STATUS_ORPHAN:
            asset.status = MediaAsset.STATUS_ACTIVE
