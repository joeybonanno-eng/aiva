from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.meeting import Meeting, TranscriptSegment, MeetingAction
from app.schemas.meeting import (
    CreateMeetingRequest,
    AppendTranscriptRequest,
    UpdateActionRequest,
    MeetingResponse,
    MeetingListResponse,
)
from app.services.meeting_service import process_meeting_ai

router = APIRouter(prefix="/api/meetings", tags=["meetings"])


def _get_meeting(meeting_id: int, advisor: Advisor, db: Session) -> Meeting:
    meeting = (
        db.query(Meeting)
        .options(
            joinedload(Meeting.client),
            joinedload(Meeting.transcript_segments),
            joinedload(Meeting.action_items),
        )
        .filter(Meeting.id == meeting_id, Meeting.advisor_id == advisor.id)
        .first()
    )
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    return meeting


@router.post("/", response_model=MeetingResponse)
def create_meeting(
    request: CreateMeetingRequest,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    meeting = Meeting(
        advisor_id=advisor.id,
        client_id=request.client_id,
        title=request.title,
        meeting_type=request.meeting_type,
        status="scheduled",
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return _get_meeting(meeting.id, advisor, db)


@router.get("/", response_model=MeetingListResponse)
def list_meetings(
    status: str = Query(None),
    client_id: int = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    query = (
        db.query(Meeting)
        .options(joinedload(Meeting.client), joinedload(Meeting.action_items))
        .filter(Meeting.advisor_id == advisor.id)
    )

    if status:
        query = query.filter(Meeting.status == status)
    if client_id:
        query = query.filter(Meeting.client_id == client_id)

    total = query.count()
    meetings = query.order_by(Meeting.created_at.desc()).offset(offset).limit(limit).all()

    return MeetingListResponse(
        items=[MeetingResponse.model_validate(m) for m in meetings],
        total=total,
    )


@router.get("/{meeting_id}", response_model=MeetingResponse)
def get_meeting(
    meeting_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    return _get_meeting(meeting_id, advisor, db)


@router.post("/{meeting_id}/start", response_model=MeetingResponse)
def start_recording(
    meeting_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, advisor, db)
    meeting.status = "recording"
    meeting.started_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return _get_meeting(meeting_id, advisor, db)


@router.post("/{meeting_id}/stop", response_model=MeetingResponse)
def stop_recording(
    meeting_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, advisor, db)
    meeting.status = "processing"
    meeting.ended_at = datetime.utcnow()
    db.commit()
    db.refresh(meeting)
    return _get_meeting(meeting_id, advisor, db)


@router.post("/{meeting_id}/transcript", response_model=MeetingResponse)
def append_transcript(
    meeting_id: int,
    request: AppendTranscriptRequest,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, advisor, db)

    for seg in request.segments:
        # Parse timestamp — accept ISO strings or numeric values
        ts = 0.0
        try:
            ts = float(seg.timestamp)
        except (ValueError, TypeError):
            # If it's an ISO string, convert to epoch seconds
            try:
                from datetime import datetime as dt
                parsed = dt.fromisoformat(seg.timestamp.replace("Z", "+00:00"))
                ts = parsed.timestamp()
            except (ValueError, TypeError):
                ts = 0.0

        segment = TranscriptSegment(
            meeting_id=meeting.id,
            speaker=seg.speaker,
            text=seg.text,
            timestamp=ts,
            confidence=seg.confidence,
        )
        db.add(segment)

    db.commit()
    return _get_meeting(meeting_id, advisor, db)


@router.post("/{meeting_id}/process", response_model=MeetingResponse)
async def process_meeting(
    meeting_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, advisor, db)

    if not meeting.transcript_segments:
        raise HTTPException(status_code=400, detail="No transcript segments to process")

    await process_meeting_ai(meeting, advisor, db)

    meeting.status = "completed"
    db.commit()

    return _get_meeting(meeting_id, advisor, db)


@router.put("/{meeting_id}/actions/{action_id}", response_model=MeetingResponse)
def update_action(
    meeting_id: int,
    action_id: int,
    request: UpdateActionRequest,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    meeting = _get_meeting(meeting_id, advisor, db)

    action = db.query(MeetingAction).filter(
        MeetingAction.id == action_id,
        MeetingAction.meeting_id == meeting.id,
    ).first()

    if not action:
        raise HTTPException(status_code=404, detail="Action not found")

    if request.status:
        action.status = request.status
    if request.description:
        action.description = request.description
    if request.due_date:
        from datetime import date as date_type
        action.due_date = date_type.fromisoformat(request.due_date)

    db.commit()
    return _get_meeting(meeting_id, advisor, db)
