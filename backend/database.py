"""
Storage layer for crop reports.

Uses MongoDB (via motor, the async driver) when a MONGO_URI environment
variable is set — matching the tech stack in the project proposal. If no
MongoDB is configured (e.g. running the demo locally with nothing installed),
it transparently falls back to an in-memory store so the API still works.
"""
import os
from typing import Optional

MONGO_URI = os.environ.get("MONGO_URI")
DB_NAME = os.environ.get("MONGO_DB", "geoguardz")


class ReportsDB:
    def __init__(self):
        self._mongo = None
        self._memory = []  # used only when MONGO_URI is not set
        if MONGO_URI:
            import motor.motor_asyncio
            client = motor.motor_asyncio.AsyncIOMotorClient(MONGO_URI)
            self._mongo = client[DB_NAME]["reports"]

    async def insert(self, report: dict):
        if self._mongo is not None:
            await self._mongo.insert_one(dict(report))
        else:
            self._memory.append(report)
        return report

    async def list(self, risk: Optional[str] = None, status: Optional[str] = None):
        if self._mongo is not None:
            query = {}
            if risk:
                query["risk"] = risk
            if status:
                query["status"] = status
            cursor = self._mongo.find(query, {"_id": 0}).sort("date", -1)
            return [doc async for doc in cursor]
        results = self._memory
        if risk:
            results = [r for r in results if r["risk"] == risk]
        if status:
            results = [r for r in results if r["status"] == status]
        return sorted(results, key=lambda r: r["date"], reverse=True)

    async def update_status(self, report_id: str, status: str, officer_note: Optional[str]):
        if self._mongo is not None:
            update = {"status": status}
            if officer_note:
                update["officer_note"] = officer_note
            result = await self._mongo.find_one_and_update(
                {"id": report_id}, {"$set": update}, return_document=True
            )
            if result:
                result.pop("_id", None)
            return result
        for r in self._memory:
            if r["id"] == report_id:
                r["status"] = status
                if officer_note:
                    r["officer_note"] = officer_note
                return r
        return None
