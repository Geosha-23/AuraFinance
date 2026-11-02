import uuid
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
try:
    from app.auth import get_current_user
    from app.database import get_budgets_collection, get_transactions_collection
    from app.models import BudgetCreate, BudgetResponse
except ImportError:
    from backend.app.auth import get_current_user
    from backend.app.database import get_budgets_collection, get_transactions_collection
    from backend.app.models import BudgetCreate, BudgetResponse

router = APIRouter(prefix="/budgets", tags=["Budgets"])

@router.get("", response_model=List[BudgetResponse])
async def get_budgets(
    month: Optional[str] = None, # YYYY-MM
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    now = datetime.now()
    if not month:
        month = f"{now.year:04d}-{now.month:02d}"

    budgets_col = get_budgets_collection()
    budget_docs = await budgets_col.find({"user_id": user_id, "month": month}).to_list(length=100)

    # Compute actual spend per category for this month
    tx_col = get_transactions_collection()
    tx_docs = await tx_col.find({"user_id": user_id}).to_list(length=1000)

    cat_spent = {}
    for tx in tx_docs:
        d = tx.get("date", "")
        if d.startswith(month):
            c = tx.get("category", "Other & Miscellaneous")
            cat_spent[c] = cat_spent.get(c, 0.0) + float(tx.get("amount", 0.0))

    results = []
    for b in budget_docs:
        cat = b.get("category")
        limit = float(b.get("monthly_limit", 0.0))
        spent = round(cat_spent.get(cat, 0.0), 2)
        remaining = round(max(0.0, limit - spent), 2)
        pct = round((spent / limit) * 100.0, 1) if limit > 0 else 0.0

        b_status = "Normal"
        if pct >= 100.0:
            b_status = "Exceeded"
        elif pct >= 80.0:
            b_status = "Warning"

        results.append(
            BudgetResponse(
                id=str(b.get("_id") or b.get("id")),
                user_id=user_id,
                category=cat,
                monthly_limit=limit,
                spent_amount=spent,
                remaining_amount=remaining,
                percentage_used=pct,
                status=b_status,
                month=month
            )
        )
    return results

@router.post("", response_model=BudgetResponse)
async def create_or_update_budget(
    budget_in: BudgetCreate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    now = datetime.now()
    month = budget_in.month or f"{now.year:04d}-{now.month:02d}"

    budgets_col = get_budgets_collection()
    existing = await budgets_col.find_one({
        "user_id": user_id,
        "category": budget_in.category,
        "month": month
    })

    if existing:
        await budgets_col.update_one(
            {"_id": existing["_id"]},
            {"$set": {"monthly_limit": budget_in.monthly_limit}}
        )
        b_id = str(existing["_id"])
    else:
        b_id = str(uuid.uuid4())
        new_doc = {
            "_id": b_id,
            "id": b_id,
            "user_id": user_id,
            "category": budget_in.category,
            "monthly_limit": budget_in.monthly_limit,
            "month": month,
            "created_at": datetime.utcnow().isoformat()
        }
        await budgets_col.insert_one(new_doc)

    # Calculate current category spent
    tx_col = get_transactions_collection()
    tx_docs = await tx_col.find({"user_id": user_id}).to_list(length=1000)
    spent = sum(
        float(t.get("amount", 0))
        for t in tx_docs
        if t.get("category") == budget_in.category and t.get("date", "").startswith(month)
    )
    spent = round(spent, 2)
    rem = round(max(0.0, budget_in.monthly_limit - spent), 2)
    pct = round((spent / budget_in.monthly_limit) * 100.0, 1) if budget_in.monthly_limit > 0 else 0.0

    b_status = "Normal"
    if pct >= 100.0:
        b_status = "Exceeded"
    elif pct >= 80.0:
        b_status = "Warning"

    return BudgetResponse(
        id=b_id,
        user_id=user_id,
        category=budget_in.category,
        monthly_limit=budget_in.monthly_limit,
        spent_amount=spent,
        remaining_amount=rem,
        percentage_used=pct,
        status=b_status,
        month=month
    )

@router.delete("/{budget_id}")
async def delete_budget(budget_id: str, current_user: dict = Depends(get_current_user)):
    user_id = str(current_user["_id"])
    budgets_col = get_budgets_collection()
    res = await budgets_col.delete_one({"_id": budget_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Budget not found.")
    return {"message": "Budget deleted successfully"}
