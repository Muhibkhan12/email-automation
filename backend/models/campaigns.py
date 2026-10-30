from sqlalchemy import String, DateTime, Integer, ForeignKey, Enum as SqlEnum
from enum import Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from database import Base


class CampaignStatus(str, Enum):
    DRAFT = "Draft"
    READY = "Ready"
    SCHEDULED = "Scheduled"
    RUNNING = "Running"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    FAILED = "Failed"
    CANCELLED = "Cancelled"


class Campaign(Base):
    __tablename__ = "campaigns"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    campaign_name: Mapped[str] = mapped_column(String(255), nullable=False)
    subject: Mapped[str] = mapped_column(String(255), nullable=False)
    template_id: Mapped[int] = mapped_column(
        ForeignKey("html_templates.id", ondelete="RESTRICT"), nullable=True
    )
    sender_account_id: Mapped[int] = mapped_column(
        ForeignKey("sender_accounts.id", ondelete="RESTRICT"), nullable=True
    )
    # Progress counters
    recipient_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    sent_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    failed_count: Mapped[int] = mapped_column(
        Integer, nullable=False, default=0, server_default="0"
    )
    status: Mapped[CampaignStatus] = mapped_column(
        SqlEnum(CampaignStatus),
        default=CampaignStatus.DRAFT,
        nullable=False,
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(UTC)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC),
    )
    # Relationships
    template = relationship("HTMLTemplate", back_populates="campaigns")
    user = relationship("User", back_populates="campaigns")
    recipients = relationship(
        "CampaignRecipient", back_populates="campaign", cascade="all, delete-orphan"
    )
    uploads = relationship(
        "Upload", back_populates="campaign", cascade="all, delete-orphan"
    )
    email_logs = relationship(
        "EmailLog", back_populates="campaign", cascade="all, delete-orphan"
    )
    sender_account = relationship("SenderAccount", back_populates="campaigns")