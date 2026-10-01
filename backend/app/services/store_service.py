from app.errors import NotFoundError, ValidationError
from app.models.media_asset import MediaAsset
from app.models.product import Product
from app.repositories.store_repo import store_repository
from app.services import media_service


def list_stores():
    return store_repository.find_all()


def get_store(store_id: str):
    store = store_repository.find_by_id(store_id)
    if store is None:
        raise NotFoundError("Tienda no encontrada")
    return store


def create_store(data: dict):
    data = dict(data)
    _apply_logo(data)
    return store_repository.create(data)


def update_store(store_id: str, patch: dict):
    patch = dict(patch)
    had_logo = "logo" in patch
    old_logo_asset_id = None
    if had_logo:
        store = get_store(store_id)
        old_logo_asset_id = store.logo_asset_id
        _apply_logo(patch)
    store = store_repository.update(store_id, patch)
    if store is None:
        raise NotFoundError("Tienda no encontrada")
    if had_logo and old_logo_asset_id:
        if patch.get("logo_asset_id") != old_logo_asset_id:
            media_service.release_assets([old_logo_asset_id])
    return store


def delete_store(store_id: str):
    store = store_repository.find_by_id(store_id)
    if store is None:
        raise NotFoundError("Tienda no encontrada")

    asset_ids: set[str] = set()
    if store.logo_asset_id:
        asset_ids.add(store.logo_asset_id)
    for product in Product.query.filter_by(store_id=store_id).all():
        asset_ids.update(link.media_asset_id for link in product.product_images)

    store_repository.remove(store_id)
    media_service.release_assets(asset_ids)


def _apply_logo(data: dict) -> None:
    if "logo" not in data:
        return
    url = data.pop("logo")
    if url is None:
        data["logo_asset_id"] = None
        return
    asset = media_service.find_asset_by_url(url)
    if asset is None:
        raise ValidationError(
            f"Logo no reconocido: {url}. Subilo primero vía /api/v1/media."
        )
    if asset.status == MediaAsset.STATUS_DELETED:
        raise ValidationError(f"El logo {url} fue eliminado.")
    if asset.status == MediaAsset.STATUS_ORPHAN:
        media_service.reactivate(asset)
    data["logo_asset_id"] = asset.id
