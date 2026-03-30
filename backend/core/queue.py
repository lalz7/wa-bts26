import asyncio

queue = asyncio.Queue()

running = False


async def add(job):

    await queue.put(job)


async def get():

    job = await queue.get()

    return job