import io
import csv
import re
from datetime import datetime
from typing import List, Dict, Any, Tuple
try:
    from app.ml.categorizer import categorizer
    from app.ml.anomaly_detector import anomaly_detector
except ImportError:
    from backend.app.ml.categorizer import categorizer
    from backend.app.ml.anomaly_detector import anomaly_detector

def parse_flexible_date(date_str: str) -> str:
    """
    Normalizes varied date formats into standard YYYY-MM-DD.
    """
    date_str = date_str.strip()
    formats = [
        "%Y-%m-%d",
        "%d/%m/%Y",
        "%d-%m-%Y",
        "%m/%d/%Y",
        "%d %b %Y",
        "%d %B %Y",
        "%Y/%m/%d"
    ]
    for fmt in formats:
        try:
            dt = datetime.strptime(date_str, fmt)
            return dt.strftime("%Y-%m-%d")
        except ValueError:
            continue
    # Default to today if unparseable
    return datetime.now().strftime("%Y-%m-%d")

def parse_transaction_csv(csv_content: str, user_id: str) -> List[Dict[str, Any]]:
    """
    Parses arbitrary CSV transaction files, identifying column mappings automatically.
    """
    reader = csv.reader(io.StringIO(csv_content))
    rows = list(reader)
    if not rows:
        return []

    # Detect header row
    header = [h.strip().lower() for h in rows[0]]
    
    date_col = -1
    desc_col = -1
    amt_col = -1
    cat_col = -1
    merchant_col = -1
    method_col = -1

    for idx, col_name in enumerate(header):
        if any(term in col_name for term in ["date", "txn_date", "timestamp", "time"]):
            if date_col == -1: date_col = idx
        elif any(term in col_name for term in ["desc", "narration", "particulars", "remarks", "detail"]):
            if desc_col == -1: desc_col = idx
        elif any(term in col_name for term in ["amount", "amt", "debit", "withdrawal", "spent", "cost"]):
            if amt_col == -1: amt_col = idx
        elif any(term in col_name for term in ["category", "cat", "tag", "expense_type"]):
            if cat_col == -1: cat_col = idx
        elif any(term in col_name for term in ["merchant", "payee", "vendor", "store"]):
            if merchant_col == -1: merchant_col = idx
        elif any(term in col_name for term in ["mode", "method", "channel", "type"]):
            if method_col == -1: method_col = idx

    # Defaults if headers missing
    if date_col == -1: date_col = 0
    if desc_col == -1: desc_col = 1 if len(header) > 1 else 0
    if amt_col == -1: amt_col = 2 if len(header) > 2 else 1

    parsed_txs = []
    for r_idx, row in enumerate(rows[1:], start=1):
        if not row or len(row) <= max(date_col, desc_col, amt_col):
            continue

        raw_date = row[date_col] if date_col < len(row) else ""
        raw_desc = row[desc_col] if desc_col < len(row) else "Expense"
        raw_amt_str = row[amt_col] if amt_col < len(row) else "0"

        # Clean amount string (remove currency symbols, commas, spaces)
        clean_amt_str = re.sub(r"[^\d.-]", "", raw_amt_str)
        try:
            amt = abs(float(clean_amt_str))
        except ValueError:
            continue

        if amt <= 0:
            continue

        std_date = parse_flexible_date(raw_date)
        
        # Category
        cat = ""
        if cat_col != -1 and cat_col < len(row) and row[cat_col].strip():
            cat = row[cat_col].strip()
        
        # If category is empty or generic, use ML Categorizer
        if not cat or cat.lower() in ["uncategorized", "other", "general", "misc"]:
            pred = categorizer.predict(raw_desc, amt)
            cat = pred["category"]

        merchant = None
        if merchant_col != -1 and merchant_col < len(row) and row[merchant_col].strip():
            merchant = row[merchant_col].strip()

        method = "UPI"
        if method_col != -1 and method_col < len(row) and row[method_col].strip():
            method = row[method_col].strip()

        parsed_txs.append({
            "user_id": user_id,
            "date": std_date,
            "description": raw_desc.strip(),
            "amount": amt,
            "category": cat,
            "merchant": merchant,
            "payment_method": method,
            "notes": "Imported via CSV statement",
            "created_at": datetime.utcnow().isoformat()
        })

    return parsed_txs
