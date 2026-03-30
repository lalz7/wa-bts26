import asyncio
import random

from core.queue import get
from core.config import DELAY_MIN, DELAY_MAX

from services import blast


running = False


async def worker():

    global running

    if running:
        return

    running = True

    while True:

        job = await get()

        if job["type"] == "blast":

            await blast.process(job["data"])

        if job["type"] == "retry":

            await blast.retry()

        delay = random.randint(
            DELAY_MIN,
            DELAY_MAX
        )

        await asyncio.sleep(delay)