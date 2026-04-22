from fastapi import FastAPI
import asyncio

from fastapi.middleware.cors import CORSMiddleware

from routes import router

from database import Base, engine
from services.student import Siswa
from services.template import Template
from services.log import Log
from services.admin import Admin
from core.worker import worker


Base.metadata.create_all(bind=engine)

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(router)


@app.get("/")
def root():
    return {"status": "WA-BTS26 Backend Running"}


@app.on_event("startup")
async def startup():
    asyncio.create_task(worker())

if __name__ == "__main__":
    import uvicorn
    # Sesuaikan port dengan yang ada di index.js
    uvicorn.run(app, host="127.0.0.1", port=1602)