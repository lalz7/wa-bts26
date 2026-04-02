from sqlalchemy import Column, Integer, String

from database import Base
from database import SessionLocal

from utils.phone import normalize_number


class Siswa(Base):

    __tablename__ = "siswa"

    id = Column(Integer, primary_key=True, index=True)
    nama = Column(String)
    kelas = Column(String)
    no_hp = Column(String)
    pdf = Column(String)


def get_all(db):

    return db.query(Siswa).all()


def delete_all(db):

    db.query(Siswa).delete()
    db.commit()


def create_many(db, data):

    delete_all(db)

    for row in data:

        siswa = Siswa(
            id=row["id"],
            nama=row["nama"],
            kelas=row["kelas"],
            no_hp=normalize_number(row["no_hp"])
        )

        db.add(siswa)

    db.commit()


def update_pdf(db, id, file):

    siswa = db.query(Siswa).filter(
        Siswa.id == id
    ).first()

    if siswa:
        siswa.pdf = file

    db.commit()
    

def delete(db, id):

    db.query(Siswa).filter(
        Siswa.id == id
    ).delete()

    db.commit()