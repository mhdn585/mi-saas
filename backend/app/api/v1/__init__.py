from flask import Blueprint

from app.api.v1 import media, palettes, products, stores

v1 = Blueprint("v1", __name__, url_prefix="/v1")

v1.register_blueprint(stores.bp)
v1.register_blueprint(products.bp)
v1.register_blueprint(palettes.bp)
v1.register_blueprint(media.bp)
