from datetime import datetime
from sqlalchemy import Integer, String, Float, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class ClientIdea(Base):
    __tablename__ = "client_ideas"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=False)
    template_id: Mapped[int] = mapped_column(Integer, ForeignKey("idea_templates.id"), nullable=True)
    advisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("advisors.id"), nullable=False)
    trigger_type: Mapped[str] = mapped_column(String, nullable=False)
    trigger_data: Mapped[dict] = mapped_column(JSON, nullable=True)
    subject: Mapped[str] = mapped_column(String, nullable=False)
    rendered_content: Mapped[str] = mapped_column(Text, nullable=False)
    channel: Mapped[str] = mapped_column(String, default="email")
    score: Mapped[float] = mapped_column(Float, default=50.0)  # 0-100
    status: Mapped[str] = mapped_column(String, default="pending")  # pending/sent/dismissed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="ideas")
    template = relationship("IdeaTemplate", back_populates="ideas")
    advisor = relationship("Advisor", back_populates="ideas")
