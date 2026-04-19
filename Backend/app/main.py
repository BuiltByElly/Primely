from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# from fastapi_offline import FastAPIOffline
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
app = FastAPI(lifespan=lifespan, title="URL Shortner")

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
