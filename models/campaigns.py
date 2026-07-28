from sqlalchemy import Column,String,Integer,DateTime,Enum as SqlEnum, ForeignKey
from enum import Enum
from sqlalchemy.orm import Mapped,mapped_column, relationship
from datetime import datetime, UTC
from database import Base

class CampaignStatus(str, Enum):
    DRAFT = "Draft"
    READY = "Ready"
    RUNNING = "Running"
    PAUSED = "Paused"
    COMPLETED = "Completed"
    CANCELLED = "Cancelled"

class Campaign(Base):
    __tablename__ = "campaigns"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)

    campaign_name: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    subject: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    template_id: Mapped[int] = mapped_column(
        ForeignKey("html_templates.id", ondelete="RESTRICT"),
        nullable=False
    )

    sender_account_id: Mapped[int] = mapped_column(
        ForeignKey("sender_accounts.id", ondelete="RESTRICT"),
        nullable=False
    )

    status: Mapped[CampaignStatus] = mapped_column(
        SqlEnum(CampaignStatus),
        default=CampaignStatus.DRAFT,
        nullable=False
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.utcnow,
        onupdate=datetime.utcnow
    )

    # Relationships
    template = relationship("HtmlTemplate", back_populates="campaigns")
    sender_account = relationship("SenderAccount", back_populates="campaigns")
    recipients = relationship(
        "CampaignRecipient",
        back_populates="campaign",
        cascade="all, delete-orphan"
    )