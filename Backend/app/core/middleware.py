from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint

from app.core.logging import logger


class ReqAndResLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:

        # log the request
        ip = request.headers.get("x-forwarded-for") or request.client.host
        logger.info(f"Incoming Request: {request.method} {request.url} by {ip}")

        # process request and get a response
        response = await call_next(request)

        # log the response
        logger.info(
            f"Outgoing Response: {response.status_code} {request.method} {request.url}"
        )
        return response
