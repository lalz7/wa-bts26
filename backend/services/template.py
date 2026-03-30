from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text
from database import Base


class Template(Base):

    __tablename__ = "template"

    id = Column(Integer, primary_key=True, index=True)
    judul = Column(String)
    isi = Column(Text)


# ========================
# CRUD
# ========================

def get_all(db: Session):
    return db.query(Template).all()


def create(db: Session, data):

    template = Template(
        judul=data["judul"],
        isi=data["isi"]
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    return template


def update(db: Session, template_id, data):

    template = db.query(Template).filter(
        Template.id == template_id
    ).first()

    if template:

        template.judul = data["judul"]
        template.isi = data["isi"]

        db.commit()

    return template


def delete(db: Session, template_id):

    template = db.query(Template).filter(
        Template.id == template_id
    ).first()

    if template:
        db.delete(template)
        db.commit()


def get_by_id(db: Session, template_id):

    return db.query(Template).filter(
        Template.id == template_id
    ).first()

def render(message, data):

    result = message

    for key in data:
        result = result.replace(
            f"${{{key}}}",
            str(data[key])
        )

    return result