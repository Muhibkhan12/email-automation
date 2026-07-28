import enum

from sqlalchemy import Integer, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from database import Base


class EmailLogStatus(enum.Enum):
    PENDING = "Pending"
    SENT = "Sent"
    FAILED = "Failed"


class EmailLog(Base):
    __tablename__ = "email_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    campaign_id: Mapped[int] = mapped_column(
        ForeignKey("campaigns.id"),
        nullable=False
    )

    recipient_id: Mapped[int] = mapped_column(
        ForeignKey("campaign_recipients.id"),
        nullable=False
    )

    sender_account_id: Mapped[int] = mapped_column(
        ForeignKey("sender_accounts.id"),
        nullable=False
    )

    status: Mapped[EmailLogStatus] = mapped_column(
        Enum(EmailLogStatus),
        default=EmailLogStatus.PENDING,
        nullable=False
    )

    error_message: Mapped[str | None] = mapped_column(
        Text,
        nullable=True
    )

    sent_at: Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )

    campaign = relationship("Campaign", back_populates="email_logs")
    recipient = relationship("CampaignRecipient", back_populates="email_logs")
    sender_account = relationship("SenderAccount", back_populates="email_logs")