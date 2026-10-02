THEME = {
    "bg": "#fff8f0",
    "fg": "#3b2a1a",
    "surface": "#ffffff",
    "muted": "#8a7666",
    "line": "#e5d8cc",
    "accent": "#e8632a",
    "accentFg": "#ffffff",
}


def _create(auth_client, store_id, name="Mi paleta", colors=None):
    return auth_client.post(
        f"/api/v1/stores/{store_id}/palettes",
        json={"name": name, "colors": colors or THEME},
    )


def test_palette_crud(auth_client, make_store):
    store = make_store()
    sid = store["id"]

    assert auth_client.get(f"/api/v1/stores/{sid}/palettes").get_json() == []

    created = _create(auth_client, sid)
    assert created.status_code == 201
    body = created.get_json()
    assert body["storeId"] == sid
    assert body["name"] == "Mi paleta"
    assert body["colors"] == THEME

    patched = auth_client.patch(
        f"/api/v1/stores/{sid}/palettes/{body['id']}",
        json={"name": "Renombrada"},
    )
    assert patched.status_code == 200
    assert patched.get_json()["name"] == "Renombrada"
    assert patched.get_json()["colors"] == THEME

    deleted = auth_client.delete(f"/api/v1/stores/{sid}/palettes/{body['id']}")
    assert deleted.status_code == 204
    assert auth_client.get(f"/api/v1/stores/{sid}/palettes").get_json() == []


def test_palette_name_unique_per_store(auth_client, make_store):
    store = make_store()
    sid = store["id"]
    assert _create(auth_client, sid, name="Repetida").status_code == 201
    conflict = _create(auth_client, sid, name="Repetida")
    assert conflict.status_code == 409
    assert conflict.get_json()["error"]["code"] == "conflict"

    other = make_store(name="Otra tienda")
    assert _create(auth_client, other["id"], name="Repetida").status_code == 201


def test_palette_invalid_colors(auth_client, make_store):
    sid = make_store()["id"]
    bad = dict(THEME, bg="#gggggg")
    resp = _create(auth_client, sid, colors=bad)
    assert resp.status_code == 422
    blank = _create(auth_client, sid, name="   ")
    assert blank.status_code == 422


def test_palette_cross_store_404(auth_client, make_store):
    a = make_store(name="A")
    b = make_store(name="B")
    created = _create(auth_client, a["id"])
    pid = created.get_json()["id"]

    assert auth_client.get(f"/api/v1/stores/{b['id']}/palettes").get_json() == []
    assert (
        auth_client.patch(f"/api/v1/stores/{b['id']}/palettes/{pid}", json={"name": "X"})
        .status_code
        == 404
    )
    assert auth_client.delete(f"/api/v1/stores/{b['id']}/palettes/{pid}").status_code == 404


def test_palettes_list_requires_existing_store(auth_client):
    resp = auth_client.get("/api/v1/stores/no-existe/palettes")
    assert resp.status_code == 404


def test_delete_store_cascades_palettes(auth_client, make_store, app):
    from app.models.saved_palette import SavedPalette

    store = make_store()
    sid = store["id"]
    _create(auth_client, sid)
    assert auth_client.delete(f"/api/v1/stores/{sid}").status_code == 204
    with app.app_context():
        assert SavedPalette.query.count() == 0


def test_palettes_require_auth(client):
    resp = client.get("/api/v1/stores/whatever/palettes")
    assert resp.status_code == 401


def test_palettes_isolated_between_users(
    client, register_user, make_store, auth_client
):
    sid = make_store()["id"]
    _create(auth_client, sid, name="Mía")
    headers = {"Authorization": f"Bearer {register_user()['token']}"}
    assert client.get(f"/api/v1/stores/{sid}/palettes", headers=headers).status_code == 404
