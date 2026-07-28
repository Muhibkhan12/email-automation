import enum

from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from database import Base


class RecipientStatus(enum.Enum):
    PENDING = "Pending"
    QUEUED = "Queued"
    SENDING = "Sending"
    SENT = "Sent"
    FAILED = "Failed"


class CampaignRecipient(Base):
    __tablename__ = "campaign_recipients"
    id : Mapped[int] = mapped_column(Integer, primary_key=True ,index=True)
    campaign_id : Mapped[int] = mapped_column(Integer, ForeignKey("campaigns.id"), nullable=False)
    upload_id : Mapped[int] = mapped_column(Integer, ForeignKey("uploads.id"), nullable=False)
    name : Mapped[str] = mapped_column(String(255), nullable=False)

    email : Mapped[str] = mapped_column(String(255), nullable=False)

    company: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    phone: Mapped[str | None] = mapped_column(
        String(50),
        nullable=True
    )

    is_valid_email: Mapped[bool] = mapped_column(
        Boolean,
        default=True
    )

    status: Mapped[RecipientStatus] = mapped_column(
        Enum(RecipientStatus),
        default=RecipientStatus.PENDING
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC)
    )

    campaign: Mapped["Campaign"] = relationship(
        "Campaign",
        back_populates="recipients"
    )
    upload: Mapped["UploadFile"] = relationship(
        "UploadFile",
        back_populates="recipients"
    )

    email_logs = relationship(
        "EmailLog",
        back_populates="recipient",
        cascade="all, delete-orphan"
    )