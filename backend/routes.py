from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from fastapi import HTTPException, UploadFile, File, Depends

from sqlalchemy.orm import Session

import shutil
from pathlib import Path

from database import get_db, SessionLocal

from core.websocket import manager
from core.queue import add
from core.paths import EXCEL_DIR, INVOICES_DIR, ensure_data_dirs

from services import whatsapp
from services import student
from services import template
from services import blast
from services import admin

from utils import excel, zip


router = APIRouter()


def clear_directory(directory: Path):

    if not directory.exists():
        return

    for item in directory.iterdir():
        if item.is_dir():
            shutil.rmtree(item, ignore_errors=True)
        else:
            item.unlink(missing_ok=True)


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
    db = SessionLocal()

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "admin" and data.get("data"):
                admin.save_number(db, data["data"])

            await manager.send_to_frontend(data)

    except WebSocketDisconnect:
        await manager.disconnect_gateway()

        await manager.send_to_frontend({
            "type": "disconnected"
        })
    finally:
        db.close()


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


@router.get("/admin")
def get_admin(db: Session = Depends(get_db)):
    return admin.get_latest(db)


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
    clear_directory(INVOICES_DIR)
    clear_directory(EXCEL_DIR)

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

    ensure_data_dirs()
    clear_directory(EXCEL_DIR)

    path = EXCEL_DIR / file.filename

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    result = excel.read_excel(str(path))

    student.create_many(db, result["rows"])

    return {
        "status": "ok",
        "inserted": len(result["rows"]),
        "skipped": result["skipped"],
        "message": (
            f"Import berhasil: {len(result['rows'])} baris."
            if not result["skipped"]
            else f"Import berhasil: {len(result['rows'])} baris, "
            f"{len(result['skipped'])} baris dilewati."
        )
    }


# =========================
# UPLOAD ZIP
# =========================

@router.post("/upload/zip")
async def upload_zip(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):

    ensure_data_dirs()
    clear_directory(INVOICES_DIR)

    path = INVOICES_DIR / file.filename

    with open(path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    files = zip.extract_zip(
        str(path),
        str(INVOICES_DIR)
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

@router.get("/log")
def get_log():
    return blast.get_logs()
