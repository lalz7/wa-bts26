from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String
from database import Base


class Siswa(Base):

    __tablename__ = "siswa"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String)
    kelas = Column(String)
    no_hp = Column(String)
    pdf = Column(String, nullable=True)


# ========================
# CRUD
# ========================

def get_all(db: Session):
    return db.query(Siswa).all()


def create_many(db: Session, siswa_list):

    for s in siswa_list:

        exist = db.query(Siswa).filter(
            Siswa.id == s["id"]
        ).first()

        if exist:

            exist.nama = s["nama"]
            exist.kelas = s["kelas"]
            exist.no_hp = s["no_hp"]

        else:

            siswa = Siswa(**s)
            db.add(siswa)

    db.commit()


def update_pdf(db: Session, siswa_id, pdf):

    siswa = db.query(Siswa).filter(
        Siswa.id == siswa_id
    ).first()

    if siswa:
        siswa.pdf = pdf
        db.commit()


def delete_all(db: Session):

    db.query(Siswa).delete()
    db.commit()