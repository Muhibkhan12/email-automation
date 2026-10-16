import json
import os

import redis  # type: ignore

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)

ANALYTICS_TTL_SECONDS = 60 * 60 * 24  # 24 hours


def analytics_key(upload_id: int) -> str:
    return f"upload:{upload_id}:analytics"


def save_analytics(upload_id: int, data: dict) -> None:
    redis_client.set(
        analytics_key(upload_id),
        json.dumps(data),
        ex=ANALYTICS_TTL_SECONDS,
    )


def load_analytics(upload_id: int) -> dict | None:
    raw = redis_client.get(analytics_key(upload_id))
    return json.loads(raw) if raw else None