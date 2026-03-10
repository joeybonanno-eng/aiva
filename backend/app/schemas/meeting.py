from datetime import datetime, date
from typing import Optional
from pydantic import BaseModel


class CreateMeetingRequest(BaseModel):
    client_id: Optional[int] = None
    title: str
    meeting_type: str = "check_in"
    started_at: Optional[str] = None


class TranscriptSegmentRequest(BaseModel):
    speaker: str = "Advisor"
    text: str
    timestamp: str = "0"
    confidence: float = 1.0


class AppendTranscriptRequest(BaseModel):
    segments: list[TranscriptSegmentRequest]


class UpdateActionRequest(BaseModel):
    status: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[str] = None


class TranscriptSegmentResponse(BaseModel):
    id: int
    meeting_id: int
    speaker: str
    text: str
    timestamp: float
    confidence: float
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingActionResponse(BaseModel):
    id: int
    meeting_id: int
    description: str
    assignee: str
    priority: str
    due_date: Optional[date] = None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientBrief(BaseModel):
    id: int
    first_name: str
    last_name: str
    company: Optional[str] = None

    model_config = {"from_attributes": True}


class MeetingResponse(BaseModel):
    id: int
    advisor_id: int
    client_id: Optional[int] = None
    client: Optional[ClientBrief] = None
    title: str
    meeting_type: str
    status: str
    started_at: Optional[datetime] = None
    ended_at: Optional[datetime] = None
    summary: Optional[str] = None
    follow_up_draft: Optional[str] = None
    transcript_segments: list[TranscriptSegmentResponse] = []
    action_items: list[MeetingActionResponse] = []
    created_at: datetime

    model_config = {"from_attributes": True}


class MeetingListResponse(BaseModel):
    items: list[MeetingResponse]
    total: int
