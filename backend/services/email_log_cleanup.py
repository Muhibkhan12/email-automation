import asyncio
import logging
from datetime import datetime, timedelta, UTC

from sqlalchemy.orm import Session

from database import SessionLocal  # <- apni database.py mein jo session factory ka naam hai
from models.email_logs import EmailLog

logger = logging.getLogger(__name__)

RETENTION_DAYS = 30
CLEANUP_INTERVAL_SECONDS = 24 * 60 * 60  # roz ek baar


def delete_old_email_logs(db: Session, days: int = RETENTION_DAYS) -> int:
    cutoff = datetime.now(UTC) - timedelta(days=days)
    deleted = (
        db.query(EmailLog)
        .filter(EmailLog.created_at < cutoff)
        .delete(synchronize_session=False)
    )
    db.commit()
    return deleted


def _run_cleanup_once() -> int:
    db = SessionLocal()
    try:
        return delete_old_email_logs(db)
    except Exception:
        db.rollback()
        logger.exception("Email log cleanup failed")
        return 0
    finally:
        db.close()


async def email_log_cleanup_loop():
    while True:
        deleted = await asyncio.to_thread(_run_cleanup_once)
        logger.info("Email log cleanup: %s old logs deleted", deleted)
        await asyncio.sleep(CLEANUP_INTERVAL_SECONDS)