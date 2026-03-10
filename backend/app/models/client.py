from datetime import datetime

from sqlalchemy import Integer, String, Float, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("advisors.id"), nullable=False)
    first_name: Mapped[str] = mapped_column(String, nullable=False)
    last_name: Mapped[str] = mapped_column(String, nullable=False)
    email: Mapped[str] = mapped_column(String, nullable=True)
    phone: Mapped[str] = mapped_column(String, nullable=True)
    company: Mapped[str] = mapped_column(String, nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=True)
    aum: Mapped[float] = mapped_column(Float, default=0.0)
    risk_profile: Mapped[str] = mapped_column(String, default="moderate")  # conservative/moderate/aggressive/very_aggressive
    status: Mapped[str] = mapped_column(String, default="active")  # active/inactive/prospect
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    advisor = relationship("Advisor", back_populates="clients")
    portfolio_holdings = relationship("ClientPortfolio", back_populates="client", cascade="all, delete-orphan")
    meetings = relationship("Meeting", back_populates="client")
    life_events = relationship("LifeEvent", back_populates="client", cascade="all, delete-orphan")
    communications = relationship("CommunicationLog", back_populates="client", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="client")
    call_cycle = relationship("ClientCallCycle", back_populates="client", uselist=False, cascade="all, delete-orphan")
    ideas = relationship("ClientIdea", back_populates="client", cascade="all, delete-orphan")
    score = relationship("ClientScore", back_populates="client", uselist=False, cascade="all, delete-orphan")
    activity_logs = relationship("ClientActivityLog", back_populates="client", cascade="all, delete-orphan")
