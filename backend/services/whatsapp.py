import os
from uuid import uuid4
from core.websocket import manager


async def send_message(number, message):

    await manager.send_to_gateway({
        "type": "send_message",
        "command_id": str(uuid4()),
        "number": number,
        "message": message
    }, wait_for_ack=True)


async def send_document(number, path):

    abs_path = os.path.abspath(path)

    await manager.send_to_gateway({
        "type": "send_document",
        "command_id": str(uuid4()),
        "number": number,
        "path": abs_path
    }, wait_for_ack=True)


async def logout():

    try:
        await manager.send_to_gateway({
            "type": "logout"
        })
    except RuntimeError:
        return


async def get_status():

    try:
        await manager.send_to_gateway({
            "type": "status"
        })
    except RuntimeError:
        return
