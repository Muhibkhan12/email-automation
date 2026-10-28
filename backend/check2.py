from sqlalchemy import text

from models.upload_file import Upload  # noqa: F401
from models.user import User  # noqa: F401
from models.email_logs import EmailLog  # noqa: F401
from models.sender_account import SenderAccount  # noqa: F401
from models.html_templates import HTMLTemplate  # noqa: F401

from database import SessionLocal

db = SessionLocal()
q = lambda sql: db.execute(text(sql)).fetchall()

print("UTC now        :", q("SELECT UTC_TIMESTAMP()"))
print("recipient stats:", q("SELECT status, COUNT(*), MIN(scheduled_at), MAX(scheduled_at) FROM campaign_recipients GROUP BY status"))
print("campaign status:", q("SELECT id, status, sender_account_id FROM campaigns ORDER BY id DESC LIMIT 3"))
print("due + RUNNING  :", q("""
    SELECT COUNT(*) FROM campaign_recipients r
    JOIN campaigns c ON c.id = r.campaign_id
    WHERE r.status = 'PENDING' AND r.scheduled_at <= UTC_TIMESTAMP()
      AND c.status = 'RUNNING'
"""))
db.close()

print("--- dispatcher direct call ---")
from workers.sending_emails import dispatch_due_task
print("result:", dispatch_due_task())