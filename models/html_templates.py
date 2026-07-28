from sqlalchemy import String,Integer,Text,DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime, UTC
from database import Base


class HTMLTemplate(Base):

    __tablename__ = "html_templates"

    id : Mapped[int] = mapped_column(Integer, primary_key=True,index=True)
    name : Mapped[str] = mapped_column(String(255), nullable=False)
    html_content : Mapped[str] = mapped_column(Text,nullable=False)
    description: Mapped[str | None] = mapped_column(String(255),nullable=True)
    is_active : Mapped[bool] = mapped_column(Boolean, default=True)
    created_at : Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC))
    updated_at : Mapped[datetime] = mapped_column(DateTime, default=lambda: datetime.now(UTC), onupdate=lambda : datetime.now(UTC))