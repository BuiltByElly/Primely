from contextlib import asynccontextmanager
from typing import cast

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.types import ExceptionHandler

# from fastapi_offline import FastAPIOffline
from app.api.api import api_router, redirect_router
from app.core.database import init_db
from app.core.logging import logger
from app.core.middleware import ReqAndResLoggingMiddleware


# initialize db on server startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


limiter = Limiter(key_func=get_remote_address)  # rate limit by IP
app = FastAPI(lifespan=lifespan, title="Primely")
app.state.limiter = limiter
app.add_exception_handler(
    RateLimitExceeded, cast(ExceptionHandler, _rate_limit_exceeded_handler)
)

# CORS middleware for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(ReqAndResLoggingMiddleware)

logger.info("Startup: DB and server up and running")

# main router
app.include_router(api_router)
app.include_router(redirect_router)
