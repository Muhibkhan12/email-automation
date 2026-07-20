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

from database import Base


class UploadStatus(enum.Enum):
    UPLOADED = "uploaded"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class UploadFile(Base):

    __tablename__ = "uploads"

    id: Mapped[int] = mapped_column(
        Integer,
        primary_key=True,
        index=True
    )

    user_id: Mapped[int] = mapped_column(
        ForeignKey("users.id"),
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

    total_records: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    processed_records: Mapped[int] = mapped_column(
        Integer,
        default=0
    )

    status: Mapped[UploadStatus] = mapped_column(
        Enum(UploadStatus),
        default=UploadStatus.UPLOADED
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


    user = relationship(
        "User",
        back_populates="uploads"
    )