import asyncio
from datetime import datetime
from uuid import uuid4

from database import SessionLocal

from services import student
from services import template
from services import whatsapp
from services.log import Log

from core.websocket import manager
from core.config import random_delay


async def process(data):

    db = SessionLocal()

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


def get_logs():

    db = SessionLocal()

    logs = db.query(Log).order_by(Log.id.desc()).all()

    db.close()

    return logs
