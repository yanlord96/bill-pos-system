import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_table(client: AsyncClient):
    response = await client.post("/api/v1/tables/", json={"number": 1, "hourly_rate": 50000})
    assert response.status_code == 201
    data = response.json()
    assert data["number"] == 1
    assert data["hourly_rate"] == 50000.0
    assert data["status"] == "available"


@pytest.mark.asyncio
async def test_list_tables(client: AsyncClient):
    await client.post("/api/v1/tables/", json={"number": 1, "hourly_rate": 50000})
    await client.post("/api/v1/tables/", json={"number": 2, "hourly_rate": 75000})

    response = await client.get("/api/v1/tables/")
    assert response.status_code == 200
    assert len(response.json()) == 2


@pytest.mark.asyncio
async def test_duplicate_table_number(client: AsyncClient):
    await client.post("/api/v1/tables/", json={"number": 1, "hourly_rate": 50000})
    response = await client.post("/api/v1/tables/", json={"number": 1, "hourly_rate": 75000})
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_update_table(client: AsyncClient):
    create = await client.post("/api/v1/tables/", json={"number": 1, "hourly_rate": 50000})
    table_id = create.json()["id"]

    response = await client.put(f"/api/v1/tables/{table_id}", json={"hourly_rate": 60000})
    assert response.status_code == 200
    assert response.json()["hourly_rate"] == 60000.0


@pytest.mark.asyncio
async def test_delete_table(client: AsyncClient):
    create = await client.post("/api/v1/tables/", json={"number": 1, "hourly_rate": 50000})
    table_id = create.json()["id"]

    response = await client.delete(f"/api/v1/tables/{table_id}")
    assert response.status_code == 204

    response = await client.get(f"/api/v1/tables/{table_id}")
    assert response.status_code == 404
