from sqlalchemy import String,Integer, ForeignKey, DateTime, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
import enum

from datetime import datetime, UTC
from backend.database import Base

class AccountStatus(enum.Enum):
    ACTIVE = "active"
    INACTIVE = "inactive"

class Provider(enum.Enum):
    OUTLOOK = "OUTLOOK"
    GMAIL = "GMAIL"

class SenderAccount(Base):
    __tablename__ = "sender_accounts"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id : Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)

    email : Mapped[str] = mapped_column(String(255), unique=True, nullable=False)

    display_name : Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )
    provider: Mapped[Provider] = mapped_column(
        Enum(Provider),
        nullable=False
    )
    access_token: Mapped[str] = mapped_column(
        Text(),
        nullable=True,
    )
    refresh_token : Mapped[str] = mapped_column(
        Text(),
        nullable=True,
    )
    token_expires_at : Mapped[datetime | None] = mapped_column(
        DateTime,
        nullable=True
    )
    emails_sent_today : Mapped[int] = mapped_column(
        Integer(),
        nullable=False,
        default=0
    )
    daily_limit : Mapped[int] = mapped_column(
        Integer,
        default=100
    )
    hourly_limit : Mapped[int] = mapped_column(
        Integer,
        default=20
    )
    emails_sent_hour : Mapped[int] = mapped_column(
        Integer,
        default=0
    )
    status: Mapped[AccountStatus] = mapped_column(
        Enum(AccountStatus),
        default=AccountStatus.ACTIVE
    )
    created_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC)
    )
    updated_at : Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(UTC),
        onupdate=datetime.now(UTC)
    )
    user = relationship(
        "User",
        back_populates="sender_accounts"
    )

    campaigns = relationship("Campaign", back_populates="sender_account")
    email_logs = relationship("EmailLog", back_populates="sender_account")