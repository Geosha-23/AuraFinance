# pyrefly: ignore[missing-import]
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# --- Auth Models ---
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., description="Valid email address")
    password: str = Field(..., min_length=6)
    monthly_allowance: Optional[float] = Field(default=15000.0, description="Monthly spending limit/allowance")

class UserLogin(BaseModel):
    email: str
    password: str

class UserProfile(BaseModel):
    id: str
    name: str
    email: str
    monthly_allowance: float
    created_at: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserProfile


# --- Transaction Models ---
class TransactionCreate(BaseModel):
    date: str = Field(..., description="YYYY-MM-DD format")
    description: str = Field(..., min_length=2)
    amount: float = Field(..., gt=0)
    category: Optional[str] = Field(default=None, description="Optional; auto-categorized if empty")
    merchant: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None

class TransactionUpdate(BaseModel):
    date: Optional[str] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    category: Optional[str] = None
    merchant: Optional[str] = None
    payment_method: Optional[str] = None
    notes: Optional[str] = None

class TransactionResponse(BaseModel):
    id: str
    user_id: str
    date: str
    description: str
    amount: float
    category: str
    merchant: Optional[str] = None
    payment_method: Optional[str] = "UPI"
    notes: Optional[str] = None
    is_anomaly: bool = False
    anomaly_score: float = 0.0
    anomaly_reason: Optional[str] = None
    is_duplicate: bool = False
    created_at: str


# --- Categorization Models ---
class CategorizationRequest(BaseModel):
    description: str
    amount: Optional[float] = None

class CategorizationResponse(BaseModel):
    category: str
    confidence: float
    alternative_categories: List[Dict[str, Any]] = []


# --- Budget Models ---
class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float = Field(..., gt=0)
    month: Optional[str] = None # YYYY-MM

class BudgetResponse(BaseModel):
    id: str
    user_id: str
    category: str
    monthly_limit: float
    spent_amount: float = 0.0
    remaining_amount: float = 0.0
    percentage_used: float = 0.0
    status: str = "Normal" # Normal, Warning (>=80%), Exceeded (>=100%)
    month: str


# --- Forecasting & Analytics Models ---
class CategoryForecast(BaseModel):
    category: str
    current_spend: float
    predicted_spend: float
    budget_limit: Optional[float] = None
    will_exceed_budget: bool = False
    projected_overrun: float = 0.0
    status: str = "On Track" # On Track, Warning, Danger

class MonthlyForecastResponse(BaseModel):
    month: str
    days_elapsed: int
    days_in_month: int
    total_spent_so_far: float
    predicted_month_end_spend: float
    monthly_budget_allowance: float
    will_exceed_total_budget: bool
    projected_savings_or_deficit: float
    category_forecasts: List[CategoryForecast]
    ai_recommendations: List[str]
    forecast_trajectory: List[Dict[str, Any]] # daily actual vs projected line


# --- Anomaly Models ---
class AnomalyItem(BaseModel):
    transaction_id: str
    date: str
    description: str
    amount: float
    category: str
    anomaly_reason: str
    anomaly_score: float
    is_duplicate: bool
    risk_level: str # Low, Medium, High


# --- Budget Alert Model ---
class AlertItem(BaseModel):
    id: str
    type: str # budget_warning, budget_exceeded, anomaly, duplicate
    title: str
    message: str
    severity: str # info, warning, danger
    timestamp: str
    related_id: Optional[str] = None


# --- CSV Import ---
class CSVImportResult(BaseModel):
    imported_count: int
    anomalies_detected: int
    duplicates_found: int
    categories_assigned: Dict[str, int]
    transactions: List[TransactionResponse]
