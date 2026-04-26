from contextlib import asynccontextmanager
from typing import cast

from apscheduler.triggers.cron import CronTrigger
from apscheduler.triggers.interval import IntervalTrigger
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
from app.core.schedular import scheduler
from app.tasks.cleanup_tokens_task import cleanup_tokens_task
from app.tasks.expire_links_task import expire_links_task
from app.tasks.scan_links_task import scan_links_task


# initialize db on server startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(scan_links_task, IntervalTrigger(seconds=10))
    scheduler.add_job(expire_links_task, IntervalTrigger(hours=1))
    scheduler.add_job(cleanup_tokens_task, CronTrigger(hour=3, minute=0))
    scheduler.start()
    init_db()
    scheduler.shutdown()
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
