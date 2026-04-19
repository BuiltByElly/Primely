from datetime import datetime, timedelta, timezone
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlmodel import select
from starlette.status import (
    HTTP_400_BAD_REQUEST,
    HTTP_401_UNAUTHORIZED,
)

from app.api.dependencies import SessionDeps
from app.core.config import settings
from app.core.logging import logger
from app.core.security import (
    create_access_token,
    create_refresh_token,
    decode_token,
    hash_token,
)
from app.models.models import RefreshTokens
from app.schemas.schemas import LoginSchema, RegisterSchema
from app.services.authentication import AuthService, get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/register")
async def register(
    response: Response,
    form_data: RegisterSchema,
    session: SessionDeps,
    request: Request,
):
    auth_service = AuthService(session)
    if auth_service.validate_for_register(
        form_data.username, form_data.password, form_data.email
    ):
        user = auth_service.register_user(
            form_data.username, form_data.password, form_data.email
        )

        access_token = create_access_token(str(user.public_id))
        refresh_token = create_refresh_token(str(user.public_id))

        # set cookies
        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=settings.is_prod,
            samesite="none" if settings.is_prod else "lax",
            max_age=60
            * 60
            * 24
            * (
                settings.REFRESH_TOKEN_EXPIRE_DAYS
                if form_data.remember_me
                else settings.REFRESH_TOKEN_EXPIRE_DAY
            ),
        )
        # write refresh token to db
        auth_service.write_refresh_token_to_db(refresh_token, user)

        request.state.__setattr__("public_id", str(user.public_id))
        logger.info(f"User Action: user {user.public_id} registered")

        return {
            "success": True,
            "message": "Registered successfully",
            "access_token": access_token,
        }


@auth_router.post("/login")
async def login(
    response: Response, form_data: LoginSchema, session: SessionDeps, request: Request
):
    auth_service = AuthService(session)

    if auth_service.validate_for_login(form_data.password, form_data.email):
        user = auth_service.authenticate_user(form_data.password, form_data.email)
        if not user:
            raise HTTPException(
                status_code=HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
            )
        # create access and refresh token
        access_token = create_access_token(str(user.public_id))
        refresh_token = create_refresh_token(str(user.public_id), form_data.remember_me)

        # set cookies
        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=settings.is_prod,
            samesite="none" if settings.is_prod else "lax",
            max_age=60
            * 60
            * 24
            * (
                settings.REFRESH_TOKEN_EXPIRE_DAYS
                if form_data.remember_me
                else settings.REFRESH_TOKEN_EXPIRE_DAY
            ),
        )

        # write refresh token to db
        auth_service.write_refresh_token_to_db(
            refresh_token, user, form_data.remember_me
        )

        request.state.__setattr__("public_id", str(user.public_id))
        logger.info(f"User Action: user {user.public_id} logged in")

        return {
            "success": True,
            "message": "Logged in successfully",
            "access_token": access_token,
        }


@auth_router.post("/refresh")
async def refresh(
    request: Request,
    response: Response,
    session: SessionDeps,
    remember_me: bool = False,
):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Not authorized")

    # Validate token type and decode
    payload = decode_token(refresh_token, token_type="refresh")
    user_public_id = payload["sub"]
    token_hash = hash_token(refresh_token)

    now = datetime.now()

    # validate refresh token exists in database
    db_refresh_token = session.exec(
        select(RefreshTokens).where(RefreshTokens.token_hash == token_hash)
    ).first()

    if not db_refresh_token:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Not authorized")
    if db_refresh_token.revoked:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="Invalid Refresh Token"
        )
    if db_refresh_token.expires_at < now:
        raise HTTPException(status_code=HTTP_401_UNAUTHORIZED, detail="Token Expired")

    # Revoke old refresh token
    db_refresh_token.revoked = True
    session.add(db_refresh_token)
    session.commit()

    try:
        # generate new refresh and access token
        new_access_token = create_access_token(user_public_id)
        new_refresh_token = create_refresh_token(user_public_id, remember_me)

        # write new refresh token to db
        new_token_hash = hash_token(new_refresh_token)

        new_db_token = RefreshTokens(
            token_hash=new_token_hash,
            user_id=db_refresh_token.user_id,
            created_at=datetime.now(timezone.utc),
            expires_at=datetime.now(timezone.utc)
            + timedelta(
                days=settings.REFRESH_TOKEN_EXPIRE_DAYS
                if remember_me
                else settings.REFRESH_TOKEN_EXPIRE_DAY
            ),
        )

        session.add(new_db_token)
        session.commit()

    except Exception as e:
        session.rollback()
        logger.error(f"Error refreshing token for user {user_public_id}: {str(e)}")
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST, detail="Failed to refresh token"
        )

    # set cookies
    response.set_cookie(
        "refresh_token",
        new_refresh_token,
        httponly=True,
        secure=settings.is_prod,
        samesite="none" if settings.is_prod else "lax",
        max_age=60
        * 60
        * 24
        * (
            settings.REFRESH_TOKEN_EXPIRE_DAYS
            if remember_me
            else settings.REFRESH_TOKEN_EXPIRE_DAY
        ),
    )

    logger.info(f"User Action: user {user_public_id} refreshed token")

    return {
        "success": True,
        "message": "Token refreshed",
        "access_token": new_access_token,
    }


@auth_router.delete("/logout")
async def logout(
    response: Response,
    request: Request,
    current_user_id: Annotated[str, Depends(get_current_user)],
    session: SessionDeps,
):
    refresh_token = request.cookies.get("refresh_token")
    response.delete_cookie(
        "refresh_token",
        secure=settings.is_prod,
        samesite="none" if settings.is_prod else "lax",
    )

    if not refresh_token:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST, detail="Refresh token not found"
        )
    token_hash = hash_token(refresh_token)

    # validate refresh token
    db_refresh_token = session.exec(
        select(RefreshTokens).where(RefreshTokens.token_hash == token_hash)
    ).first()

    if not db_refresh_token:
        raise HTTPException(
            status_code=HTTP_400_BAD_REQUEST, detail="Refresh token not found"
        )
    db_refresh_token.revoked = True

    session.add(db_refresh_token)
    session.commit()

    logger.info(f"User Action: {current_user_id} logged out")
    return {"success": True, "message": "Logged out successfully"}
