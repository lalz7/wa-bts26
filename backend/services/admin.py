from sqlalchemy import Column, Integer, String
from database import Base


class Admin(Base):

    __tablename__ = "admin"

    id = Column(Integer, primary_key=True)
    no_hp = Column(String)