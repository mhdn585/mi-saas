def test_create_store_defaults(auth_client):
    resp = auth_client.post(
        "/api/v1/stores", json={"name": "Panadería La Espiga"}
    )
    assert resp.status_code == 201
    body = resp.get_json()
    assert body["id"]
    assert body["name"] == "Panadería La Espiga"
    assert body["currency"] == "USD"
    assert body["description"] == ""
    assert body["logo"] is None
    assert body["createdAt"] == body["updatedAt"]


def test_list_stores(auth_client, make_store):
    make_store(name="Tienda A")
    make_store(name="Tienda B")
    resp = auth_client.get("/api/v1/stores")
    assert resp.status_code == 200
    assert len(resp.get_json()) == 2


def test_get_store_not_found(auth_client):
    resp = auth_client.get("/api/v1/stores/no-existe")
    assert resp.status_code == 404
    assert resp.get_json()["error"]["code"] == "not_found"


def test_update_store_partial(auth_client, make_store):
    store = make_store(name="Original")
    resp = auth_client.patch(
        f"/api/v1/stores/{store['id']}", json={"currency": "MXN"}
    )
    assert resp.status_code == 200
    body = resp.get_json()
    assert body["currency"] == "MXN"
    assert body["name"] == "Original"
    assert body["updatedAt"] >= store["updatedAt"]


def test_update_store_invalid_currency(auth_client, make_store):
    store = make_store()
    resp = auth_client.patch(
        f"/api/v1/stores/{store['id']}", json={"currency": "XYZ"}
    )
    assert resp.status_code == 422


def test_delete_store_cascades_products(auth_client, make_store):
    store = make_store(name="Con productos")
    sid = store["id"]
    p1 = auth_client.post(
        f"/api/v1/stores/{sid}/products",
        json={"name": "P1", "price": 10},
    )
    assert p1.status_code == 201
    resp = auth_client.delete(f"/api/v1/stores/{sid}")
    assert resp.status_code == 204
    assert auth_client.get(f"/api/v1/stores/{sid}").status_code == 404
    assert auth_client.get(f"/api/v1/products/{p1.get_json()['id']}").status_code == 404


def test_create_store_blank_name(auth_client):
    resp = auth_client.post("/api/v1/stores", json={"name": "   "})
    assert resp.status_code == 422


THEME = {
    "bg": "#fff8f0",
    "fg": "#3b2a1a",
    "surface": "#ffffff",
    "muted": "#8a7666",
    "line": "#e5d8cc",
    "accent": "#e8632a",
    "accentFg": "#ffffff",
}


def test_store_theme_defaults_null(auth_client, make_store):
    store = make_store()
    assert store["theme"] is None
    body = auth_client.get(f"/api/v1/stores/{store['id']}").get_json()
    assert body["theme"] is None


def test_update_store_theme(auth_client, make_store):
    store = make_store()
    resp = auth_client.patch(f"/api/v1/stores/{store['id']}", json={"theme": THEME})
    assert resp.status_code == 200
    assert resp.get_json()["theme"] == THEME
    assert auth_client.get(f"/api/v1/stores/{store['id']}").get_json()["theme"] == THEME


def test_update_store_theme_reset(auth_client, make_store):
    store = make_store()
    auth_client.patch(f"/api/v1/stores/{store['id']}", json={"theme": THEME})
    resp = auth_client.patch(f"/api/v1/stores/{store['id']}", json={"theme": None})
    assert resp.status_code == 200
    assert resp.get_json()["theme"] is None


def test_update_store_theme_invalid_hex(auth_client, make_store):
    store = make_store()
    bad = dict(THEME, accent="rojo")
    resp = auth_client.patch(f"/api/v1/stores/{store['id']}", json={"theme": bad})
    assert resp.status_code == 422
    assert auth_client.get(f"/api/v1/stores/{store['id']}").get_json()["theme"] is None


def test_update_store_theme_incomplete(auth_client, make_store):
    store = make_store()
    partial = {k: v for k, v in THEME.items() if k != "accentFg"}
    resp = auth_client.patch(f"/api/v1/stores/{store['id']}", json={"theme": partial})
    assert resp.status_code == 422


def test_create_store_with_theme(auth_client):
    resp = auth_client.post(
        "/api/v1/stores", json={"name": "Con tema", "theme": THEME}
    )
    assert resp.status_code == 201
    assert resp.get_json()["theme"] == THEME


LOGO_CONFIG = {
    "fit": "cover",
    "height": 48,
    "positionX": 30.0,
    "positionY": 60.0,
    "background": "#1a1a1a",
}


def test_store_logo_config_defaults_null(auth_client, make_store):
    store = make_store()
    assert store["logoConfig"] is None
    body = auth_client.get(f"/api/v1/stores/{store['id']}").get_json()
    assert body["logoConfig"] is None


def test_update_store_logo_config(auth_client, make_store):
    store = make_store()
    resp = auth_client.patch(
        f"/api/v1/stores/{store['id']}", json={"logoConfig": LOGO_CONFIG}
    )
    assert resp.status_code == 200
    assert resp.get_json()["logoConfig"] == LOGO_CONFIG
    body = auth_client.get(f"/api/v1/stores/{store['id']}").get_json()
    assert body["logoConfig"] == LOGO_CONFIG


def test_update_store_logo_config_partial_defaults(auth_client, make_store):
    store = make_store()
    resp = auth_client.patch(
        f"/api/v1/stores/{store['id']}", json={"logoConfig": {"height": 56}}
    )
    assert resp.status_code == 200
    assert resp.get_json()["logoConfig"] == {
        "fit": "contain",
        "height": 56,
        "positionX": 50.0,
        "positionY": 50.0,
        "background": None,
    }


def test_update_store_logo_config_reset(auth_client, make_store):
    store = make_store()
    auth_client.patch(f"/api/v1/stores/{store['id']}", json={"logoConfig": LOGO_CONFIG})
    resp = auth_client.patch(f"/api/v1/stores/{store['id']}", json={"logoConfig": None})
    assert resp.status_code == 200
    assert resp.get_json()["logoConfig"] is None


def test_update_store_logo_config_invalid(auth_client, make_store):
    store = make_store()
    bad_configs = [
        {"fit": "zoom"},
        {"height": 100},
        {"height": 10},
        {"positionX": 120},
        {"background": "rojo"},
    ]
    for bad in bad_configs:
        resp = auth_client.patch(
            f"/api/v1/stores/{store['id']}", json={"logoConfig": bad}
        )
        assert resp.status_code == 422, bad
        body = auth_client.get(f"/api/v1/stores/{store['id']}").get_json()
        assert body["logoConfig"] is None


def test_list_stores_requires_auth(client):
    resp = client.get("/api/v1/stores")
    assert resp.status_code == 401
    assert resp.get_json()["error"]["code"] == "no_autenticado"


def test_create_store_requires_auth(client):
    resp = client.post("/api/v1/stores", json={"name": "Sin dueño"})
    assert resp.status_code == 401


def test_get_store_is_public(client, make_store):
    store = make_store(name="Pública")
    resp = client.get(f"/api/v1/stores/{store['id']}")
    assert resp.status_code == 200
    assert resp.get_json()["name"] == "Pública"


def test_stores_isolated_between_users(client, register_user, make_store):
    mine = make_store(name="De A")
    headers = {"Authorization": f"Bearer {register_user()['token']}"}

    listing_b = client.get("/api/v1/stores", headers=headers)
    assert listing_b.status_code == 200
    assert listing_b.get_json() == []

    assert (
        client.patch(
            f"/api/v1/stores/{mine['id']}", json={"currency": "MXN"}, headers=headers
        ).status_code
        == 404
    )
    assert client.delete(f"/api/v1/stores/{mine['id']}", headers=headers).status_code == 404

    assert client.get(f"/api/v1/stores/{mine['id']}").status_code == 200
