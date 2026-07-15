from fastapi import APIRouter

from app.api.routes import (
    appointments,
    auth,
    dashboard,
    medications,
    integrations,
    jobs,
    notifications,
    ocr,
    relationships,
    users,
)

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(medications.router, prefix="/medications", tags=["Medications"])
api_router.include_router(appointments.router, prefix="/appointments", tags=["Appointments"])
api_router.include_router(relationships.router, prefix="/relationships", tags=["Care relationships"])
api_router.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
api_router.include_router(integrations.router, prefix="/integrations", tags=["Integrations"])
api_router.include_router(jobs.router, prefix="/jobs", tags=["Scheduled jobs"])
api_router.include_router(ocr.router, prefix="/ocr", tags=["OCR"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])
