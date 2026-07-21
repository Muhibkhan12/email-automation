from sqlalchemy import String,Column, Integer, Boolean, ForeignKey, DateTime, Enum
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from datetime import datetime, UTC
from database import Base

class AccountStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class SenderAccount(Base):
    __tablename__ = "sender_account"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id : Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    email : Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password : Mapped[str] = mapped_column(String(255), nullable=False)

    display_name : Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    provider : Mapped[str] = mapped_column(
        String(50),
        default="gmail"
    )

    username : Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    password : Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    smtp_host : Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    smtp_port : Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )

    daily_limit : Mapped[int] = mapped_column(
        Integer,
        default=500
    )
    hourly_limit : Mapped[int] = mapped_column(
        Integer,
        default=50
    )
    email_sent_hour : Mapped[int] = mapped_column(
        Integer,
        default=0
    )
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus),
        default=AccountStatus.INACTIVE
    )
    created_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(UTC)
    )
    updated_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(UTC),
        onupdate=datetime.now(UTC)
    )