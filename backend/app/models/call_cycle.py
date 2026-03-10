from datetime import datetime, date
from sqlalchemy import Integer, String, Float, Boolean, DateTime, Date, ForeignKey, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ClientCallCycle(Base):
    __tablename__ = "client_call_cycles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=False, unique=True)
    call_cycle_days: Mapped[int] = mapped_column(Integer, default=90)  # 30/60/90/180
    last_contacted_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    next_due_at: Mapped[date] = mapped_column(Date, nullable=True)
    override_active: Mapped[bool] = mapped_column(Boolean, default=False)
    override_reason: Mapped[str] = mapped_column(String, nullable=True)
    status: Mapped[str] = mapped_column(String, default="on_track")  # on_track/due_soon/overdue/urgent_override
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="call_cycle")
