from flask import Blueprint, g, jsonify, request

from app.schemas.store import StoreCreateSchema, StoreUpdateSchema
from app.services import store_service
from app.utils.auth import login_required

bp = Blueprint("stores", __name__)


@bp.get("/stores")
@login_required
def list_stores():
    stores = store_service.list_stores(g.current_user.id)
    return jsonify([store.to_dict() for store in stores])


@bp.post("/stores")
@login_required
def create_store():
    data = StoreCreateSchema().load(request.get_json(silent=True) or {})
    store = store_service.create_store(g.current_user.id, data)
    return jsonify(store.to_dict()), 201


@bp.get("/stores/<store_id>")
def get_store(store_id):
    store = store_service.get_store(store_id)
    return jsonify(store.to_dict())


@bp.patch("/stores/<store_id>")
@login_required
def update_store(store_id):
    data = StoreUpdateSchema().load(request.get_json(silent=True) or {})
    store = store_service.update_store(store_id, data, g.current_user.id)
    return jsonify(store.to_dict())


@bp.delete("/stores/<store_id>")
@login_required
def delete_store(store_id):
    store_service.delete_store(store_id, g.current_user.id)
    return "", 204
