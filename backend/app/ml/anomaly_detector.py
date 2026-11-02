import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Tuple
from sklearn.ensemble import IsolationForest

CATEGORIES = [
    "Food & Dining",
    "Travel & Commute",
    "Shopping & E-Commerce",
    "Subscriptions & Streaming",
    "Utilities & Bills",
    "Education & Books",
    "Entertainment & Outings",
    "Healthcare & Fitness",
    "Groceries & Essentials",
    "Other & Miscellaneous"
]

CATEGORY_INDEX = {cat: i for i, cat in enumerate(CATEGORIES)}

class ExpenseAnomalyDetector:
    def __init__(self):
        # Isolation Forest instance
        self.clf = IsolationForest(
            n_estimators=100,
            contamination=0.08, # Expect ~8% unusual transactions
            random_state=42
        )
        self._is_fitted = False
        self._seed_reference_baseline()

    def _seed_reference_baseline(self):
        """
        Seeds baseline typical spending patterns for students:
        Normal amounts by category (e.g. food 50-600, shopping 200-2500, etc.)
        """
        np.random.seed(42)
        baseline_samples = []
        for cat_idx, cat in enumerate(CATEGORIES):
            if cat == "Food & Dining":
                amounts = np.random.normal(loc=220, scale=80, size=50)
            elif cat == "Travel & Commute":
                amounts = np.random.normal(loc=120, scale=50, size=40)
            elif cat == "Shopping & E-Commerce":
                amounts = np.random.normal(loc=1200, scale=400, size=30)
            elif cat == "Subscriptions & Streaming":
                amounts = np.random.choice([199, 299, 499, 649, 999], size=30)
            elif cat == "Utilities & Bills":
                amounts = np.random.normal(loc=700, scale=200, size=30)
            elif cat == "Education & Books":
                amounts = np.random.normal(loc=550, scale=150, size=25)
            elif cat == "Entertainment & Outings":
                amounts = np.random.normal(loc=450, scale=180, size=30)
            elif cat == "Groceries & Essentials":
                amounts = np.random.normal(loc=350, scale=120, size=40)
            else:
                amounts = np.random.normal(loc=400, scale=200, size=30)

            for amt in amounts:
                amt = max(20.0, float(amt))
                day = np.random.randint(1, 29)
                dow = np.random.randint(0, 7)
                baseline_samples.append([amt, day, dow, cat_idx])

        X_base = np.array(baseline_samples)
        self.clf.fit(X_base)
        self._is_fitted = True

    def _extract_features(self, tx: Dict[str, Any]) -> List[float]:
        try:
            dt = datetime.strptime(tx.get("date", "2026-10-01"), "%Y-%m-%d")
            day = float(dt.day)
            dow = float(dt.weekday())
        except Exception:
            day = 15.0
            dow = 3.0

        amount = float(tx.get("amount", 0.0))
        cat = tx.get("category", "Other & Miscellaneous")
        cat_idx = float(CATEGORY_INDEX.get(cat, 9))
        return [amount, day, dow, cat_idx]

    def check_duplicate(self, current_tx: Dict[str, Any], historical_txs: List[Dict[str, Any]]) -> Tuple[bool, str]:
        """
        Flags duplicate transactions (same amount and merchant/description within 48 hours).
        """
        curr_id = str(current_tx.get("id") or current_tx.get("_id", ""))
        curr_amt = float(current_tx.get("amount", 0))
        curr_desc = (current_tx.get("description") or "").strip().lower()
        curr_date_str = current_tx.get("date", "")
        
        try:
            curr_date = datetime.strptime(curr_date_str, "%Y-%m-%d")
        except Exception:
            return False, ""

        for tx in historical_txs:
            tx_id = str(tx.get("id") or tx.get("_id", ""))
            if curr_id and tx_id and curr_id == tx_id:
                continue

            tx_amt = float(tx.get("amount", 0))
            tx_desc = (tx.get("description") or "").strip().lower()
            tx_date_str = tx.get("date", "")

            if abs(curr_amt - tx_amt) < 0.01:
                # Same amount, check similarity or substring in description
                desc_match = (curr_desc == tx_desc) or (len(curr_desc) > 4 and curr_desc in tx_desc) or (len(tx_desc) > 4 and tx_desc in curr_desc)
                if desc_match:
                    try:
                        tx_date = datetime.strptime(tx_date_str, "%Y-%m-%d")
                        diff_days = abs((curr_date - tx_date).days)
                        if diff_days <= 2:
                            return True, f"Suspected duplicate: identical amount ₹{curr_amt:,.2f} and merchant within {diff_days} day(s) of '{tx.get('description')}' ({tx_date_str})."
                    except Exception:
                        pass
        return False, ""

    def evaluate_transaction(
        self,
        transaction: Dict[str, Any],
        historical_transactions: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Comprehensive anomaly evaluation:
        1. Duplicate inspection
        2. Category-specific statistical deviation (Z-score / IQR)
        3. Scikit-learn Isolation Forest multivariate inference
        """
        # 1. Duplicate check
        is_dup, dup_reason = self.check_duplicate(transaction, historical_transactions)
        if is_dup:
            return {
                "is_anomaly": True,
                "anomaly_score": 0.95,
                "anomaly_reason": dup_reason,
                "is_duplicate": True,
                "risk_level": "High"
            }

        amount = float(transaction.get("amount", 0))
        category = transaction.get("category", "Other & Miscellaneous")

        # 2. Category statistical analysis from user history
        cat_amounts = [
            float(t.get("amount", 0))
            for t in historical_transactions
            if t.get("category") == category and float(t.get("amount", 0)) > 0
        ]

        stat_anomaly = False
        stat_reason = ""
        ratio = 1.0

        if len(cat_amounts) >= 3:
            avg_amt = np.mean(cat_amounts)
            std_amt = np.std(cat_amounts) if np.std(cat_amounts) > 0 else avg_amt * 0.2
            ratio = amount / max(avg_amt, 1.0)
            
            if amount > (avg_amt + 2.5 * std_amt) and amount > avg_amt * 2.2:
                stat_anomaly = True
                stat_reason = f"Unusually large charge: ₹{amount:,.2f} is {ratio:.1f}x higher than your average {category} expense (₹{avg_amt:,.2f})."
        else:
            # Fallback heuristic rules for cold-start category anomalies
            thresholds = {
                "Food & Dining": 1500.0,
                "Travel & Commute": 1200.0,
                "Subscriptions & Streaming": 1500.0,
                "Groceries & Essentials": 2500.0,
                "Utilities & Bills": 3500.0,
                "Entertainment & Outings": 2500.0,
                "Shopping & E-Commerce": 6000.0,
                "Healthcare & Fitness": 5000.0,
                "Education & Books": 4500.0,
                "Other & Miscellaneous": 3000.0
            }
            thresh = thresholds.get(category, 2500.0)
            if amount >= thresh:
                stat_anomaly = True
                stat_reason = f"High expense alert: ₹{amount:,.2f} substantially exceeds typical student limit for {category} (₹{thresh:,.0f})."

        # 3. Isolation Forest inference
        features = np.array([self._extract_features(transaction)])
        iso_pred = self.clf.predict(features)[0] # -1 for anomaly, 1 for normal
        decision_score = self.clf.decision_function(features)[0]
        # Normalize decision function score: lower value means more anomalous
        # decision_function usually ranges between -0.3 and +0.3
        norm_score = float(np.clip(0.5 - (decision_score * 1.5), 0.05, 0.99))

        is_anomaly = bool(stat_anomaly or iso_pred == -1 or norm_score >= 0.72)
        
        final_reason = ""
        if stat_reason:
            final_reason = stat_reason
        elif is_anomaly:
            final_reason = f"Machine Learning model flagged anomalous spending behavior (Isolation Forest confidence {norm_score*100:.0f}%)."

        # Determine risk level
        risk_level = "Low"
        if is_anomaly:
            if norm_score >= 0.85 or stat_anomaly:
                risk_level = "High"
            else:
                risk_level = "Medium"

        return {
            "is_anomaly": is_anomaly,
            "anomaly_score": round(norm_score, 3),
            "anomaly_reason": final_reason if is_anomaly else None,
            "is_duplicate": False,
            "risk_level": risk_level
        }

    def batch_evaluate(self, transactions: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Evaluates a batch of transactions (e.g. from CSV import or whole user history).
        """
        results = []
        for i, tx in enumerate(transactions):
            eval_res = self.evaluate_transaction(tx, transactions)
            tx_updated = dict(tx)
            tx_updated.update(eval_res)
            results.append(tx_updated)
        return results

anomaly_detector = ExpenseAnomalyDetector()
