import asyncio
import os
from datetime import datetime

from database import SessionLocal

from services import student
from services import template
from services import whatsapp

from services.log import Log

from core.websocket import manager


last_logs = []


async def process(data):

    global last_logs

    db = SessionLocal()

    siswa = student.get_all(db)

    # filter kelas
    kelas = data.get("kelas")

    if kelas and kelas != "all":
        siswa = [s for s in siswa if s.kelas == kelas]

    tmpl = template.get_by_id(
        db,
        data["template_id"]
    )

    total = len(siswa)

    success = 0
    failed = 0

    logs = []

    for i, s in enumerate(siswa):

        try:

            message = template.render(
                tmpl.isi,
                {
                    "nama": s.nama,
                    "kelas": s.kelas
                }
            )

            # ======================
            # kirim pesan dulu
            # ======================

            await whatsapp.send_message(
                s.no_hp,
                message
            )

            await asyncio.sleep(1)

            # ======================
            # kirim pdf
            # ======================

            if s.pdf:

                filename = os.path.basename(s.pdf)

                await whatsapp.send_document(
                    s.no_hp,
                    s.pdf,
                    filename
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

            logs.append({
                "id": s.id,
                "nama": s.nama,
                "kelas": s.kelas,
                "status": "success"
            })

            await manager.send_to_frontend({
                "type": "blast_log",
                "data": {
                    "id": s.id,
                    "nama": s.nama,
                    "kelas": s.kelas,
                    "status": "success"
                }
            })

        except Exception as e:

            failed += 1

            log = Log(
                siswa_id=s.id,
                nama=s.nama,
                kelas=s.kelas,
                status="failed",
                waktu=datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            )

            db.add(log)
            db.commit()

            logs.append({
                "id": s.id,
                "nama": s.nama,
                "kelas": s.kelas,
                "status": "failed"
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

        # progress

        await manager.send_to_frontend({
            "type": "blast_progress",
            "total": total,
            "success": success,
            "failed": failed,
            "current": i + 1
        })

        await asyncio.sleep(4)

    last_logs = logs

    await manager.send_to_frontend({
        "type": "blast_done"
    })

    db.close()


async def retry():

    global last_logs

    db = SessionLocal()

    failed = [
        l for l in last_logs
        if l["status"] == "failed"
    ]

    total = len(failed)

    success = 0
    failed_count = 0

    for i, f in enumerate(failed):

        try:

            s = db.query(student.Siswa).filter(
                student.Siswa.id == f["id"]
            ).first()

            await whatsapp.send_message(
                s.no_hp,
                "Retry pengiriman"
            )

            await asyncio.sleep(1)

            if s.pdf:

                filename = os.path.basename(s.pdf)

                await whatsapp.send_document(
                    s.no_hp,
                    s.pdf,
                    filename
                )

            success += 1

        except:

            failed_count += 1

        await manager.send_to_frontend({
            "type": "blast_progress",
            "total": total,
            "success": success,
            "failed": failed_count,
            "current": i + 1
        })

        await asyncio.sleep(4)

    await manager.send_to_frontend({
        "type": "blast_done"
    })