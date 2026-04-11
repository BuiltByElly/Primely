from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from starlette.status import HTTP_401_UNAUTHORIZED

from app.api.dependencies import SessionDeps
from app.core.config import settings
from app.core.logging import logger
from app.core.security import create_access_token, create_refresh_token, decode_token
from app.schemas.schemas import LoginSchema
from app.services.authentication import AuthService, get_current_user

auth_router = APIRouter(prefix="/auth", tags=["Authentication"])


@auth_router.post("/signin")
async def signin(response: Response, form_data: LoginSchema, session: SessionDeps):
    auth_service = AuthService(session)
    if auth_service.validate_user_credentials(form_data.username, form_data.password):
        user = auth_service.signin_user(form_data.username, form_data.password)
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        # set cookies

        response.set_cookie(
            "refresh_token",
            refresh_token,
            httponly=True,
            secure=settings.is_prod,
            samesite="none" if settings.is_prod else "lax",
        )
        response.headers["X-Access-Token"] = access_token

        logger.info(f"User Action: user {user.id} signed in")

        return {"success": True, "message": "Signed in"}


@auth_router.post("/login")
async def login(response: Response, form_data: LoginSchema, session: SessionDeps):
    auth_service = AuthService(session)
    user = auth_service.authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="Invalid credentials"
        )
    # create access and refresh token
    access_token = create_access_token(str(user.id))
    refresh_token = create_refresh_token(str(user.id))

    # set cookies
    response.set_cookie(
        "refresh_token",
        refresh_token,
        httponly=True,
        secure=settings.is_prod,
        samesite="none" if settings.is_prod else "lax",
        max_age=60 * 60 * 24 * 6,
    )
    response.headers["X-Access-Token"] = access_token
    logger.info(f"User Action: user {user.id} logged in")

    return {"success": True, "message": "Logged in"}


@auth_router.post("/refresh")
async def refresh(request: Request, response: Response):
    refresh_token = request.cookies.get("refresh_token")
    if not refresh_token:
        raise HTTPException(
            status_code=HTTP_401_UNAUTHORIZED, detail="Refresh token not found"
        )
    payload = decode_token(refresh_token)
    user_id = payload["sub"]

    new_access_token = create_access_token(user_id)

    response.headers["X-Access-Token"] = new_access_token

    logger.info("User Action: user refreshed token")

    return {"success": True, "message": "Token refreshed"}


@auth_router.delete("/logout")
async def logout(
    response: Response, current_user_id: Annotated[str, Depends(get_current_user)]
):
    logger.info(f"User Action: {current_user_id} logged out")
    response.delete_cookie("refresh_token")
    return {"success": True, "message": "Logged out successfully"}
