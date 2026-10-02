from flask import Blueprint, g, jsonify, request

from app.schemas.auth import LoginSchema, RegisterSchema
from app.services import auth_service
from app.utils.auth import login_required

bp = Blueprint("auth", __name__)


@bp.post("/auth/register")
def register():
    data = RegisterSchema().load(request.get_json(silent=True) or {})
    user, token = auth_service.register_user(
        data["name"], data["email"], data["password"]
    )
    return jsonify({"user": user.to_dict(), "token": token}), 201


@bp.post("/auth/login")
def login():
    data = LoginSchema().load(request.get_json(silent=True) or {})
    user, token = auth_service.login_user(data["email"], data["password"])
    return jsonify({"user": user.to_dict(), "token": token})


@bp.get("/auth/me")
@login_required
def me():
    return jsonify(g.current_user.to_dict())
