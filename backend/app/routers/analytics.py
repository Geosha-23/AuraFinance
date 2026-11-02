from datetime import datetime
from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Depends
try:
    from app.auth import get_current_user
    from app.database import get_transactions_collection, get_budgets_collection
    from app.models import AlertItem
except ImportError:
    from backend.app.auth import get_current_user
    from backend.app.database import get_transactions_collection, get_budgets_collection
    from backend.app.models import AlertItem

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/overview")
async def get_analytics_overview(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    now = datetime.now()
    if not month:
        month = f"{now.year:04d}-{now.month:02d}"

    tx_col = get_transactions_collection()
    budgets_col = get_budgets_collection()

    all_txs = await tx_col.find({"user_id": user_id}).to_list(length=1000)
    month_txs = [t for t in all_txs if t.get("date", "").startswith(month)]

    user_allowance = float(current_user.get("monthly_allowance", 15000.0))
    budgets = await budgets_col.find({"user_id": user_id, "month": month}).to_list(length=100)
    total_budget = user_allowance if user_allowance > 0 else sum(float(b.get("monthly_limit", 0)) for b in budgets)

    total_spent = sum(float(t.get("amount", 0.0)) for t in month_txs)
    remaining_budget = max(0.0, total_budget - total_spent)
    pct_used = round((total_spent / total_budget * 100.0), 1) if total_budget > 0 else 0.0

    # Days elapsed calculation
    parts = month.split("-")
    yr, mo = int(parts[0]), int(parts[1])
    if yr == now.year and mo == now.month:
        days_elapsed = max(1, now.day)
    else:
        days_elapsed = 30
    burn_rate = round(total_spent / days_elapsed, 2)

    # Anomaly counts
    anomalies_count = sum(1 for t in month_txs if t.get("is_anomaly"))
    duplicates_count = sum(1 for t in month_txs if t.get("is_duplicate"))

    # Category totals
    cat_totals = {}
    for t in month_txs:
        cat = t.get("category", "Other & Miscellaneous")
        cat_totals[cat] = cat_totals.get(cat, 0.0) + float(t.get("amount", 0.0))

    category_summary = [
        {
            "category": cat,
            "amount": round(amt, 2),
            "percentage": round((amt / total_spent * 100.0), 1) if total_spent > 0 else 0.0
        }
        for cat, amt in sorted(cat_totals.items(), key=lambda x: x[1], reverse=True)
    ]

    return {
        "month": month,
        "total_spent": round(total_spent, 2),
        "total_budget": round(total_budget, 2),
        "remaining_budget": round(remaining_budget, 2),
        "percentage_used": pct_used,
        "burn_rate": burn_rate,
        "transaction_count": len(month_txs),
        "anomalies_count": anomalies_count,
        "duplicates_count": duplicates_count,
        "category_summary": category_summary
    }

@router.get("/category-breakdown")
async def get_category_breakdown(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    now = datetime.now()
    if not month:
        month = f"{now.year:04d}-{now.month:02d}"

    tx_col = get_transactions_collection()
    all_txs = await tx_col.find({"user_id": user_id}).to_list(length=1000)
    month_txs = [t for t in all_txs if t.get("date", "").startswith(month)]

    totals = {}
    for t in month_txs:
        cat = t.get("category", "Other & Miscellaneous")
        totals[cat] = totals.get(cat, 0.0) + float(t.get("amount", 0.0))

    data = [
        {"name": cat, "value": round(amt, 2)}
        for cat, amt in sorted(totals.items(), key=lambda x: x[1], reverse=True)
    ]
    return data

@router.get("/daily-trend")
async def get_daily_trend(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    now = datetime.now()
    if not month:
        month = f"{now.year:04d}-{now.month:02d}"

    tx_col = get_transactions_collection()
    all_txs = await tx_col.find({"user_id": user_id}).to_list(length=1000)
    month_txs = [t for t in all_txs if t.get("date", "").startswith(month)]

    daily_map = {}
    for t in month_txs:
        dt = t.get("date", "")
        daily_map[dt] = daily_map.get(dt, 0.0) + float(t.get("amount", 0.0))

    sorted_dates = sorted(daily_map.keys())
    data = [{"date": dt, "amount": round(daily_map[dt], 2)} for dt in sorted_dates]
    return data

@router.get("/alerts")
async def get_budget_alerts(
    month: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    now = datetime.now()
    if not month:
        month = f"{now.year:04d}-{now.month:02d}"

    tx_col = get_transactions_collection()
    budgets_col = get_budgets_collection()

    all_txs = await tx_col.find({"user_id": user_id}).to_list(length=1000)
    month_txs = [t for t in all_txs if t.get("date", "").startswith(month)]
    budgets = await budgets_col.find({"user_id": user_id, "month": month}).to_list(length=100)

    alerts: List[Dict[str, Any]] = []

    # 1. Duplicate transaction alerts
    for t in month_txs:
        if t.get("is_duplicate"):
            alerts.append({
                "id": f"dup-{t.get('id')}",
                "type": "duplicate",
                "title": "Duplicate Charge Detected",
                "message": t.get("anomaly_reason") or f"Duplicate expense of ₹{t.get('amount')} found.",
                "severity": "danger",
                "timestamp": t.get("date", ""),
                "related_id": str(t.get("id"))
            })

    # 2. High severity unusual spending anomalies
    for t in month_txs:
        if t.get("is_anomaly") and not t.get("is_duplicate"):
            score = float(t.get("anomaly_score", 0))
            severity = "danger" if score > 0.85 else "warning"
            alerts.append({
                "id": f"anom-{t.get('id')}",
                "type": "anomaly",
                "title": f"Unusual Transaction: {t.get('category')}",
                "message": t.get("anomaly_reason") or f"Anomalous charge of ₹{t.get('amount'):,.2f} on {t.get('description')}.",
                "severity": severity,
                "timestamp": t.get("date", ""),
                "related_id": str(t.get("id"))
            })

    # 3. Category budget threshold warnings & breaches
    cat_spent = {}
    for t in month_txs:
        c = t.get("category", "Other & Miscellaneous")
        cat_spent[c] = cat_spent.get(c, 0.0) + float(t.get("amount", 0.0))

    for b in budgets:
        cat = b.get("category")
        limit = float(b.get("monthly_limit", 0))
        spent = cat_spent.get(cat, 0.0)
        if limit > 0:
            pct = (spent / limit) * 100.0
            if pct >= 100.0:
                alerts.append({
                    "id": f"bud-exceeded-{cat}",
                    "type": "budget_exceeded",
                    "title": f"{cat} Budget Exceeded!",
                    "message": f"You have spent ₹{spent:,.2f} exceeding your ₹{limit:,.2f} budget ({pct:.1f}%).",
                    "severity": "danger",
                    "timestamp": now.strftime("%Y-%m-%d"),
                    "related_id": None
                })
            elif pct >= 80.0:
                alerts.append({
                    "id": f"bud-warn-{cat}",
                    "type": "budget_warning",
                    "title": f"{cat} Budget Approaching Limit",
                    "message": f"You have used {pct:.1f}% of your ₹{limit:,.2f} budget (₹{spent:,.2f} spent).",
                    "severity": "warning",
                    "timestamp": now.strftime("%Y-%m-%d"),
                    "related_id": None
                })

    return alerts
