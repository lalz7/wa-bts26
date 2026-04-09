import asyncio
import csv
import io
from datetime import datetime
from uuid import uuid4

from sqlalchemy import func

from database import SessionLocal

from services import student
from services import template
from services import whatsapp
from services.log import Log

from core.websocket import manager
from core.config import random_delay


async def process(data):

    db = SessionLocal()

    if not manager.is_whatsapp_connected():
        await manager.send_to_frontend({
            "type": "blast_error",
            "message": "WhatsApp belum terhubung. Login atau scan QR terlebih dahulu."
        })
        db.close()
        return

    siswa = student.get_all(db)

    kelas = data.get("kelas")

    if kelas and kelas != "all":
        siswa = [s for s in siswa if s.kelas == kelas]

    tmpl = template.get_by_id(
        db,
        data["template_id"]
    )

    if not tmpl:
        await manager.send_to_frontend({
            "type": "blast_error",
            "message": "Template tidak ditemukan"
        })
        db.close()
        return

    initial_total = len(siswa)
    run_id = str(uuid4())

    success = 0
    failed = 0
    processed = 0

    retry_queue = []

    await manager.send_to_frontend({
        "type": "blast_started",
        "run_id": run_id,
        "mode": "blast",
        "total": initial_total
    })

    for s in siswa:
        message = None

        try:
            message = template.render(
                tmpl.isi,
                {
                    "nama": s.nama,
                    "kelas": s.kelas
                }
            )

            await whatsapp.send_message(
                s.no_hp,
                message
            )

            if s.pdf:
                await whatsapp.send_document(
                    s.no_hp,
                    s.pdf
                )

            success += 1

            log = Log(
                siswa_id=s.id,
                nama=s.nama,
                kelas=s.kelas,
                status="success",
                waktu=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )

            db.add(log)
            db.commit()

            await manager.send_to_frontend({
                "type": "blast_log",
                "data": {
                    "id": s.id,
                    "nama": s.nama,
                    "kelas": s.kelas,
                    "status": "success"
                }
            })

        except Exception:
            log = Log(
                siswa_id=s.id,
                nama=s.nama,
                kelas=s.kelas,
                status="failed",
                waktu=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )

            db.add(log)
            db.commit()

            retry_queue.append({
                "id": s.id,
                "message": message or ""
            })

            await manager.send_to_frontend({
                "type": "blast_log",
                "data": {
                    "id": s.id,
                    "nama": s.nama,
                    "kelas": s.kelas,
                    "status": "failed"
                }
            })

        processed += 1

        await manager.send_to_frontend({
            "type": "blast_progress",
            "run_id": run_id,
            "phase": "initial",
            "total": initial_total + len(retry_queue),
            "success": success,
            "failed": failed,
            "retry_pending": len(retry_queue),
            "current": processed
        })

        await asyncio.sleep(random_delay())

    for item in retry_queue:

        s = db.query(student.Siswa).filter(
            student.Siswa.id == item["id"]
        ).first()

        try:

            if not s:
                raise ValueError("Siswa tidak ditemukan saat auto retry")

            await whatsapp.send_message(
                s.no_hp,
                item["message"]
            )

            if s.pdf:
                await whatsapp.send_document(
                    s.no_hp,
                    s.pdf
                )

            success += 1

            log = Log(
                siswa_id=s.id,
                nama=s.nama,
                kelas=s.kelas,
                status="success",
                waktu=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )

            db.add(log)
            db.commit()

            await manager.send_to_frontend({
                "type": "blast_log",
                "data": {
                    "id": s.id,
                    "nama": s.nama,
                    "kelas": s.kelas,
                    "status": "success"
                }
            })

        except Exception:
            failed += 1

            if s:
                log = Log(
                    siswa_id=s.id,
                    nama=s.nama,
                    kelas=s.kelas,
                    status="failed",
                    waktu=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                )

                db.add(log)
                db.commit()

                await manager.send_to_frontend({
                    "type": "blast_log",
                    "data": {
                        "id": s.id,
                        "nama": s.nama,
                        "kelas": s.kelas,
                        "status": "failed"
                    }
                })

        processed += 1

        await manager.send_to_frontend({
            "type": "blast_progress",
            "run_id": run_id,
            "phase": "retry",
            "total": initial_total + len(retry_queue),
            "success": success,
            "failed": failed,
            "retry_pending": max(
                initial_total + len(retry_queue) - processed,
                0
            ),
            "current": processed
        })

        await asyncio.sleep(random_delay())

    await manager.send_to_frontend({
        "type": "blast_done",
        "run_id": run_id,
        "mode": "blast",
        "total": initial_total + len(retry_queue),
        "success": success,
        "failed": failed,
        "retried": len(retry_queue)
    })

    db.close()


def get_logs(
    db,
    tanggal=None,
    kelas=None,
    status=None,
    search=None,
    page=1,
    limit=20,
    sort_by="waktu",
    sort_dir="desc"
):

    query = build_log_query(
        db,
        tanggal=tanggal,
        kelas=kelas,
        status=status,
        search=search
    )

    total = query.with_entities(func.count(Log.id)).scalar() or 0

    sort_map = {
        "waktu": Log.waktu,
        "nama": Log.nama,
        "kelas": Log.kelas,
        "status": Log.status
    }

    sort_column = sort_map.get(sort_by, Log.waktu)

    if sort_dir == "asc":
        query = query.order_by(sort_column.asc(), Log.id.asc())
    else:
        query = query.order_by(sort_column.desc(), Log.id.desc())

    items = query.offset((page - 1) * limit).limit(limit).all()

    kelas_items = db.query(Log.kelas).distinct().order_by(Log.kelas.asc()).all()

    return {
        "items": items,
        "meta": {
            "page": page,
            "limit": limit,
            "total": total,
            "total_pages": max((total + limit - 1) // limit, 1)
        },
        "kelas_options": [
            item[0] for item in kelas_items if item[0]
        ]
    }


def export_logs_csv(
    db,
    tanggal=None,
    kelas=None,
    status=None,
    search=None,
    sort_by="waktu",
    sort_dir="desc"
):

    query = build_log_query(
        db,
        tanggal=tanggal,
        kelas=kelas,
        status=status,
        search=search
    )

    sort_map = {
        "waktu": Log.waktu,
        "nama": Log.nama,
        "kelas": Log.kelas,
        "status": Log.status
    }

    sort_column = sort_map.get(sort_by, Log.waktu)

    if sort_dir == "asc":
        rows = query.order_by(sort_column.asc(), Log.id.asc()).all()
    else:
        rows = query.order_by(sort_column.desc(), Log.id.desc()).all()

    buffer = io.StringIO()
    writer = csv.writer(buffer)

    writer.writerow([
        "Waktu",
        "Nama",
        "Kelas",
        "Status"
    ])

    for row in rows:
        writer.writerow([
            row.waktu or "",
            row.nama or "",
            row.kelas or "",
            row.status or ""
        ])

    return buffer.getvalue()


def build_log_query(
    db,
    tanggal=None,
    kelas=None,
    status=None,
    search=None
):

    query = db.query(Log)

    if tanggal:
        query = query.filter(Log.waktu.like(f"{tanggal}%"))

    if kelas and kelas != "all":
        query = query.filter(Log.kelas == kelas)

    if status and status != "all":
        query = query.filter(Log.status == status)

    if search:
        keyword = f"%{search}%"
        query = query.filter(
            (Log.nama.ilike(keyword)) |
            (Log.kelas.ilike(keyword))
        )

    return query
