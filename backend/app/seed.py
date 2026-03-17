"""Seed script to populate the database with sample data."""
import asyncio
from sqlalchemy import select

from app.database import async_session, engine, Base
from app.models import Table, TableStatus, Client, MenuItem, MenuCategory


async def seed():
    async with async_session() as db:
        # Check if already seeded
        result = await db.execute(select(Table))
        if result.scalars().first():
            print("Database already seeded, skipping.")
            return

        # Tables
        tables = [
            Table(number=1, hourly_rate=50000, status=TableStatus.available),
            Table(number=2, hourly_rate=50000, status=TableStatus.available),
            Table(number=3, hourly_rate=75000, status=TableStatus.available),
            Table(number=4, hourly_rate=75000, status=TableStatus.available),
            Table(number=5, hourly_rate=100000, status=TableStatus.available),
            Table(number=6, hourly_rate=100000, status=TableStatus.available),
        ]
        db.add_all(tables)

        # Clients
        clients = [
            Client(name="Budi Santoso", phone="081234567890"),
            Client(name="Andi Wijaya", phone="081234567891"),
            Client(name="Siti Rahayu", phone="081234567892"),
            Client(name="Denny Pratama", phone="081234567893"),
        ]
        db.add_all(clients)

        # Menu Items - Food
        food_items = [
            MenuItem(name="Nasi Goreng", category=MenuCategory.food, price=25000),
            MenuItem(name="Mie Goreng", category=MenuCategory.food, price=23000),
            MenuItem(name="French Fries", category=MenuCategory.food, price=18000),
            MenuItem(name="Chicken Wings", category=MenuCategory.food, price=30000),
            MenuItem(name="Roti Bakar", category=MenuCategory.food, price=15000),
        ]
        db.add_all(food_items)

        # Menu Items - Drinks
        drink_items = [
            MenuItem(name="Es Teh Manis", category=MenuCategory.drink, price=8000),
            MenuItem(name="Es Jeruk", category=MenuCategory.drink, price=10000),
            MenuItem(name="Kopi Hitam", category=MenuCategory.drink, price=12000),
            MenuItem(name="Air Mineral", category=MenuCategory.drink, price=5000),
            MenuItem(name="Coca Cola", category=MenuCategory.drink, price=12000),
        ]
        db.add_all(drink_items)

        await db.commit()
        print("Database seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed())
