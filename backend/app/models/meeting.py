from datetime import datetime, date

from sqlalchemy import Integer, String, Float, Text, DateTime, Date, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Meeting(Base):
    __tablename__ = "meetings"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    advisor_id: Mapped[int] = mapped_column(Integer, ForeignKey("advisors.id"), nullable=False)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=True)
    title: Mapped[str] = mapped_column(String, nullable=False)
    meeting_type: Mapped[str] = mapped_column(String, default="check_in")  # check_in/review/planning/onboarding/ad_hoc
    status: Mapped[str] = mapped_column(String, default="scheduled")  # scheduled/recording/processing/completed
    started_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    ended_at: Mapped[datetime] = mapped_column(DateTime, nullable=True)
    summary: Mapped[str] = mapped_column(Text, nullable=True)
    follow_up_draft: Mapped[str] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    advisor = relationship("Advisor", back_populates="meetings")
    client = relationship("Client", back_populates="meetings")
    transcript_segments = relationship("TranscriptSegment", back_populates="meeting", cascade="all, delete-orphan", order_by="TranscriptSegment.timestamp")
    action_items = relationship("MeetingAction", back_populates="meeting", cascade="all, delete-orphan")


class TranscriptSegment(Base):
    __tablename__ = "transcript_segments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meetings.id"), nullable=False)
    speaker: Mapped[str] = mapped_column(String, default="Advisor")
    text: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[float] = mapped_column(Float, default=0.0)  # seconds from start
    confidence: Mapped[float] = mapped_column(Float, default=1.0)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="transcript_segments")


class MeetingAction(Base):
    __tablename__ = "meeting_actions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    meeting_id: Mapped[int] = mapped_column(Integer, ForeignKey("meetings.id"), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    assignee: Mapped[str] = mapped_column(String, default="Advisor")
    priority: Mapped[str] = mapped_column(String, default="medium")  # high/medium/low
    due_date: Mapped[date] = mapped_column(Date, nullable=True)
    status: Mapped[str] = mapped_column(String, default="pending")  # pending/completed
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    meeting = relationship("Meeting", back_populates="action_items")
