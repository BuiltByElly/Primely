from fastapi import Depends, HTTPException, Request
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlmodel import Session, select
from starlette.status import HTTP_400_BAD_REQUEST

from app.core.config import settings
from app.core.logging import logger
from app.core.security import decode_token, hash_password, verify_password
from app.models.models import Users

security = HTTPBearer()


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db

    def authenticate_user(self, username: str, password: str):
        user = self.db.exec(select(Users).where(Users.username == username)).first()
        if not user:
            hash_password(settings.DUMMY_PASSWORD)
            return None
        if not verify_password(password, user.password):
            return None
        return user

    def validate_user_credentials(self, username: str, password: str):
        """
        Validates user's credentials before committing them to the db
        username should have characters less than 25 and not an empty string,
        password should not be empty
        """
        if len(username) > 25 or len(username) == "":
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Username is more than 25 characters or is an empty string",
            )
        if password == "":
            raise HTTPException(
                status_code=HTTP_400_BAD_REQUEST,
                detail="Password is an empty string",
            )
        return True

    def signin_user(self, username: str, password: str):
        hashed_password = hash_password(password)
        new_user = Users(username=username, password=hashed_password)
        self.db.add(new_user)
        self.db.commit()
        self.db.refresh(new_user)
        return new_user


def get_current_user(
    request: Request, credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    if not token:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST, detail="No access token found"
        )
    payload = decode_token(token)
    user_id = payload["sub"]

    logger.info(
        f"User Action: {user_id} requested {request.url}, method {request.method}"
    )

    return user_id
