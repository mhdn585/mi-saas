from flask import Blueprint, g, jsonify, request

from app.errors import NotFoundError
from app.schemas.product import ProductCreateSchema, ProductUpdateSchema
from app.services import product_service, store_service
from app.utils import parse_pagination
from app.utils.auth import login_required, optional_user

bp = Blueprint("products", __name__)


def _is_store_owner(store) -> bool:
    user = optional_user()
    return user is not None and store.owner_id == user.id


@bp.get("/stores/<store_id>/products")
def list_products(store_id):
    store = store_service.get_store(store_id)
    search = request.args.get("search")
    published_only = request.args.get("published", "").lower() == "true"
    page, per_page = parse_pagination(request.args)
    result = product_service.list_products(
        store_id,
        search,
        published_only,
        page,
        per_page,
        include_unpublished=_is_store_owner(store),
    )
    return jsonify(
        {
            "items": [product.to_dict() for product in result.items],
            "page": result.page,
            "per_page": result.per_page,
            "total": result.total,
            "pages": result.pages,
        }
    )


@bp.post("/stores/<store_id>/products")
@login_required
def create_product(store_id):
    store_service.get_owned_store(store_id, g.current_user.id)
    data = ProductCreateSchema().load(request.get_json(silent=True) or {})
    product = product_service.create_product(store_id, data)
    return jsonify(product.to_dict()), 201


@bp.get("/stores/<store_id>/products/<product_id>")
def get_product_in_store(store_id, product_id):
    store = store_service.get_store(store_id)
    product = product_service.get_product(
        product_id,
        store_id=store_id,
        include_unpublished=_is_store_owner(store),
    )
    return jsonify(product.to_dict())


@bp.get("/products/<product_id>")
def get_product(product_id):
    product = product_service.get_product(product_id, include_unpublished=True)
    user = optional_user()
    if not product.published and (user is None or product.store.owner_id != user.id):
        raise NotFoundError("Producto no encontrado")
    return jsonify(product.to_dict())


@bp.patch("/products/<product_id>")
@login_required
def update_product(product_id):
    product = product_service.get_product(product_id, include_unpublished=True)
    store_service.get_owned_store(product.store_id, g.current_user.id)
    data = ProductUpdateSchema().load(request.get_json(silent=True) or {})
    product = product_service.update_product(product_id, data)
    return jsonify(product.to_dict())


@bp.delete("/products/<product_id>")
@login_required
def delete_product(product_id):
    product = product_service.get_product(product_id, include_unpublished=True)
    store_service.get_owned_store(product.store_id, g.current_user.id)
    product_service.delete_product(product_id)
    return "", 204
