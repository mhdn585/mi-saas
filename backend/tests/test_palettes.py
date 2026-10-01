THEME = {
    "bg": "#fff8f0",
    "fg": "#3b2a1a",
    "surface": "#ffffff",
    "muted": "#8a7666",
    "line": "#e5d8cc",
    "accent": "#e8632a",
    "accentFg": "#ffffff",
}


def _create(client, store_id, name="Mi paleta", colors=None):
    return client.post(
        f"/api/v1/stores/{store_id}/palettes",
        json={"name": name, "colors": colors or THEME},
    )


def test_palette_crud(client, make_store):
    store = make_store()
    sid = store["id"]

    assert client.get(f"/api/v1/stores/{sid}/palettes").get_json() == []

    created = _create(client, sid)
    assert created.status_code == 201
    body = created.get_json()
    assert body["storeId"] == sid
    assert body["name"] == "Mi paleta"
    assert body["colors"] == THEME

    patched = client.patch(
        f"/api/v1/stores/{sid}/palettes/{body['id']}",
        json={"name": "Renombrada"},
    )
    assert patched.status_code == 200
    assert patched.get_json()["name"] == "Renombrada"
    assert patched.get_json()["colors"] == THEME

    deleted = client.delete(f"/api/v1/stores/{sid}/palettes/{body['id']}")
    assert deleted.status_code == 204
    assert client.get(f"/api/v1/stores/{sid}/palettes").get_json() == []


def test_palette_name_unique_per_store(client, make_store):
    store = make_store()
    sid = store["id"]
    assert _create(client, sid, name="Repetida").status_code == 201
    conflict = _create(client, sid, name="Repetida")
    assert conflict.status_code == 409
    assert conflict.get_json()["error"]["code"] == "conflict"

    other = make_store(name="Otra tienda")
    assert _create(client, other["id"], name="Repetida").status_code == 201


def test_palette_invalid_colors(client, make_store):
    sid = make_store()["id"]
    bad = dict(THEME, bg="#gggggg")
    resp = _create(client, sid, colors=bad)
    assert resp.status_code == 422
    blank = _create(client, sid, name="   ")
    assert blank.status_code == 422


def test_palette_cross_store_404(client, make_store):
    a = make_store(name="A")
    b = make_store(name="B")
    created = _create(client, a["id"])
    pid = created.get_json()["id"]

    assert client.get(f"/api/v1/stores/{b['id']}/palettes").get_json() == []
    assert (
        client.patch(f"/api/v1/stores/{b['id']}/palettes/{pid}", json={"name": "X"})
        .status_code
        == 404
    )
    assert client.delete(f"/api/v1/stores/{b['id']}/palettes/{pid}").status_code == 404


def test_palettes_list_requires_existing_store(client):
    resp = client.get("/api/v1/stores/no-existe/palettes")
    assert resp.status_code == 404


def test_delete_store_cascades_palettes(client, make_store, app):
    from app.models.saved_palette import SavedPalette

    store = make_store()
    sid = store["id"]
    _create(client, sid)
    assert client.delete(f"/api/v1/stores/{sid}").status_code == 204
    with app.app_context():
        assert SavedPalette.query.count() == 0
