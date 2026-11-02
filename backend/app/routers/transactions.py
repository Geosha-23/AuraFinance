import uuid
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
try:
    from app.auth import get_current_user
    from app.database import get_transactions_collection, get_budgets_collection
    from app.models import (
        TransactionCreate, TransactionUpdate, TransactionResponse,
        CategorizationRequest, CategorizationResponse, CSVImportResult
    )
    from app.ml.categorizer import categorizer
    from app.ml.anomaly_detector import anomaly_detector
    from app.ml.seed_data import generate_student_demo_data
    from app.utils.csv_parser import parse_transaction_csv
except ImportError:
    from backend.app.auth import get_current_user
    from backend.app.database import get_transactions_collection, get_budgets_collection
    from backend.app.models import (
        TransactionCreate, TransactionUpdate, TransactionResponse,
        CategorizationRequest, CategorizationResponse, CSVImportResult
    )
    from backend.app.ml.categorizer import categorizer
    from backend.app.ml.anomaly_detector import anomaly_detector
    from backend.app.ml.seed_data import generate_student_demo_data
    from backend.app.utils.csv_parser import parse_transaction_csv

router = APIRouter(prefix="/transactions", tags=["Transactions"])

@router.get("", response_model=List[TransactionResponse])
async def get_transactions(
    month: Optional[str] = None, # YYYY-MM
    category: Optional[str] = None,
    only_anomalies: bool = False,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    query = {"user_id": user_id}
    if category and category != "All":
        query["category"] = category
    if only_anomalies:
        query["is_anomaly"] = True

    tx_col = get_transactions_collection()
    cursor = tx_col.find(query).sort("date", -1)
    docs = await cursor.to_list(length=1000)

    results = []
    for d in docs:
        tx_date = d.get("date", "")
        if month and not tx_date.startswith(month):
            continue
        results.append(
            TransactionResponse(
                id=str(d.get("_id") or d.get("id")),
                user_id=user_id,
                date=tx_date,
                description=d.get("description", ""),
                amount=float(d.get("amount", 0.0)),
                category=d.get("category", "Other & Miscellaneous"),
                merchant=d.get("merchant"),
                payment_method=d.get("payment_method", "UPI"),
                notes=d.get("notes"),
                is_anomaly=bool(d.get("is_anomaly", False)),
                anomaly_score=float(d.get("anomaly_score", 0.0)),
                anomaly_reason=d.get("anomaly_reason"),
                is_duplicate=bool(d.get("is_duplicate", False)),
                created_at=str(d.get("created_at", ""))
            )
        )
    return results

@router.post("", response_model=TransactionResponse)
async def create_transaction(
    tx_in: TransactionCreate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    tx_col = get_transactions_collection()

    # Automatic ML categorization if category is missing
    cat = tx_in.category
    if not cat or cat.strip() == "":
        pred = categorizer.predict(tx_in.description, tx_in.amount)
        cat = pred["category"]

    # Retrieve recent transactions for anomaly & duplicate evaluation
    history_docs = await tx_col.find({"user_id": user_id}).to_list(length=200)

    temp_tx = {
        "date": tx_in.date,
        "description": tx_in.description,
        "amount": tx_in.amount,
        "category": cat,
        "merchant": tx_in.merchant
    }
    eval_res = anomaly_detector.evaluate_transaction(temp_tx, history_docs)

    tx_id = str(uuid.uuid4())
    now_str = datetime.utcnow().isoformat()
    doc = {
        "_id": tx_id,
        "id": tx_id,
        "user_id": user_id,
        "date": tx_in.date,
        "description": tx_in.description,
        "amount": tx_in.amount,
        "category": cat,
        "merchant": tx_in.merchant,
        "payment_method": tx_in.payment_method or "UPI",
        "notes": tx_in.notes,
        "is_anomaly": eval_res["is_anomaly"],
        "anomaly_score": eval_res["anomaly_score"],
        "anomaly_reason": eval_res["anomaly_reason"],
        "is_duplicate": eval_res["is_duplicate"],
        "created_at": now_str
    }
    await tx_col.insert_one(doc)

    return TransactionResponse(
        id=tx_id,
        user_id=user_id,
        date=doc["date"],
        description=doc["description"],
        amount=doc["amount"],
        category=doc["category"],
        merchant=doc["merchant"],
        payment_method=doc["payment_method"],
        notes=doc["notes"],
        is_anomaly=doc["is_anomaly"],
        anomaly_score=doc["anomaly_score"],
        anomaly_reason=doc["anomaly_reason"],
        is_duplicate=doc["is_duplicate"],
        created_at=doc["created_at"]
    )

@router.put("/{tx_id}", response_model=TransactionResponse)
async def update_transaction(
    tx_id: str,
    update_data: TransactionUpdate,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    tx_col = get_transactions_collection()
    existing = await tx_col.find_one({"_id": tx_id, "user_id": user_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Transaction not found.")

    set_fields = {}
    if update_data.date is not None: set_fields["date"] = update_data.date
    if update_data.description is not None: set_fields["description"] = update_data.description
    if update_data.amount is not None: set_fields["amount"] = update_data.amount
    if update_data.merchant is not None: set_fields["merchant"] = update_data.merchant
    if update_data.payment_method is not None: set_fields["payment_method"] = update_data.payment_method
    if update_data.notes is not None: set_fields["notes"] = update_data.notes

    if update_data.category is not None:
        set_fields["category"] = update_data.category
        # Incremental active learning: teach the ML model the user's manual correction
        desc_to_learn = update_data.description or existing.get("description", "")
        categorizer.learn_incremental(desc_to_learn, update_data.category)

    if set_fields:
        await tx_col.update_one({"_id": tx_id, "user_id": user_id}, {"$set": set_fields})
        existing.update(set_fields)

    return TransactionResponse(
        id=str(existing.get("_id") or existing.get("id")),
        user_id=user_id,
        date=existing["date"],
        description=existing["description"],
        amount=float(existing["amount"]),
        category=existing["category"],
        merchant=existing.get("merchant"),
        payment_method=existing.get("payment_method", "UPI"),
        notes=existing.get("notes"),
        is_anomaly=bool(existing.get("is_anomaly", False)),
        anomaly_score=float(existing.get("anomaly_score", 0.0)),
        anomaly_reason=existing.get("anomaly_reason"),
        is_duplicate=bool(existing.get("is_duplicate", False)),
        created_at=str(existing.get("created_at", ""))
    )

@router.delete("/{tx_id}")
async def delete_transaction(
    tx_id: str,
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    tx_col = get_transactions_collection()
    res = await tx_col.delete_one({"_id": tx_id, "user_id": user_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Transaction not found.")
    return {"message": "Transaction deleted successfully"}

@router.post("/import-csv", response_model=CSVImportResult)
async def import_csv_statement(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    content = await file.read()
    try:
        csv_str = content.decode("utf-8")
    except UnicodeDecodeError:
        csv_str = content.decode("latin-1")

    parsed_txs = parse_transaction_csv(csv_str, user_id)
    if not parsed_txs:
        raise HTTPException(status_code=400, detail="No valid transactions could be parsed from the uploaded CSV.")

    tx_col = get_transactions_collection()
    existing_txs = await tx_col.find({"user_id": user_id}).to_list(length=500)
    
    # Run batch anomaly detection
    all_context = existing_txs + parsed_txs
    evaluated_txs = anomaly_detector.batch_evaluate(all_context)[len(existing_txs):]

    final_tx_docs = []
    category_counts = {}
    anomalies_count = 0
    duplicates_count = 0

    for tx in evaluated_txs:
        tx_id = str(uuid.uuid4())
        cat = tx.get("category", "Other & Miscellaneous")
        category_counts[cat] = category_counts.get(cat, 0) + 1
        
        is_anom = bool(tx.get("is_anomaly", False))
        is_dup = bool(tx.get("is_duplicate", False))
        if is_anom: anomalies_count += 1
        if is_dup: duplicates_count += 1

        doc = {
            "_id": tx_id,
            "id": tx_id,
            "user_id": user_id,
            "date": tx.get("date"),
            "description": tx.get("description"),
            "amount": float(tx.get("amount", 0.0)),
            "category": cat,
            "merchant": tx.get("merchant"),
            "payment_method": tx.get("payment_method", "UPI"),
            "notes": tx.get("notes", "CSV Import"),
            "is_anomaly": is_anom,
            "anomaly_score": float(tx.get("anomaly_score", 0.0)),
            "anomaly_reason": tx.get("anomaly_reason"),
            "is_duplicate": is_dup,
            "created_at": datetime.utcnow().isoformat()
        }
        final_tx_docs.append(doc)

    if final_tx_docs:
        await tx_col.insert_many(final_tx_docs)

    response_items = [
        TransactionResponse(
            id=d["id"],
            user_id=user_id,
            date=d["date"],
            description=d["description"],
            amount=d["amount"],
            category=d["category"],
            merchant=d["merchant"],
            payment_method=d["payment_method"],
            notes=d["notes"],
            is_anomaly=d["is_anomaly"],
            anomaly_score=d["anomaly_score"],
            anomaly_reason=d["anomaly_reason"],
            is_duplicate=d["is_duplicate"],
            created_at=d["created_at"]
        ) for d in final_tx_docs
    ]

    return CSVImportResult(
        imported_count=len(final_tx_docs),
        anomalies_detected=anomalies_count,
        duplicates_found=duplicates_count,
        categories_assigned=category_counts,
        transactions=response_items
    )

@router.post("/seed-demo")
async def seed_demo_transactions(
    current_user: dict = Depends(get_current_user)
):
    user_id = str(current_user["_id"])
    tx_col = get_transactions_collection()
    budgets_col = get_budgets_collection()

    # Clear existing transactions and budgets for this user
    await tx_col.delete_many({"user_id": user_id})
    await budgets_col.delete_many({"user_id": user_id})

    # Generate demo transactions
    demo_pack = generate_student_demo_data(user_id)
    raw_txs = demo_pack["transactions"]

    # Evaluate anomalies and duplicates on the batch
    evaluated = anomaly_detector.batch_evaluate(raw_txs)
    
    # Insert transactions and budgets
    await tx_col.insert_many(evaluated)
    for b in demo_pack["budgets"]:
        b["_id"] = b["id"]
    await budgets_col.insert_many(demo_pack["budgets"])

    return {
        "message": "Demo college student data successfully seeded!",
        "transactions_count": len(evaluated),
        "budgets_count": len(demo_pack["budgets"])
    }

@router.post("/categorize-preview", response_model=CategorizationResponse)
async def categorize_preview(req: CategorizationRequest):
    pred = categorizer.predict(req.description, req.amount)
    return CategorizationResponse(
        category=pred["category"],
        confidence=pred["confidence"],
        alternative_categories=pred["alternative_categories"]
    )
