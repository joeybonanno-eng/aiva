"""Scoring router — client engagement scoring."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.models.client import Client
from app.models.client_score import ClientScore
from app.schemas.scoring import ClientScoreResponse, ScoreLeaderboardResponse, ScoreLeaderboardEntry
from app.services.scoring_service import calculate_client_score, score_all_clients

router = APIRouter(prefix="/api", tags=["scoring"])


@router.get("/clients/{client_id}/score", response_model=ClientScoreResponse)
def get_client_score(
    client_id: int,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    client = db.query(Client).filter(Client.id == client_id, Client.advisor_id == advisor.id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    score = db.query(ClientScore).filter(ClientScore.client_id == client_id).first()
    if not score:
        score = calculate_client_score(client, db)
        db.commit()

    return ClientScoreResponse(
        client_id=client.id,
        client_name=f"{client.first_name} {client.last_name}",
        engagement_score=score.engagement_score,
        urgency_score=score.urgency_score,
        revenue_score=score.revenue_score,
        risk_score=score.risk_score,
        composite_score=score.composite_score,
        factors=score.factors,
        calculated_at=score.calculated_at,
    )


@router.post("/scoring/refresh")
def refresh_scores(
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    scores = score_all_clients(advisor.id, db)
    return {"success": True, "message": f"Refreshed scores for {len(scores)} clients"}


@router.get("/scoring/leaderboard", response_model=ScoreLeaderboardResponse)
def get_leaderboard(
    limit: int = 20,
    advisor: Advisor = Depends(get_current_advisor),
    db: Session = Depends(get_db),
):
    results = (
        db.query(ClientScore, Client)
        .join(Client, ClientScore.client_id == Client.id)
        .filter(Client.advisor_id == advisor.id)
        .order_by(ClientScore.composite_score.desc())
        .limit(limit)
        .all()
    )

    items = [
        ScoreLeaderboardEntry(
            client_id=client.id,
            client_name=f"{client.first_name} {client.last_name}",
            composite_score=score.composite_score,
            aum=client.aum,
            status=client.status,
        )
        for score, client in results
    ]

    return ScoreLeaderboardResponse(items=items)
