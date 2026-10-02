import jwt as pyjwt

from app.extensions import db
from app.models.user import User
from app.services import auth_service


def _register(client, **overrides):
    payload = {
        "name": "Ana Pérez",
        "email": "ana@test.com",
        "password": "contra-sena-123",
    }
    payload.update(overrides)
    return client.post("/api/v1/auth/register", json=payload)


def test_register_returns_user_and_token(client):
    resp = _register(client)
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["user"]["name"] == "Ana Pérez"
    assert body["user"]["email"] == "ana@test.com"
    assert body["user"]["id"]
    assert body["token"]
    # La contraseña (llana o hasheada) jamás se expone.
    assert "password" not in body["user"]
    assert "passwordHash" not in body["user"]
    assert "password_hash" not in body["user"]


def test_register_normalizes_email(client):
    resp = _register(client, email="  ANA@TEST.COM ")
    assert resp.status_code == 201
    assert resp.get_json()["user"]["email"] == "ana@test.com"


def test_register_duplicate_email_conflict(client):
    assert _register(client).status_code == 201
    resp = _register(client, name="Otra Ana")
    assert resp.status_code == 409
    assert resp.get_json()["error"]["code"] == "conflict"


def test_register_duplicate_email_is_case_insensitive(client):
    assert _register(client).status_code == 201
    resp = _register(client, email="ANA@TEST.COM", name="Otra")
    assert resp.status_code == 409


def test_register_invalid_data(client):
    cases = [
        {"name": "", "email": "a@b.com", "password": "12345678"},
        {"name": "A", "email": "no-es-email", "password": "12345678"},
        {"name": "A", "email": "a@b.com", "password": "corta"},
        {"name": "A", "email": "a@b.com"},
    ]
    for payload in cases:
        resp = client.post("/api/v1/auth/register", json=payload)
        assert resp.status_code == 422, payload
        assert resp.get_json()["error"]["code"] == "validation_error"


def test_password_stored_as_bcrypt_hash(client, app):
    assert _register(client).status_code == 201
    with app.app_context():
        user = db.session.scalar(db.select(User).where(User.email == "ana@test.com"))
        assert user.password_hash.startswith("$2")
        assert user.password_hash != "contra-sena-123"
        assert auth_service.verify_password("contra-sena-123", user.password_hash)
        assert not auth_service.verify_password("mala", user.password_hash)


def test_login_ok(client):
    assert _register(client).status_code == 201
    resp = client.post(
        "/api/v1/auth/login",
        json={"email": "ana@test.com", "password": "contra-sena-123"},
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["user"]["email"] == "ana@test.com"
    assert body["token"]


def test_login_generic_error_does_not_leak(client):
    assert _register(client).status_code == 201
    bad_password = client.post(
        "/api/v1/auth/login",
        json={"email": "ana@test.com", "password": "incorrecta-123"},
    )
    unknown_email = client.post(
        "/api/v1/auth/login",
        json={"email": "nadie@test.com", "password": "incorrecta-123"},
    )
    for resp in (bad_password, unknown_email):
        assert resp.status_code == 401
        assert resp.get_json()["error"]["code"] == "credenciales_invalidas"


def test_me_with_token(client, register_user):
    session = register_user()
    resp = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": f"Bearer {session['token']}"},
    )
    assert resp.status_code == 200
    assert resp.get_json()["id"] == session["user"]["id"]


def test_me_without_token(client):
    resp = client.get("/api/v1/auth/me")
    assert resp.status_code == 401
    assert resp.get_json()["error"]["code"] == "no_autenticado"


def test_me_with_garbage_token(client):
    resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": "Bearer no-es-un-jwt"}
    )
    assert resp.status_code == 401
    assert resp.get_json()["error"]["code"] == "token_invalido"


def test_me_with_expired_token(client, app, register_user):
    user_id = register_user()["user"]["id"]
    with app.app_context():
        key = auth_service.signing_key()
    expired = pyjwt.encode(
        {"sub": user_id, "iat": 0, "exp": 1}, key, algorithm="HS256"
    )
    resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {expired}"}
    )
    assert resp.status_code == 401
    assert resp.get_json()["error"]["code"] == "token_expirado"


def test_me_of_deleted_user(client, app, register_user):
    session = register_user()
    token = session["token"]
    with app.app_context():
        user = db.session.get(User, session["user"]["id"])
        db.session.delete(user)
        db.session.commit()
    resp = client.get(
        "/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"}
    )
    assert resp.status_code == 401
    assert resp.get_json()["error"]["code"] == "token_invalido"
