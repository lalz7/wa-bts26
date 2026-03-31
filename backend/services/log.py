from sqlalchemy import Column, Integer, String
from database import Base


class Log(Base):

    __tablename__ = "log"

    id = Column(Integer, primary_key=True, index=True)
    siswa_id = Column(Integer)
    nama = Column(String)
    kelas = Column(String)
    status = Column(String)
    waktu = Column(String)