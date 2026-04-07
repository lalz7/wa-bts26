from sqlalchemy import Column, Integer, String
from database import Base

from utils.phone import normalize_number


class Admin(Base):

    __tablename__ = "admin"

    id = Column(Integer, primary_key=True)
    no_hp = Column(String)


def get_latest(db):

    return db.query(Admin).order_by(Admin.id.desc()).first()


def save_number(db, number):

    normalized = normalize_number(number)

    admin = get_latest(db)

    if admin:
        admin.no_hp = normalized
    else:
        admin = Admin(no_hp=normalized)
        db.add(admin)

    db.commit()
    db.refresh(admin)

    return admin
