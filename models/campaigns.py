from sqlalchemy import String,DateTime,Enum as SqlEnum, ForeignKey
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

    # FIX: was missing — required because User.campaigns uses back_populates="user"
    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
        nullable=False
    )

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
    # FIX: "HtmlTemplate" -> "HTMLTemplate" (must match actual class name in models/html_templates.py)
    template = relationship("HTMLTemplate", back_populates="campaigns")

    # FIX: was missing — required by User.campaigns back_populates="user"
    user = relationship("User", back_populates="campaigns")

    recipients = relationship(
        "CampaignRecipient",
        back_populates="campaigns",
        cascade="all, delete-orphan"
    )

    # FIX: was missing — required by UploadFile.campaign back_populates="uploads"
    uploads = relationship(
        "Upload",
        back_populates="campaigns",
        cascade="all, delete-orphan"
    )

    # FIX: was missing — required by EmailLog.campaign back_populates="email_logs"
    email_logs = relationship(
        "EmailLog",
        back_populates="campaigns",
        cascade="all, delete-orphan"
    )

    sender_account = relationship(
        "SenderAccount",
        back_populates="campaigns",
        cascade="all, delete-orphan"
    )