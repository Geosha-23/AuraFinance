import calendar
import numpy as np
from datetime import datetime
from typing import List, Dict, Any, Optional
from sklearn.linear_model import Ridge

class ExpenseForecaster:
    def __init__(self):
        pass

    def forecast_monthly(
        self,
        transactions: List[Dict[str, Any]],
        budgets: List[Dict[str, Any]],
        monthly_allowance: float = 15000.0,
        target_month: Optional[str] = None # format "YYYY-MM"
    ) -> Dict[str, Any]:
        """
        Calculates time-series month-end projection for total and individual categories.
        """
        now = datetime.now()
        if not target_month:
            year = now.year
            month = now.month
            target_month = f"{year:04d}-{month:02d}"
        else:
            parts = target_month.split("-")
            year = int(parts[0])
            month = int(parts[1])

        # Days in target month
        _, days_in_month = calendar.monthrange(year, month)
        
        # If looking at current month, days elapsed is today's day; if past month, all days; if future, 1
        if year == now.year and month == now.month:
            days_elapsed = min(now.day, days_in_month)
        elif year < now.year or (year == now.year and month < now.month):
            days_elapsed = days_in_month
        else:
            days_elapsed = 1

        days_remaining = max(1, days_in_month - days_elapsed)

        # Filter transactions for this month
        month_prefix = f"{year:04d}-{month:02d}"
        month_txs = [t for t in transactions if t.get("date", "").startswith(month_prefix)]

        # Aggregate daily spending
        daily_spend = {day: 0.0 for day in range(1, days_in_month + 1)}
        category_spend = {}

        for tx in month_txs:
            try:
                tx_date = datetime.strptime(tx.get("date", ""), "%Y-%m-%d")
                d = tx_date.day
                amt = float(tx.get("amount", 0.0))
                daily_spend[d] += amt
                
                cat = tx.get("category", "Other & Miscellaneous")
                category_spend[cat] = category_spend.get(cat, 0.0) + amt
            except Exception:
                continue

        # Cumulative spending array up to days_elapsed
        cumulative_actual = []
        running_total = 0.0
        for d in range(1, days_elapsed + 1):
            running_total += daily_spend[d]
            cumulative_actual.append((d, running_total))

        total_spent_so_far = running_total

        # --- Scikit-learn Time-Series Modeling ---
        if days_elapsed >= 3 and len(month_txs) > 0:
            # Fit Ridge regression on cumulative spending pace with recency weighting
            X = np.array([pt[0] for pt in cumulative_actual]).reshape(-1, 1)
            y = np.array([pt[1] for pt in cumulative_actual])
            
            # Linear trend
            model = Ridge(alpha=1.0)
            model.fit(X, y)
            
            # Predict for days_in_month
            reg_predicted_month_end = float(model.predict([[days_in_month]])[0])
            
            # Also calculate weighted average daily burn rate (favoring recent days)
            recent_days = min(7, days_elapsed)
            recent_spend = sum(daily_spend[d] for d in range(days_elapsed - recent_days + 1, days_elapsed + 1))
            recent_burn_rate = recent_spend / max(1, recent_days)
            velocity_projection = total_spent_so_far + (recent_burn_rate * days_remaining)
            
            # Blended projection (60% velocity, 40% linear cumulative regression)
            predicted_total = max(total_spent_so_far, 0.6 * velocity_projection + 0.4 * reg_predicted_month_end)
        else:
            # Fallback simple linear extrapolation
            daily_avg = total_spent_so_far / max(1, days_elapsed)
            predicted_total = total_spent_so_far + (daily_avg * days_remaining)

        predicted_total = round(predicted_total, 2)

        # Budget map
        budget_map = {b.get("category"): float(b.get("monthly_limit", 0)) for b in budgets}
        total_budget = monthly_allowance if monthly_allowance > 0 else sum(budget_map.values())

        # Category level projections
        category_forecasts = []
        ai_recommendations = []

        all_categories = set(list(category_spend.keys()) + list(budget_map.keys()))
        for cat in sorted(all_categories):
            spent = float(round(category_spend.get(cat, 0.0), 2))
            bud = float(budget_map.get(cat)) if budget_map.get(cat) is not None else None
            
            # Project category month end
            if days_elapsed > 0:
                cat_daily_pace = spent / days_elapsed
                cat_predicted = float(round(spent + (cat_daily_pace * days_remaining), 2))
            else:
                cat_predicted = spent

            will_exceed = False
            overrun = 0.0
            status = "On Track"

            if bud and bud > 0:
                if cat_predicted > bud:
                    will_exceed = True
                    overrun = float(round(cat_predicted - bud, 2))
                    status = "Danger" if cat_predicted > (bud * 1.15) else "Warning"
                    ai_recommendations.append(
                        f"⚠️ Alert on {cat}: Current spend ₹{spent:,.0f} is projected to reach ₹{cat_predicted:,.0f}, exceeding your ₹{bud:,.0f} budget by ₹{overrun:,.0f}."
                    )
                elif cat_predicted > (bud * 0.85):
                    status = "Warning"

            category_forecasts.append({
                "category": str(cat),
                "current_spend": spent,
                "predicted_spend": cat_predicted,
                "budget_limit": bud,
                "will_exceed_budget": bool(will_exceed),
                "projected_overrun": overrun,
                "status": status
            })

        # Overall budget check
        will_exceed_total = predicted_total > total_budget
        deficit_or_savings = round(total_budget - predicted_total, 2)

        if will_exceed_total:
            ai_recommendations.insert(
                0,
                f"🚨 Total Budget Warning: At current velocity, you will spend ₹{predicted_total:,.0f} against your ₹{total_budget:,.0f} limit (Over budget by ₹{abs(deficit_or_savings):,.0f})."
            )
        else:
            ai_recommendations.insert(
                0,
                f"✅ Budget On Track: On course to spend ₹{predicted_total:,.0f} with an estimated saving of ₹{deficit_or_savings:,.0f} this month."
            )

        # Safe daily budget recommendation
        if days_remaining > 0 and total_budget > total_spent_so_far:
            safe_daily = (total_budget - total_spent_so_far) / days_remaining
            ai_recommendations.append(
                f"💡 Safe Spending Target: Limit daily spending to ₹{safe_daily:,.0f}/day for the next {days_remaining} days to remain within budget."
            )

        # Build trajectory chart data points
        trajectory = []
        # Target daily linear budget pace
        budget_daily_pace = total_budget / days_in_month

        cum_spent = 0.0
        cum_proj = total_spent_so_far
        daily_proj_increment = (predicted_total - total_spent_so_far) / max(1, days_remaining)

        for d in range(1, days_in_month + 1):
            budget_line = round(d * budget_daily_pace, 2)
            if d <= days_elapsed:
                cum_spent += daily_spend.get(d, 0.0)
                trajectory.append({
                    "day": f"Day {d}",
                    "day_num": d,
                    "actual": round(cum_spent, 2),
                    "projected": round(cum_spent, 2),
                    "budget_limit": budget_line
                })
            else:
                cum_proj += daily_proj_increment
                trajectory.append({
                    "day": f"Day {d}",
                    "day_num": d,
                    "actual": None,
                    "projected": round(cum_proj, 2),
                    "budget_limit": budget_line
                })

        return {
            "month": target_month,
            "days_elapsed": days_elapsed,
            "days_in_month": days_in_month,
            "total_spent_so_far": round(total_spent_so_far, 2),
            "predicted_month_end_spend": predicted_total,
            "monthly_budget_allowance": round(total_budget, 2),
            "will_exceed_total_budget": will_exceed_total,
            "projected_savings_or_deficit": deficit_or_savings,
            "category_forecasts": category_forecasts,
            "ai_recommendations": ai_recommendations,
            "forecast_trajectory": trajectory
        }

forecaster = ExpenseForecaster()
