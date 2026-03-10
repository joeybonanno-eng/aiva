from datetime import datetime, timedelta
from typing import Optional

from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.models.advisor import Advisor

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def decode_access_token(token: str) -> Optional[dict]:
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except JWTError:
        return None


def get_advisor_by_email(db: Session, email: str) -> Optional[Advisor]:
    return db.query(Advisor).filter(Advisor.email == email).first()


def create_advisor(db: Session, email: str, password: str, full_name: str) -> Advisor:
    advisor = Advisor(
        email=email,
        hashed_password=hash_password(password),
        full_name=full_name,
    )
    db.add(advisor)
    db.commit()
    db.refresh(advisor)
    return advisor


def authenticate_advisor(db: Session, email: str, password: str) -> Optional[Advisor]:
    advisor = get_advisor_by_email(db, email)
    if not advisor or not verify_password(password, advisor.hashed_password):
        return None
    return advisor
