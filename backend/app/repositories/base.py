from typing import Any

from fastapi import HTTPException
from supabase import Client


class SupabaseRepository:
    def __init__(self, client: Client, table: str):
        self.client = client
        self.table = table

    def _execute(self, query):
        try:
            return query.execute()
        except Exception as exc:
            raise HTTPException(
                status_code=502,
                detail=f"Database operation failed for {self.table}",
            ) from exc

    def get(self, item_id: str) -> dict[str, Any]:
        response = self._execute(
            self.client.table(self.table).select("*").eq("id", item_id).maybe_single()
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"{self.table.rstrip('s').title()} not found")
        return response.data

    def list_by(self, column: str, value: str, order: str = "created_at") -> list[dict[str, Any]]:
        response = (
            self.client.table(self.table)
            .select("*")
            .eq(column, value)
            .order(order, desc=True)
        )
        response = self._execute(response)
        return response.data or []

    def create(self, payload: dict[str, Any]) -> dict[str, Any]:
        response = self._execute(self.client.table(self.table).insert(payload))
        if not response.data:
            raise HTTPException(status_code=502, detail="Supabase did not return the created record")
        return response.data[0]

    def update(self, item_id: str, payload: dict[str, Any]) -> dict[str, Any]:
        response = self._execute(
            self.client.table(self.table).update(payload).eq("id", item_id)
        )
        if not response.data:
            raise HTTPException(status_code=404, detail=f"{self.table.rstrip('s').title()} not found")
        return response.data[0]

    def delete(self, item_id: str) -> None:
        self._execute(self.client.table(self.table).delete().eq("id", item_id))
