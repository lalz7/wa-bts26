import os
from core.websocket import manager


async def send_message(number, message):

    await manager.send_to_gateway({
        "type": "send_message",
        "number": number,
        "message": message
    })


async def send_document(number, path, caption):

    abs_path = os.path.abspath(path)

    filename = os.path.basename(abs_path)

    await manager.send_to_gateway({
        "type": "send_document",
        "number": number,
        "path": abs_path,
        "caption": caption,
        "filename": filename
    })


async def logout():

    await manager.send_to_gateway({
        "type": "logout"
    })


async def get_status():

    await manager.send_to_gateway({
        "type": "status"
    })