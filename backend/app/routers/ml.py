from typing import Optional
from fastapi import APIRouter, Depends
try:
    from app.auth import get_current_user
    from app.database import get_transactions_collection, get_budgets_collection
    from app.models import MonthlyForecastResponse
    from app.ml.forecaster import forecaster
    from app.ml.anomaly_detector import anomaly_detector
except ImportError:
    from backend.app.auth import get_current_user
    from backend.app.database import get_transactions_collection, get_budgets_collection
    from backend.app.models import MonthlyForecastResponse
    from backend.app.ml.forecaster import forecaster
    from backend.app.ml.anomaly_detector import anomaly_detector

router = APIRouter(prefix="/ml", tags=["Machine Learning"])

@router.get("/forecast", response_model=MonthlyForecastResponse)
async def get_monthly_forecast(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    allowance = float(current_user.get("monthly_allowance", 15000.0))

    tx_col = get_transactions_collection()
    budgets_col = get_budgets_collection()

    all_txs = await tx_col.find({"user_id": user_id}).to_list(length=1000)
    budgets = await budgets_col.find({"user_id": user_id}).to_list(length=100)

    forecast_data = forecaster.forecast_monthly(
        transactions=all_txs,
        budgets=budgets,
        monthly_allowance=allowance,
        target_month=month
    )
    return forecast_data

@router.get("/anomalies")
async def get_anomalies(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    tx_col = get_transactions_collection()
    query = {"user_id": user_id, "is_anomaly": True}
    cursor = tx_col.find(query).sort("date", -1)
    docs = await cursor.to_list(length=200)

    results = []
    for d in docs:
        tx_date = d.get("date", "")
        if month and not tx_date.startswith(month):
            continue
        results.append({
            "transaction_id": str(d.get("_id") or d.get("id")),
            "date": tx_date,
            "description": d.get("description", ""),
            "amount": float(d.get("amount", 0.0)),
            "category": d.get("category", "Other & Miscellaneous"),
            "anomaly_reason": d.get("anomaly_reason") or "Flagged by Isolation Forest",
            "anomaly_score": float(d.get("anomaly_score", 0.0)),
            "is_duplicate": bool(d.get("is_duplicate", False)),
            "risk_level": "High" if float(d.get("anomaly_score", 0)) > 0.85 or d.get("is_duplicate") else "Medium"
        })
    return results

@router.post("/re-evaluate")
async def re_evaluate_anomalies(current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    tx_col = get_transactions_collection()
    user_txs = await tx_col.find({"user_id": user_id}).to_list(length=1000)

    evaluated = anomaly_detector.batch_evaluate(user_txs)
    updated_count = 0
    anomalies_found = 0

    for tx in evaluated:
        t_id = tx.get("_id") or tx.get("id")
        is_anom = bool(tx.get("is_anomaly", False))
        if is_anom: anomalies_found += 1
        
        await tx_col.update_one(
            {"_id": t_id},
            {"$set": {
                "is_anomaly": is_anom,
                "anomaly_score": tx.get("anomaly_score", 0.0),
                "anomaly_reason": tx.get("anomaly_reason"),
                "is_duplicate": tx.get("is_duplicate", False)
            }}
        )
        updated_count += 1

    return {
        "message": "Re-evaluated all transactions with Isolation Forest and duplicate detector.",
        "processed_transactions": updated_count,
        "anomalies_detected": anomalies_found
    }
