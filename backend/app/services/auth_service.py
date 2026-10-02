from __future__ import annotations

import hashlib
import time

import bcrypt
import jwt
from flask import current_app
from sqlalchemy.exc import IntegrityError

from app.errors import ConflictError, UnauthorizedError
from app.extensions import db
from app.models.user import User


def hash_password(plain: str) -> str:
    salt = bcrypt.gensalt(rounds=current_app.config["BCRYPT_COST"])
    return bcrypt.hashpw(plain.encode("utf-8"), salt).decode("ascii")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("ascii"))
    except ValueError:
        return False


def signing_key() -> bytes:
    """Clave HMAC de 32 bytes derivada de SECRET_KEY (cumple RFC 7518 para HS256)."""
    return hashlib.sha256(
        current_app.config["SECRET_KEY"].encode("utf-8")
    ).digest()


def create_token(user: User) -> str:
    now = int(time.time())
    expires = now + current_app.config["JWT_EXPIRES_HOURS"] * 3600
    payload = {"sub": user.id, "iat": now, "exp": expires}
    return jwt.encode(payload, signing_key(), algorithm="HS256")


def decode_token(token: str) -> str:
    """Devuelve el id del usuario; lanza UnauthorizedError si el token no sirve."""
    try:
        payload = jwt.decode(token, signing_key(), algorithms=["HS256"])
    except jwt.ExpiredSignatureError:
        raise UnauthorizedError(
            "Tu sesión expiró. Ingresá de nuevo.", code="token_expirado"
        ) from None
    except jwt.PyJWTError:
        raise UnauthorizedError("Token inválido.", code="token_invalido") from None
    return payload["sub"]


def find_by_email(email: str) -> User | None:
    return db.session.scalar(
        db.select(User).where(User.email == email.lower().strip())
    )


def create_user(name: str, email: str, password: str) -> User:
    user = User(
        name=name.strip(),
        email=email.lower().strip(),
        password_hash=hash_password(password),
    )
    db.session.add(user)
    try:
        db.session.commit()
    except IntegrityError:
        db.session.rollback()
        raise ConflictError("Ya existe una cuenta con ese email.") from None
    return user


def register_user(name: str, email: str, password: str) -> tuple[User, str]:
    user = create_user(name, email, password)
    return user, create_token(user)


def login_user(email: str, password: str) -> tuple[User, str]:
    user = find_by_email(email)
    # Un único error genérico: no revela si el email existe ni cuál falló.
    if user is None or not verify_password(password, user.password_hash):
        raise UnauthorizedError(
            "Email o contraseña incorrectos.", code="credenciales_invalidas"
        )
    return user, create_token(user)
