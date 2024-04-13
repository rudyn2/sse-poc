from fastapi import FastAPI, HTTPException
from starlette.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from redis import asyncio as aioredis
import json

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


REDIS_URL = "redis://localhost:6379/1"
redis = aioredis.from_url(REDIS_URL)


@app.on_event("shutdown")
async def shutdown_event():
    await redis.close()


async def generate_order_updates(user_id: str, channel: str):
    channel_id = f"{user_id}:{channel}"
    try:
        pubsub = redis.pubsub()
        await pubsub.subscribe(channel_id)
        async for message in pubsub.listen():
            if message["type"] == "message":
                yield f"data: {message['data'].decode('utf-8')}\n\n"
    finally:
        await pubsub.unsubscribe(channel_id)
        await pubsub.close()


@app.get("/{user_id}/{channel}")
async def order_stream(user_id: str | None = None, channel: str | None = None):
    if user_id is None:
        raise HTTPException(status_code=400, detail="User ID is required")
    if channel is None:
        raise HTTPException(status_code=400, detail="Channel is required")

    return StreamingResponse(
        generate_order_updates(user_id, channel), media_type="text/event-stream"
    )


@app.post("/trigger")
async def trigger_order_update(user_id: str, channel: str, order_id: int, status: str):
    channel_name = f"{user_id}:{channel}"
    order_data = json.dumps({"order_id": order_id, "status": status})
    await redis.publish(channel_name, order_data)
    return {"message": "Order update triggered"}
