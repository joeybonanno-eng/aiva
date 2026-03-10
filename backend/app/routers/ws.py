from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.auth_service import decode_access_token
from app.models.advisor import Advisor
from app.websocket_manager import ws_manager

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    # Authenticate via query param token
    token = websocket.query_params.get("token")
    if not token:
        await websocket.close(code=4001, reason="Missing token")
        return

    payload = decode_access_token(token)
    if not payload:
        await websocket.close(code=4001, reason="Invalid token")
        return

    advisor_id = int(payload.get("sub", 0))
    if not advisor_id:
        await websocket.close(code=4001, reason="Invalid token payload")
        return

    await ws_manager.connect(websocket, advisor_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle incoming messages if needed
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket, advisor_id)
