from flask import jsonify
from werkzeug.exceptions import HTTPException


class ApiError(Exception):
    status_code = 400
    code = "error"

    def __init__(self, message: str | None = None, status_code: int | None = None,
                 code: str | None = None):
        super().__init__(message or self.code)
        if status_code is not None:
            self.status_code = status_code
        if code is not None:
            self.code = code
        self.message = message or self.code


class NotFoundError(ApiError):
    status_code = 404
    code = "not_found"


class UnauthorizedError(ApiError):
    status_code = 401
    code = "no_autenticado"


class ValidationError(ApiError):
    status_code = 422
    code = "validation_error"


class ConflictError(ApiError):
    status_code = 409
    code = "conflict"


def register_error_handlers(app):
    @app.errorhandler(ApiError)
    def handle_api_error(error: ApiError):
        return (
            jsonify({"error": {"code": error.code, "message": error.message}}),
            error.status_code,
        )

    @app.errorhandler(HTTPException)
    def handle_http_error(error: HTTPException):
        code_name = error.name.lower().replace(" ", "_")
        return (
            jsonify({"error": {"code": code_name, "message": error.description}}),
            error.code,
        )

    @app.errorhandler(413)
    def handle_too_large(_error):
        return (
            jsonify(
                {
                    "error": {
                        "code": "payload_too_large",
                        "message": "El archivo supera el tamaño máximo permitido.",
                    }
                }
            ),
            413,
        )

    @app.errorhandler(Exception)
    def handle_unexpected(error):  # noqa: BLE001
        app.logger.exception("Error no controlado: %s", error)
        return (
            jsonify(
                {
                    "error": {
                        "code": "server_error",
                        "message": "Error interno del servidor",
                    }
                }
            ),
            500,
        )
