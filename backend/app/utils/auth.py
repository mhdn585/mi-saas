from __future__ import annotations

from functools import wraps

from flask import g, request

from app.errors import UnauthorizedError
from app.extensions import db
from app.models.user import User
from app.services import auth_service


def _extract_bearer_token() -> str:
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        raise UnauthorizedError("Falta el token de sesión.")
    return token.strip()


def login_required(fn):
    @wraps(fn)
    def wrapper(*args, **kwargs):
        user_id = auth_service.decode_token(_extract_bearer_token())
        user = db.session.get(User, user_id)
        if user is None:
            raise UnauthorizedError(
                "La cuenta ya no existe.", code="token_invalido"
            )
        g.current_user = user
        return fn(*args, **kwargs)

    return wrapper


def optional_user() -> User | None:
    """Usuario si hay un Bearer válido; None si no hay header (para rutas mixtas)."""
    header = request.headers.get("Authorization", "")
    scheme, _, token = header.partition(" ")
    if scheme.lower() != "bearer" or not token.strip():
        return None
    user_id = auth_service.decode_token(token.strip())
    return db.session.get(User, user_id)


def current_user():
    return g.get("current_user")
