from __future__ import annotations

from flask import Flask, jsonify, send_from_directory
from marshmallow import ValidationError as MarshmallowValidationError

from app.config import DevConfig
from app.errors import register_error_handlers
from app.extensions import cors, db


def create_app(config_object=None) -> Flask:
    config_object = config_object or DevConfig
    app = Flask(__name__)
    app.config.from_object(config_object)

    db.init_app(app)
    cors.init_app(
        app,
        origins=app.config.get("FRONTEND_ORIGIN"),
        supports_credentials=False,
    )

    from app.api import api

    app.register_blueprint(api)

    register_error_handlers(app)

    @app.errorhandler(MarshmallowValidationError)
    def handle_marshmallow(error: MarshmallowValidationError):
        return (
            jsonify(
                {
                    "error": {
                        "code": "validation_error",
                        "message": "Los datos enviados no son válidos.",
                        "fields": error.messages,
                    }
                }
            ),
            422,
        )

    @app.get("/api/v1/health")
    def health():
        return jsonify({"status": "ok"})

    @app.get("/media/<path:filename>")
    def serve_media(filename: str):
        response = send_from_directory(app.config["MEDIA_FOLDER"], filename)
        response.headers["Cache-Control"] = "public, max-age=86400"
        return response

    from app.cli import register_cli

    register_cli(app)

    @app.shell_context_processor
    def shell_context():
        from app.models import MediaAsset, Product, ProductImage, Store

        return {
            "db": db,
            "Product": Product,
            "Store": Store,
            "MediaAsset": MediaAsset,
            "ProductImage": ProductImage,
        }

    return app
