from sqlalchemy import String,DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from models.upload_file import UploadFile
from database import Base


class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    username: Mapped[str] = mapped_column(String(255),nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True,nullable=False,index=True)
    password: Mapped[str] = mapped_column(String(255),nullable=False)
    created_at : Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(UTC)
    )
    updated_at : Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda : datetime.now(UTC),
        onupdate=lambda : datetime.now(UTC)
    )

    uploads: Mapped[list["UploadFile"]] = relationship(
    "UploadFile",   
    back_populates="user",
    cascade="all, delete-orphan"
)