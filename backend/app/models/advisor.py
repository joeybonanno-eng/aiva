from datetime import datetime

from sqlalchemy import Integer, String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Advisor(Base):
    __tablename__ = "advisors"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String, nullable=False)
    full_name: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    clients = relationship("Client", back_populates="advisor")
    meetings = relationship("Meeting", back_populates="advisor")
    alerts = relationship("Alert", back_populates="advisor")
    tasks = relationship("AdvisorTask", back_populates="advisor")
    ideas = relationship("ClientIdea", back_populates="advisor")
