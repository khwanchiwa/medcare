import logging
from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.config import settings
app = FastAPI(
    title=settings.app_name,
    version="0.1.0",
    # Never expose exception tracebacks over HTTP; DEBUG still controls application logging.
    debug=False,
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.frontend_origins,
    allow_origin_regex=settings.frontend_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(api_router, prefix=settings.api_v1_prefix)


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    request_id = request.headers.get("x-request-id") or str(uuid4())
    logging.getLogger(__name__).exception(
        "Unhandled API error request_id=%s method=%s path=%s",
        request_id,
        request.method,
        request.url.path,
        exc_info=exc,
    )
    response_headers = {"x-request-id": request_id}
    origin = request.headers.get("origin")
    if origin and origin in settings.frontend_origins:
        # ServerErrorMiddleware is outside CORSMiddleware, so safe 500 responses
        # need the already-validated exact origin added here as well.
        response_headers["access-control-allow-origin"] = origin
        response_headers["access-control-allow-credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "request_id": request_id},
        headers=response_headers,
    )


@app.get("/health", tags=["System"])
def health_check() -> dict[str, str]:
    return {"status": "ok", "service": settings.app_name}
