from flask import Blueprint

from app.api.v1 import v1

api = Blueprint("api", __name__, url_prefix="/api")
api.register_blueprint(v1)
