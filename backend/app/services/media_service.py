import io
import time
import uuid
from pathlib import Path

from flask import current_app
from PIL import Image

from app.errors import ValidationError
from app.extensions import db
from app.models.media_asset import MediaAsset

ALLOWED_FORMATS = {"JPEG", "PNG", "WEBP", "GIF"}
MAX_DIMENSION = 1000
JPEG_QUALITY = 85


def save_upload(file_storage) -> dict:
    """Valida, normaliza a JPEG, guarda el archivo y registra el MediaAsset."""
    max_bytes = current_app.config["MAX_UPLOAD_MB"] * 1024 * 1024
    data = file_storage.read(max_bytes + 1)
    if len(data) > max_bytes:
        raise ValidationError(
            f"La imagen supera el máximo de "
            f"{current_app.config['MAX_UPLOAD_MB']} MB."
        )
    if not data:
        raise ValidationError("El archivo está vacío.")

    try:
        Image.open(io.BytesIO(data)).verify()
    except Exception:
        raise ValidationError("El archivo no es una imagen válida.") from None

    img = Image.open(io.BytesIO(data))
    fmt = (img.format or "").upper()
    if fmt not in ALLOWED_FORMATS:
        raise ValidationError(
            "Formato no soportado. Usa JPG, PNG, WEBP o GIF."
        )

    img = img.convert("RGB")
    img.thumbnail((MAX_DIMENSION, MAX_DIMENSION))

    filename = f"{uuid.uuid4().hex}.jpg"
    media_dir = Path(current_app.config["MEDIA_FOLDER"])
    media_dir.mkdir(parents=True, exist_ok=True)
    path = media_dir / filename
    img.save(path, "JPEG", quality=JPEG_QUALITY, optimize=True)

    asset = MediaAsset(
        filename=filename,
        mime_type="image/jpeg",
        format="JPEG",
        size_bytes=path.stat().st_size,
        width=img.size[0],
        height=img.size[1],
        status=MediaAsset.STATUS_ACTIVE,
    )
    db.session.add(asset)
    db.session.commit()
    return {"url": asset.url, "filename": filename}


def find_asset_by_url(url: str) -> MediaAsset | None:
    """Resuelve una url `/media/<filename>` contra media_assets."""
    if not url or "/media/" not in url:
        return None
    filename = url.rsplit("/media/", 1)[-1]
    if "/" in filename or "\\" in filename or ".." in filename:
        return None
    return db.session.scalar(
        db.select(MediaAsset).where(MediaAsset.filename == filename)
    )


def resolve_asset_urls(urls: list[str]) -> list[MediaAsset]:
    """Estricto: cada url debe existir en media_assets; si no, ValidationError."""
    assets = []
    seen: set[str] = set()
    for url in urls:
        asset = find_asset_by_url(url)
        if asset is None:
            raise ValidationError(
                f"Imagen no reconocida: {url}. Subila primero vía /api/v1/media."
            )
        if asset.status == MediaAsset.STATUS_DELETED:
            raise ValidationError(f"La imagen {url} fue eliminada.")
        if asset.id in seen:
            raise ValidationError(f"Imagen duplicada: {url}.")
        seen.add(asset.id)
        assets.append(asset)
    return assets


def count_references(asset: MediaAsset) -> int:
    from app.models.product_image import ProductImage
    from app.models.store import Store

    in_products = db.session.scalar(
        db.select(db.func.count()).where(ProductImage.media_asset_id == asset.id)
    )
    as_logo = db.session.scalar(
        db.select(db.func.count()).where(Store.logo_asset_id == asset.id)
    )
    return (in_products or 0) + (as_logo or 0)


def release_assets(asset_ids) -> None:
    """Tras borrar referencias: activa → orphan si quedaron sin uso."""
    ids = list(asset_ids)
    if not ids:
        return
    assets = db.session.scalars(
        db.select(MediaAsset).where(
            MediaAsset.id.in_(ids),
            MediaAsset.status == MediaAsset.STATUS_ACTIVE,
        )
    ).all()
    for asset in assets:
        if count_references(asset) == 0:
            asset.status = MediaAsset.STATUS_ORPHAN
    db.session.commit()


def reactivate(asset: MediaAsset) -> None:
    if asset.status == MediaAsset.STATUS_ORPHAN:
        asset.status = MediaAsset.STATUS_ACTIVE
        db.session.commit()


def cleanup_orphans(grace_days: int = 7) -> dict:
    """Marca huérfanos sin referencia y borra archivos tras el período de gracia."""
    # 1. active sin referencias (subidos que nunca se guardaron) → orphan
    actives = db.session.scalars(
        db.select(MediaAsset).where(MediaAsset.status == MediaAsset.STATUS_ACTIVE)
    ).all()
    for asset in actives:
        if count_references(asset) == 0:
            asset.status = MediaAsset.STATUS_ORPHAN
    db.session.commit()

    # 2. borrar archivos orphan más antiguos que la gracia
    cutoff_ms = int((time.time() - grace_days * 86400) * 1000)
    orphans = db.session.scalars(
        db.select(MediaAsset)
        .where(
            MediaAsset.status == MediaAsset.STATUS_ORPHAN,
            MediaAsset.updated_at < cutoff_ms,
        )
        .order_by(MediaAsset.updated_at)
    ).all()
    deleted = 0
    for asset in orphans:
        try:
            (Path(current_app.config["MEDIA_FOLDER"]) / asset.filename).unlink(
                missing_ok=True
            )
        except OSError:
            continue
        asset.status = MediaAsset.STATUS_DELETED
        deleted += 1
    db.session.commit()
    return {"found": len(orphans), "deleted": deleted}
