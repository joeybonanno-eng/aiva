from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.dependencies import get_current_advisor
from app.models.advisor import Advisor
from app.schemas.auth import RegisterRequest, LoginRequest, TokenResponse, AdvisorResponse
from app.services.auth_service import (
    get_advisor_by_email,
    create_advisor,
    authenticate_advisor,
    create_access_token,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=TokenResponse)
def register(request: RegisterRequest, db: Session = Depends(get_db)):
    existing = get_advisor_by_email(db, request.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    advisor = create_advisor(db, request.email, request.password, request.full_name)
    token = create_access_token({"sub": str(advisor.id)})
    return TokenResponse(access_token=token)


@router.post("/login", response_model=TokenResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    advisor = authenticate_advisor(db, request.email, request.password)
    if not advisor:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_access_token({"sub": str(advisor.id)})
    return TokenResponse(access_token=token)


@router.get("/me", response_model=AdvisorResponse)
def get_me(advisor: Advisor = Depends(get_current_advisor)):
    return advisor
