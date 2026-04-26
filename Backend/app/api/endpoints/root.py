from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from slowapi import Limiter
from slowapi.util import get_remote_address
from sqlmodel import select
from starlette.status import HTTP_401_UNAUTHORIZED

from app.api.dependencies import SessionDeps
from app.models.models import Users
from app.schemas.schemas import UserResponse
from app.services.authentication import get_current_user

root_router = APIRouter(tags=["User"])
limiter = Limiter(key_func=get_remote_address)


@root_router.get("/me", response_model=UserResponse)
@limiter.limit("30/minute")
async def me(
    current_user_public_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
    request: Request,
):
    """Get current user information"""
    current_user = session.exec(
        select(Users).where(Users.public_id == UUID(current_user_public_id))
    ).first()

    if not current_user:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="User not found")

    return {
        "public_id": current_user_public_id,
        "username": current_user.username,
        "email": current_user.email,
    }
