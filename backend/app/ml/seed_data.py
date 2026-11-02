import uuid
from datetime import datetime, timedelta
from typing import List, Dict, Any

def generate_student_demo_data(user_id: str) -> Dict[str, Any]:
    """
    Generates realistic personal finance transactions tailored for a college student,
    including representative typical expenses, intentional duplicates, and statistical anomalies.
    """
    now = datetime.now()
    year = now.year
    month = now.month

    # Generate dates spanning the current month
    def date_on_day(day_num: int) -> str:
        d = max(1, min(day_num, now.day if year == now.year and month == now.month else 28))
        return f"{year:04d}-{month:02d}-{d:02d}"

    raw_txs = [
        # Normal food & dining
        {"day": 1, "desc": "Campus Canteen lunch and samosa", "amount": 120.0, "cat": "Food & Dining", "merchant": "College Canteen", "method": "UPI"},
        {"day": 2, "desc": "Metro Smart Card Recharge", "amount": 300.0, "cat": "Travel & Commute", "merchant": "Delhi Metro / DMRC", "method": "Card"},
        {"day": 2, "desc": "Zomato dinner biryani with roommates", "amount": 380.0, "cat": "Food & Dining", "merchant": "Zomato", "method": "UPI"},
        {"day": 3, "desc": "Airtel 5G Monthly Unlimited Mobile Recharge", "amount": 299.0, "cat": "Utilities & Bills", "merchant": "Airtel", "method": "UPI"},
        {"day": 4, "desc": "Blinkit quick snacks milk and bread", "amount": 240.0, "cat": "Groceries & Essentials", "merchant": "Blinkit", "method": "UPI"},
        {"day": 5, "desc": "Uber cab ride to railway station", "amount": 195.0, "cat": "Travel & Commute", "merchant": "Uber", "method": "UPI"},
        {"day": 6, "desc": "College Library late fine & notebook photocopy", "amount": 85.0, "cat": "Education & Books", "merchant": "Campus Xerox Shop", "method": "Cash"},
        {"day": 6, "desc": "Swiggy cold coffee and sandwich", "amount": 160.0, "cat": "Food & Dining", "merchant": "Swiggy", "method": "UPI"},
        {"day": 7, "desc": "Engineering Textbook - Data Structures and Algorithms", "amount": 620.0, "cat": "Education & Books", "merchant": "Student Book Depot", "method": "UPI"},
        {"day": 8, "desc": "Spotify Student Premium Monthly Plan", "amount": 59.0, "cat": "Subscriptions & Streaming", "merchant": "Spotify", "method": "Card"},
        
        # --- INTENTIONAL DUPLICATE 1: Accidental Double UPI Debit at Chai Stall ---
        {"day": 8, "desc": "Chai Point snacks and cutting tea", "amount": 180.0, "cat": "Food & Dining", "merchant": "Chai Point", "method": "UPI"},
        {"day": 8, "desc": "Chai Point snacks and cutting tea", "amount": 180.0, "cat": "Food & Dining", "merchant": "Chai Point", "method": "UPI"}, # Duplicate!

        {"day": 9, "desc": "Amazon wireless mouse for laptop", "amount": 499.0, "cat": "Shopping & E-Commerce", "merchant": "Amazon", "method": "UPI"},
        {"day": 10, "desc": "Rapido bike taxi to computer lab", "amount": 55.0, "cat": "Travel & Commute", "merchant": "Rapido", "method": "UPI"},
        {"day": 11, "desc": "Hostel room wifi broadband share", "amount": 400.0, "cat": "Utilities & Bills", "merchant": "ACT Fibernet", "method": "UPI"},
        {"day": 12, "desc": "PVR Cinemas weekend movie ticket", "amount": 320.0, "cat": "Entertainment & Outings", "merchant": "PVR Cinemas", "method": "UPI"},
        {"day": 13, "desc": "Dominos pizza hostel party night", "amount": 560.0, "cat": "Food & Dining", "merchant": "Dominos Pizza", "method": "UPI"},
        
        # --- INTENTIONAL DUPLICATE 2: Double Subscription Renewal ---
        {"day": 13, "desc": "Netflix Monthly Ultra HD Subscription", "amount": 649.0, "cat": "Subscriptions & Streaming", "merchant": "Netflix India", "method": "Card"},
        {"day": 14, "desc": "Netflix Monthly Ultra HD Subscription", "amount": 649.0, "cat": "Subscriptions & Streaming", "merchant": "Netflix India", "method": "Card"}, # Duplicate!

        {"day": 14, "desc": "Apollo Pharmacy cough syrup and paracetamol", "amount": 175.0, "cat": "Healthcare & Fitness", "merchant": "Apollo Pharmacy", "method": "UPI"},
        {"day": 15, "desc": "Zepto instant maggi and energy drinks", "amount": 210.0, "cat": "Groceries & Essentials", "merchant": "Zepto", "method": "UPI"},

        # --- INTENTIONAL ANOMALY 1: Massive Dining/Clubbing Splurge (Food & Dining normal is ~200, this is 3,800!) ---
        {"day": 15, "desc": "Luxury Rooftop Club Birthday Treat & Dinner Splurge", "amount": 3850.0, "cat": "Food & Dining", "merchant": "Sky Lounge & Bistro", "method": "Card"},

        # --- INTENTIONAL ANOMALY 2: Huge unexpected electronics expense ---
        {"day": 16, "desc": "Apple Store AirPods Pro replacement warranty", "amount": 18900.0, "cat": "Shopping & E-Commerce", "merchant": "Apple Store Online", "method": "Card"},

        {"day": 16, "desc": "Ola cab ride back from clinic", "amount": 140.0, "cat": "Travel & Commute", "merchant": "Ola Cabs", "method": "UPI"},
    ]

    transactions = []
    for item in raw_txs:
        tx_id = str(uuid.uuid4())
        date_str = date_on_day(item["day"])
        transactions.append({
            "_id": tx_id,
            "id": tx_id,
            "user_id": user_id,
            "date": date_str,
            "description": item["desc"],
            "amount": float(item["amount"]),
            "category": item["cat"],
            "merchant": item["merchant"],
            "payment_method": item["method"],
            "notes": "College student expenditure",
            "is_anomaly": False,
            "anomaly_score": 0.0,
            "anomaly_reason": None,
            "is_duplicate": False,
            "created_at": datetime.utcnow().isoformat()
        })

    # Standard default budgets
    target_month_str = f"{year:04d}-{month:02d}"
    default_budgets = [
        {"category": "Food & Dining", "monthly_limit": 4000.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
        {"category": "Travel & Commute", "monthly_limit": 2000.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
        {"category": "Subscriptions & Streaming", "monthly_limit": 1200.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
        {"category": "Shopping & E-Commerce", "monthly_limit": 3000.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
        {"category": "Utilities & Bills", "monthly_limit": 1500.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
        {"category": "Education & Books", "monthly_limit": 1800.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
        {"category": "Entertainment & Outings", "monthly_limit": 1500.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
        {"category": "Groceries & Essentials", "monthly_limit": 2000.0, "user_id": user_id, "month": target_month_str, "id": str(uuid.uuid4())},
    ]

    return {
        "transactions": transactions,
        "budgets": default_budgets
    }
