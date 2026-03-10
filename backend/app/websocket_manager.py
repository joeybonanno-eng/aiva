from __future__ import annotations

import json
from typing import Any
from fastapi import WebSocket


class WebSocketManager:
    """Manages WebSocket connections per advisor."""

    def __init__(self):
        self.active_connections: dict[int, list[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, advisor_id: int):
        await websocket.accept()
        if advisor_id not in self.active_connections:
            self.active_connections[advisor_id] = []
        self.active_connections[advisor_id].append(websocket)

    def disconnect(self, websocket: WebSocket, advisor_id: int):
        if advisor_id in self.active_connections:
            self.active_connections[advisor_id] = [
                ws for ws in self.active_connections[advisor_id] if ws != websocket
            ]
            if not self.active_connections[advisor_id]:
                del self.active_connections[advisor_id]

    async def send_personal(self, advisor_id: int, message: dict[str, Any]):
        if advisor_id in self.active_connections:
            data = json.dumps(message)
            disconnected = []
            for ws in self.active_connections[advisor_id]:
                try:
                    await ws.send_text(data)
                except Exception:
                    disconnected.append(ws)
            for ws in disconnected:
                self.disconnect(ws, advisor_id)

    async def broadcast(self, message: dict[str, Any]):
        data = json.dumps(message)
        for advisor_id in list(self.active_connections.keys()):
            for ws in self.active_connections.get(advisor_id, []):
                try:
                    await ws.send_text(data)
                except Exception:
                    self.disconnect(ws, advisor_id)


ws_manager = WebSocketManager()
