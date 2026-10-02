from flask import Blueprint, g, jsonify, request

from app.schemas.palette import PaletteCreateSchema, PaletteUpdateSchema
from app.services import palette_service, store_service
from app.utils.auth import login_required

bp = Blueprint("palettes", __name__)


def _require_owned_store(store_id: str):
    store_service.get_owned_store(store_id, g.current_user.id)


@bp.get("/stores/<store_id>/palettes")
@login_required
def list_palettes(store_id):
    _require_owned_store(store_id)
    palettes = palette_service.list_palettes(store_id)
    return jsonify([palette.to_dict() for palette in palettes])


@bp.post("/stores/<store_id>/palettes")
@login_required
def create_palette(store_id):
    _require_owned_store(store_id)
    data = PaletteCreateSchema().load(request.get_json(silent=True) or {})
    palette = palette_service.create_palette(store_id, data)
    return jsonify(palette.to_dict()), 201


@bp.patch("/stores/<store_id>/palettes/<palette_id>")
@login_required
def update_palette(store_id, palette_id):
    _require_owned_store(store_id)
    data = PaletteUpdateSchema().load(request.get_json(silent=True) or {})
    palette = palette_service.update_palette(palette_id, store_id, data)
    return jsonify(palette.to_dict())


@bp.delete("/stores/<store_id>/palettes/<palette_id>")
@login_required
def delete_palette(store_id, palette_id):
    _require_owned_store(store_id)
    palette_service.delete_palette(palette_id, store_id)
    return "", 204
