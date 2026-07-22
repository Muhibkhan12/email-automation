from sqlalchemy import String, Integer, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from database import Base



class Recipients(Base):
    __tablename__ = "recipients"

    id : Mapped[int] = mapped_column(Integer, primary_key=True ,Index=True)
    user_id : Mapped[int] = mapped_column(Integer, ForeignKey("users.id"), nullable=False)
    upload_id : Mapped[int] = mapped_column(Integer, ForeignKey("uploads.id"), nullable=False)
    name : Mapped[str] = mapped_column(String(255), nullable=False)

    email : Mapped[str] = mapped_column(String(255), nullable=False)

    user: Mapped["User"] = relationship(
        "User",
        back_populates="recipients"
    )
    uploads : Mapped["UploadFile"] = relationship(
        "UploadFile",
        back_populates="recipients"
    )