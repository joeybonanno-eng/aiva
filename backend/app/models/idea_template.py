from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base

class IdeaTemplate(Base):
    __tablename__ = "idea_templates"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    trigger_type: Mapped[str] = mapped_column(String, nullable=False)  # portfolio_downgrade/concentrated_position/life_event_approaching/call_cycle_overdue/market_event/portfolio_drift/behavioral_signal
    category: Mapped[str] = mapped_column(String, nullable=False)  # portfolio/client/compliance/opportunity
    subject_template: Mapped[str] = mapped_column(String, nullable=False)
    body_template: Mapped[str] = mapped_column(Text, nullable=False)
    default_channel: Mapped[str] = mapped_column(String, default="email")
    default_priority: Mapped[int] = mapped_column(Integer, default=50)  # 0-100
    is_active: Mapped[bool] = mapped_column(Integer, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    ideas = relationship("ClientIdea", back_populates="template")
