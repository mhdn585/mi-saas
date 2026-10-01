from sqlalchemy.exc import IntegrityError

from app.errors import ConflictError, NotFoundError
from app.extensions import db
from app.models.saved_palette import SavedPalette
from app.repositories.base import Repository

palette_repository: Repository[SavedPalette] = Repository(SavedPalette)


def list_palettes(store_id: str) -> list[SavedPalette]:
    return (
        SavedPalette.query.filter_by(store_id=store_id)
        .order_by(SavedPalette.created_at)
        .all()
    )


def get_palette(palette_id: str, store_id: str | None = None) -> SavedPalette:
    palette = db.session.get(SavedPalette, palette_id)
    if palette is None or (store_id is not None and palette.store_id != store_id):
        raise NotFoundError("Paleta no encontrada")
    return palette


def create_palette(store_id: str, data: dict) -> SavedPalette:
    try:
        return palette_repository.create({"store_id": store_id, **data})
    except IntegrityError:
        db.session.rollback()
        raise ConflictError("Ya existe una paleta guardada con ese nombre") from None


def update_palette(palette_id: str, store_id: str, patch: dict) -> SavedPalette:
    get_palette(palette_id, store_id)
    try:
        palette = palette_repository.update(palette_id, patch)
    except IntegrityError:
        db.session.rollback()
        raise ConflictError("Ya existe una paleta guardada con ese nombre") from None
    if palette is None:
        raise NotFoundError("Paleta no encontrada")
    return palette


def delete_palette(palette_id: str, store_id: str) -> None:
    get_palette(palette_id, store_id)
    palette_repository.remove(palette_id)
