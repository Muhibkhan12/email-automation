from sqlalchemy import String,DateTime, Enum
import enum

from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from database import Base


class UserRole(enum.Enum):
    ADMIN = "ADMIN"
    EMPLOYEE = "EMPLOYEE"


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(255),nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True,nullable=False,index=True)
    password: Mapped[str] = mapped_column(String(255),nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole),
        default=UserRole.EMPLOYEE,
        nullable=False
    )
    created_at : Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )
    updated_at : Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda : datetime.now(UTC),
        onupdate=lambda : datetime.now(UTC)
    )
    sender_accounts: Mapped[list["SenderAccount"]] = relationship(
        "SenderAccount",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    campaigns: Mapped[list["Campaign"]] = relationship(
        "Campaign",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    templates = relationship(
        "HTMLTemplate",
        back_populates="user"
    )