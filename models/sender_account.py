from sqlalchemy import String,Column, Integer, Boolean, ForeignKey
from sqlachemy.orm import Mapped, mapped_column, relationship

from datetime import datetime, UTC
from database import Base


class SenderAccount(Base):
    __tablename__ = "sender_account"
    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    user_id : Mapped[int] = mapped_column(ForeignKey("user_id"), nullable=False)

    email : Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password : Mapped[str] = mapped_column(String(255), nullable=False)

    display_name : Mapped[str | None] = mapped_column(
        String(255),
        nullable=True
    )

    provider : Mapped[str] = mapped_column(
        String(50),
        default="gmail",
    )
