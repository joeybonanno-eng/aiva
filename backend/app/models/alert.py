from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("advisors.id"), nullable=False)
    type: Mapped[str] = mapped_column(String, nullable=False)  # market/client/portfolio/compliance/opportunity
    title: Mapped[str] = mapped_column(String, nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    severity: Mapped[str] = mapped_column(String, default="info")  # critical/warning/info
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=True)
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    action_url: Mapped[str] = mapped_column(String, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    advisor = relationship("Advisor", back_populates="alerts")
    client = relationship("Client", back_populates="alerts")
