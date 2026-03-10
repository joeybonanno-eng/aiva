from datetime import datetime

from sqlalchemy import Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CommunicationLog(Base):
    __tablename__ = "communication_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=False)
    advisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("advisors.id"), nullable=False)
    channel: Mapped[str] = mapped_column(String, nullable=False)  # email/phone/meeting/text
    direction: Mapped[str] = mapped_column(String, nullable=False)  # inbound/outbound
    subject: Mapped[str] = mapped_column(String, nullable=True)
    content: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="communications")


class MessageDraft(Base):
    __tablename__ = "message_drafts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("advisors.id"), nullable=False)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=False)
    subject: Mapped[str] = mapped_column(String, nullable=True)
    body: Mapped[str] = mapped_column(Text, nullable=False)
    tone: Mapped[str] = mapped_column(String, default="professional")  # formal/friendly/urgent
    channel: Mapped[str] = mapped_column(String, default="email")  # email/text
    status: Mapped[str] = mapped_column(String, default="draft")  # draft/sent
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
