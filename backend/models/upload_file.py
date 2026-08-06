import enum

from datetime import datetime, UTC

from sqlalchemy import (
    ForeignKey,
    String,
    Integer,
    DateTime,
    Enum
)

from sqlalchemy.orm import Mapped, mapped_column, relationship

from backend.database import Base


class UploadStatus(enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Upload(Base):

    __tablename__ = "uploads"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    campaign_id: Mapped[int] = mapped_column(
        ForeignKey("campaigns.id"),
        nullable=False
    )

    original_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    stored_filename: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    file_path: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    file_size: Mapped[int] = mapped_column(
        Integer,
        nullable=False
    )
    mime_type: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    error_message: Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    total_records: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    processed_records: Mapped[int] = mapped_column(
        Integer,
        default=0,
        nullable=False
    )

    status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus),
        default=UploadStatus.UPLOADED,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC),
        onupdate=lambda: datetime.now(UTC)
    )


    campaign = relationship(
        "Campaign",
        back_populates="uploads"
    )

    recipients: Mapped[list["CampaignRecipient"]] = relationship(
        "CampaignRecipient",
        back_populates="upload"
    )