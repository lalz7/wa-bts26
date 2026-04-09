import asyncio
from fastapi import WebSocket
from typing import List

class ConnectionManager:

    def __init__(self):
        self.frontends: List[WebSocket] = []
        self.gateway: WebSocket | None = None
        self.pending_gateway_commands = {}

        self.last_status = None
        self.last_qr = None
        self.last_admin = None


    def is_whatsapp_connected(self) -> bool:

        if not self.last_status:
            return False

        if self.last_status.get("type") == "connected":
            return True

        if self.last_status.get("type") == "status":
            return self.last_status.get("data") == "connected"

        return False


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
        if websocket in self.frontends:
            self.frontends.remove(websocket)


    async def connect_gateway(self, websocket: WebSocket):
        await websocket.accept()
        self.gateway = websocket


    async def disconnect_gateway(self):
        self.gateway = None

        for future in self.pending_gateway_commands.values():
            if not future.done():
                future.set_exception(RuntimeError("WA gateway terputus"))

        self.pending_gateway_commands.clear()


    async def send_to_frontend(self, data):

        # simpan state
        if data["type"] == "connected":
            self.last_status = data
            self.last_qr = None

        if data["type"] == "disconnected":
            self.last_status = data
            self.last_admin = {
                "type": "admin",
                "data": None
            }

        if data["type"] == "reconnecting":
            self.last_status = data
            self.last_qr = None

        if data["type"] == "status":
            self.last_status = data

        if data["type"] == "qr":
            self.last_qr = data

        if data["type"] == "admin":
            self.last_admin = data

        disconnected = []

        for ws in list(self.frontends):
            try:
                await ws.send_json(data)
            except Exception:
                disconnected.append(ws)

        for ws in disconnected:
            await self.disconnect_frontend(ws)


    async def resolve_gateway_command(self, data):

        command_id = data.get("command_id")

        if not command_id:
            return False

        future = self.pending_gateway_commands.pop(command_id, None)

        if not future or future.done():
            return True

        if data.get("type") == "gateway_ack" and data.get("status") == "success":
            future.set_result(data)
        else:
            future.set_exception(
                RuntimeError(data.get("message") or "Perintah WA gateway gagal")
            )

        return True


    async def send_to_gateway(self, data, *, wait_for_ack=False, timeout=30):

        if not self.gateway:
            raise RuntimeError("WA gateway tidak terhubung")

        future = None
        command_id = data.get("command_id")

        if wait_for_ack:
            if not command_id:
                raise RuntimeError("command_id wajib ada untuk wait_for_ack")

            future = asyncio.get_running_loop().create_future()
            self.pending_gateway_commands[command_id] = future

        try:
            await self.gateway.send_json(data)
        except Exception as exc:
            self.gateway = None
            if command_id:
                pending = self.pending_gateway_commands.pop(command_id, None)
                if pending and not pending.done():
                    pending.set_exception(RuntimeError("WA gateway tidak terhubung"))
            raise RuntimeError("Gagal mengirim perintah ke WA gateway") from exc

        if not wait_for_ack:
            return None

        try:
            return await asyncio.wait_for(future, timeout=timeout)
        except asyncio.TimeoutError as exc:
            pending = self.pending_gateway_commands.pop(command_id, None)
            if pending and not pending.done():
                pending.set_exception(RuntimeError("Timeout menunggu balasan WA gateway"))
            raise RuntimeError("Timeout menunggu balasan WA gateway") from exc


manager = ConnectionManager()
