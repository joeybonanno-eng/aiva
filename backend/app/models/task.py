from datetime import datetime, date

from sqlalchemy import Integer, String, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class AdvisorTask(Base):
    __tablename__ = "advisor_tasks"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("advisors.id"), nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    priority: Mapped[str] = mapped_column(String, default="medium")  # high/medium/low
    status: Mapped[str] = mapped_column(String, default="pending")  # pending/in_progress/completed
    due_date: Mapped[date] = mapped_column(Date, nullable=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    advisor = relationship("Advisor", back_populates="tasks")
