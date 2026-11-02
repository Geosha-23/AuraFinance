import os
# pyrefly: ignore[missing-import]
from fastapi import FastAPI
# pyrefly: ignore[missing-import]
from fastapi.middleware.cors import CORSMiddleware
from backend.app.config import settings
from backend.app.database import init_db
from backend.app.routers import auth, transactions, budgets, analytics, ml

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="AI-Powered Personal Finance & Expense Anomaly Detector API. Uses NLP for classification, Isolation Forest for anomaly detection, and Time-Series Ridge models for expense forecasting."
)

# Configure CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all origins in development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    print(f"Starting {settings.PROJECT_NAME} v{settings.VERSION}...")
    await init_db()

# Include API routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(transactions.router, prefix=settings.API_PREFIX)
app.include_router(budgets.router, prefix=settings.API_PREFIX)
app.include_router(analytics.router, prefix=settings.API_PREFIX)
app.include_router(ml.router, prefix=settings.API_PREFIX)

@app.get("/")
async def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "docs_url": "/docs",
        "status": "online"
    }

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": os.getenv("CURRENT_TIME", "2026-10-16"),
        "models": {
            "categorizer": "TF-IDF + SGDClassifier (Online Active Learning)",
            "anomaly_detector": "Isolation Forest + Heuristic Duplicate Engine",
            "forecaster": "Time-Series Cumulative Velocity + Ridge Regression"
        }
    }
