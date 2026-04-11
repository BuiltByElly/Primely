from fastapi import APIRouter

from app.api.endpoints.auth import auth_router
from app.api.endpoints.root import root_router

api_router = APIRouter(prefix="/api")


# endpoints
api_router.include_router(auth_router)
api_router.include_router(root_router)
