from typing import Annotated

from fastapi import APIRouter, Depends
from sqlmodel import select

from app.api.dependencies import SessionDeps
from app.models.models import Users
from app.services.authentication import get_current_user

root_router = APIRouter(tags=["User"])


@root_router.get("/")
async def me(
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
):
    current_user = session.exec(
        select(Users).where(Users.public_id == current_user_id)
    ).first()

    return current_user
