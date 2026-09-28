"""
SIH26018 — AI-Powered Land Record Digitization, Validation & GIS Intelligence Platform
FastAPI Backend Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.config import settings
from app.database.database import engine, Base
from app.api.routes import auth, documents, review, land_records, dashboard, gis, notifications, citizen
import os

# Create all tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="SIH26018 Land Records Intelligence Platform",
    description="AI-Powered Land Record Digitization, Validation & GIS Intelligence Platform",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL, "http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api")
app.include_router(documents.router, prefix="/api")
app.include_router(review.router, prefix="/api")
app.include_router(land_records.router, prefix="/api")
app.include_router(dashboard.router, prefix="/api")
app.include_router(gis.router, prefix="/api")
app.include_router(notifications.router, prefix="/api")
app.include_router(citizen.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    """Seed demo data on startup"""
    from app.database.database import SessionLocal
    from app.services.seed_data import seed_database
    db = SessionLocal()
    try:
        seed_database(db)
    finally:
        db.close()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    os.makedirs(settings.PROCESSED_DIR, exist_ok=True)

@app.get("/api/health")
def health_check():
    return {"status": "healthy", "platform": "SIH26018", "version": "2.0.0", "demo_mode": settings.DEMO_MODE}

@app.get("/api")
def root():
    return {
        "platform": "SIH26018 Land Records Intelligence Platform",
        "version": "2.0.0",
        "docs": "/api/docs",
        "status": "operational"
    }

from fastapi.responses import RedirectResponse
import logging

logger = logging.getLogger("uvicorn.error")

@app.get("/docs", include_in_schema=False)
def redirect_docs():
    return RedirectResponse(url="/api/docs")

# Global error handler
@app.exception_handler(Exception)
async def global_error_handler(request, exc):
    logger.error(f"Unhandled exception on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": "INTERNAL_SERVER_ERROR",
                 "message": "An unexpected error occurred. Please try again."}
    )