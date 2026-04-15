import re
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select
from starlette.status import HTTP_400_BAD_REQUEST, HTTP_401_UNAUTHORIZED

from app.core.config import settings
from app.core.security import decode_token, hash_password, hash_token, verify_password
from app.models.models import RefreshTokens, Users

security = HTTPBearer()


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def authenticate_user(self, username: str, password: str, email: str):
        user = self.db.exec(select(Users).where(Users.username == username)).first()
        if not user:
            hash_password(settings.DUMMY_PASSWORD)
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def validate_user_credentials(self, username: str, password: str, email: str):
        if len(username) > 25 or len(username) == "":
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Username is more than 25 characters or is an empty string",
            )
        if password.strip() == "":
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Password is an empty string",
            )

        if self.db.exec(select(Users).where(Users.email == email)).first():
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="email is not available",
            )

        if not re.match("^[a-zA-Z0>9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email):
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Not an email",
            )
        return True

    def signin_user(self, username: str, password: str, email: str):
        hashed_password = hash_password(password)
        new_user = Users(username=username, password=hashed_password, email=email)
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    def write_refresh_token_to_db(self, refresh_token: str, user: Users):
        token_hash = hash_token(refresh_token)
        new_token = RefreshTokens(
            token_hash=token_hash,
            user_id=user.id or 0,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc)
            + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        self.db.add(new_token)
        self.db.commit()


def get_current_user(
    request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST, detail="No access token found"
        )
    payload = decode_token(token)
    user_public_id = payload["sub"]

    request.state.__setattr__("public_id", user_public_id)

    return user_public_id
