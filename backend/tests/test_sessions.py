import pytest
from httpx import AsyncClient


async def create_test_data(client: AsyncClient):
    """Create a table and client for session tests."""
    table = await client.post("/api/v1/tables/", json={"number": 1, "hourly_rate": 50000})
    cl = await client.post("/api/v1/clients/", json={"name": "Test User", "phone": "0812345"})
    return table.json(), cl.json()


@pytest.mark.asyncio
async def test_start_session(client: AsyncClient):
    table, cl = await create_test_data(client)
    response = await client.post(
        "/api/v1/sessions/",
        json={"table_id": table["id"], "client_id": cl["id"], "session_type": "active"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "active"
    assert data["start_time"] is not None

    # Table should be occupied
    table_resp = await client.get(f"/api/v1/tables/{table['id']}")
    assert table_resp.json()["status"] == "occupied"


@pytest.mark.asyncio
async def test_cannot_start_on_occupied_table(client: AsyncClient):
    table, cl = await create_test_data(client)
    await client.post(
        "/api/v1/sessions/",
        json={"table_id": table["id"], "client_id": cl["id"], "session_type": "active"},
    )
    # Try to start another session on the same table
    response = await client.post(
        "/api/v1/sessions/",
        json={"table_id": table["id"], "client_id": cl["id"], "session_type": "active"},
    )
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_end_session(client: AsyncClient):
    table, cl = await create_test_data(client)
    session = await client.post(
        "/api/v1/sessions/",
        json={"table_id": table["id"], "client_id": cl["id"], "session_type": "active"},
    )
    session_id = session.json()["id"]

    response = await client.patch(f"/api/v1/sessions/{session_id}/end")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "completed"
    assert data["end_time"] is not None
    assert data["table_cost"] >= 0

    # Table should be available again
    table_resp = await client.get(f"/api/v1/tables/{table['id']}")
    assert table_resp.json()["status"] == "available"


@pytest.mark.asyncio
async def test_order_on_session(client: AsyncClient):
    table, cl = await create_test_data(client)

    # Create menu item
    menu = await client.post(
        "/api/v1/menu/", json={"name": "Nasi Goreng", "category": "food", "price": 25000}
    )
    menu_id = menu.json()["id"]

    # Start session
    session = await client.post(
        "/api/v1/sessions/",
        json={"table_id": table["id"], "client_id": cl["id"], "session_type": "active"},
    )
    session_id = session.json()["id"]

    # Create order
    order_resp = await client.post(
        "/api/v1/orders/",
        json={"session_id": session_id, "items": [{"menu_item_id": menu_id, "quantity": 2}]},
    )
    assert order_resp.status_code == 201
    order = order_resp.json()
    assert len(order["items"]) == 1
    assert order["items"][0]["quantity"] == 2
    assert order["items"][0]["unit_price"] == 25000.0
    assert order["items"][0]["subtotal"] == 50000.0
