from fastapi import WebSocket
from typing import List

class ConnectionManager:

    def __init__(self):
        self.frontends: List[WebSocket] = []
        self.gateway: WebSocket | None = None

        self.last_status = None
        self.last_qr = None
        self.last_admin = None


    async def connect_frontend(self, websocket: WebSocket):

        await websocket.accept()
        self.frontends.append(websocket)

        # kirim ulang state terakhir
        if self.last_status:
            await websocket.send_json(self.last_status)

        if self.last_admin:
            await websocket.send_json(self.last_admin)

        if self.last_qr:
            await websocket.send_json(self.last_qr)


    async def disconnect_frontend(self, websocket: WebSocket):
        self.frontends.remove(websocket)


    async def connect_gateway(self, websocket: WebSocket):
        await websocket.accept()
        self.gateway = websocket


    async def disconnect_gateway(self):
        self.gateway = None


    async def send_to_frontend(self, data):

        # simpan state
        if data["type"] == "connected":
            self.last_status = data

        if data["type"] == "disconnected":
            self.last_status = data

        if data["type"] == "qr":
            self.last_qr = data

        if data["type"] == "admin":
            self.last_admin = data

        for ws in self.frontends:
            await ws.send_json(data)


    async def send_to_gateway(self, data):

        if self.gateway:
            await self.gateway.send_json(data)


manager = ConnectionManager()