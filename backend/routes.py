from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi import HTTPException, UploadFile, File, Depends

from sqlalchemy.orm import Session

import os
import shutil

from database import get_db

from core.websocket import manager
from core.queue import add

from services import whatsapp
from services import student
from services import template
from services import blast

from utils import excel, zip


router = APIRouter()


# =========================
# FRONTEND WEBSOCKET
# =========================

@router.websocket("/ws")
async def websocket_frontend(websocket: WebSocket):
    await manager.connect_frontend(websocket)

    try:
        while True:
            await websocket.receive_text()

    except WebSocketDisconnect:
        await manager.disconnect_frontend(websocket)


# =========================
# WA GATEWAY WEBSOCKET
# =========================

@router.websocket("/wa")
async def websocket_gateway(websocket: WebSocket):
    await manager.connect_gateway(websocket)

    try:
        while True:
            data = await websocket.receive_json()

            await manager.send_to_frontend(data)

    except WebSocketDisconnect:
        await manager.disconnect_gateway()

        await manager.send_to_frontend({
            "type": "disconnected"
        })


# =========================
# WHATSAPP
# =========================

@router.get("/whatsapp/status")
async def whatsapp_status():
    await whatsapp.get_status()
    return {"status": "request_sent"}


@router.post("/whatsapp/logout")
async def whatsapp_logout():
    await whatsapp.logout()
    return {"status": "logout_sent"}


@router.post("/whatsapp/send")
async def whatsapp_send(data: dict):

    try:

        await whatsapp.send_message(
            data["number"],
            data["message"]
        )

        return {"status": "sent"}

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


@router.post("/whatsapp/send-document")
async def whatsapp_send_document(data: dict):

    try:

        await whatsapp.send_document(
            data["number"],
            data["path"],
            data["caption"]
        )

        return {"status": "sent"}

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================
# SISWA
# =========================

@router.get("/siswa")
def get_siswa(db: Session = Depends(get_db)):
    return student.get_all(db)


@router.delete("/siswa")
def delete_siswa(db: Session = Depends(get_db)):

    student.delete_all(db)

    return {
        "status": "deleted"
    }


# =========================
# UPLOAD EXCEL
# =========================

@router.post("/upload/excel")
async def upload_excel(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    os.makedirs("storage/excel", exist_ok=True)

    path = f"storage/excel/{file.filename}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    data = excel.read_excel(path)

    student.create_many(db, data)

    return {
        "status": "ok"
    }


# =========================
# UPLOAD ZIP
# =========================

@router.post("/upload/zip")
async def upload_zip(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    os.makedirs("storage/invoices", exist_ok=True)

    path = f"storage/invoices/{file.filename}"

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    files = zip.extract_zip(
        path,
        "storage/invoices"
    )

    for f in files:

        student.update_pdf(
            db,
            f["id"],
            f["file"]
        )

    return {
        "status": "ok"
    }


# =========================
# TEMPLATE
# =========================

@router.get("/template")
def get_template(db: Session = Depends(get_db)):
    return template.get_all(db)


@router.post("/template")
def create_template(
    data: dict,
    db: Session = Depends(get_db)
):

    return template.create(db, data)


@router.put("/template/{id}")
def update_template(
    id: int,
    data: dict,
    db: Session = Depends(get_db)
):

    return template.update(db, id, data)


@router.delete("/template/{id}")
def delete_template(
    id: int,
    db: Session = Depends(get_db)
):

    template.delete(db, id)

    return {"status":"deleted"}


# =========================
# BLAST
# =========================

@router.post("/blast/start")
async def start_blast(data: dict):

    await add({
        "type": "blast",
        "data": data
    })

    return {"status":"queued"}


@router.post("/blast/retry")
async def retry_blast():

    await add({
        "type": "retry"
    })

    return {"status":"queued"}

@router.get("/log")
def get_log():
    return blast.get_logs()