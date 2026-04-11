from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi_offline import FastAPIOffline

from app.api.api import api_router
from app.core.database import init_db
from app.core.logging import logger
from app.core.middleware import ReqAndResLoggingMiddleware


# initialize db on server startup
@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    yield


# main app
app = FastAPIOffline(lifespan=lifespan, title="URL Shortner")
app.add_middleware(ReqAndResLoggingMiddleware)

logger.info("Startup: DB and server up and running")

app.include_router(api_router)
