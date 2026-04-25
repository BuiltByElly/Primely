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

    def authenticate_user(self, password: str, email: str):
        """
        Authenticate an existing user.
        Validates password, and that the email matches the one in the database.
        """
        # Always hash a dummy password to prevent timing attacks
        hash_password(settings.DUMMY_PASSWORD)

        user = self.db.exec(select(Users).where(Users.email == email)).first()
        if not user:
            return None
        if not verify_password(password, user.password):
            return None

        return user

    def validate_for_register(self, username: str, password: str, email: str):
        """
        Validate credentials for user sign-up/registration.
        Checks that username, password, and email are valid and email is not already taken.
        """
        if len(username) > 25 or len(username) == 0:
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Username is more than 25 characters or is an empty string",
            )
        if password.strip() == "":
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Password is an empty string",
            )

        if self.db.exec(select(Users).where(Users.email == email)).first():
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Email is not available",
            )

        if not re.match("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email):
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Not an email",
            )
        return True

    def validate_for_login(self, password: str, email: str):
        """
        Validate credentials for user login.
        Checks that username, password, and email are valid format.
        """
        if password.strip() == "":
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Password is an empty string",
            )

        if not re.match("^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$", email):
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED,
                detail="Not an email",
            )
        return True

    def register_user(self, username: str, password: str, email: str):
        """Create a new user account (registration)."""
        hashed_password = hash_password(password)
        new_user = Users(username=username, password=hashed_password, email=email)
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user

    def write_refresh_token_to_db(
        self, refresh_token: str, user: Users, remember_me: bool = False
    ):
        """Store hashed refresh token in the database."""
        token_hash = hash_token(refresh_token)
        new_token = RefreshTokens(
            token_hash=token_hash,
            user_id=user.id or 0,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc)
            + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
                if remember_me
                else settings.REFRESH_TOKEN_EXPIRE_DAY
            ),
        )
        self.db.add(new_token)
        self.db.commit()


def get_current_user(
    request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Extract and validate the current user from access token."""
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="No access token found"
        )
    payload = decode_token(token, token_type="access")
    user_public_id: str = payload["sub"]

    request.state.__setattr__("public_id", user_public_id)

    return user_public_id
