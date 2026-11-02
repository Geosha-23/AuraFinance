# 🔮 AuraFinance AI — Personal Finance & Expense Anomaly Detector

> **Difficulty**: Intermediate | **Domain**: Machine Learning + Data Analytics + Web Application  
> Built with **React.js**, **FastAPI (Python)**, **MongoDB / Persistent Local Store**, and **Scikit-learn (Isolation Forest & Time-Series Forecasting)**.

---

## 📌 Scenario & College Student Problem Statement

College students and young adults manage limited monthly budgets across disparate payment channels (UPI, cards, cash). Common challenges include:
1. **Unconscious Overspending**: Discretionary expenses (food delivery, daily chai, cabs) silently consume the bulk of allowances.
2. **Duplicate Transactions**: Accidental double UPI debits or unexpected subscription renewals go unnoticed.
3. **Budget Depletion**: No foresight on month-end financial health until money runs out.

**AuraFinance AI** solves this with a multi-model Machine Learning engine that categorizes transactions in real time, scans for unusual outlier expenses, flags duplicate debits, and projects month-end spending trajectories.

---

## 🧠 Machine Learning & Data Analytics Implementation

### 1. NLP Transaction Categorization
- **Model**: Scikit-Learn `TfidfVectorizer` (word + sub-word n-grams) + `SGDClassifier(loss='log_loss')`.
- **Pre-trained Knowledge**: Trained on hundreds of college student expenses (Swiggy, Zomato, Uber, Rapido, Metro card, Netflix, Spotify, Coursera, campus photocopies, groceries, etc.).
- **Active Incremental Learning**: When a user changes or re-assigns a category in the table, the model learns incrementally via `partial_fit`.

### 2. Expense Anomaly & Duplicate Detection
- **Model**: Scikit-Learn `IsolationForest(n_estimators=100, contamination=0.08)`.
- **Feature Matrix**: `[amount, day_of_month, day_of_week, category_encoded]`.
- **Duplicate Engine**: Inspects a 24-48 hour window for identical amounts and vendor matches (e.g., accidental double UPI payment at a canteen or repeat subscription billing).
- **Statistical Z-Score / IQR**: Flags expenses exceeding 2.5x the user's category historical average with transparent explanations (e.g., *"₹3,850 is 4.2x higher than your average Food & Dining expense of ₹220"*).

### 3. Time-Series Expense Forecasting
- **Model**: Scikit-Learn `Ridge` regression on cumulative expenditure curves blended with rolling 7-day velocity.
- **Budget Threshold Alerts**:
  - Compares projected month-end totals against category budgets and monthly allowance.
  - Warns proactively before limits are breached (e.g. *"Food budget: ₹4,000, current: ₹3,500, predicted month-end: ₹4,800"*).
  - Recommends safe daily spending allowances to stay on track.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, Vite, Recharts, Lucide Icons, Glassmorphism CSS |
| **Backend** | Python 3.10+, FastAPI, Uvicorn, Pydantic, Python-JOSE (JWT) |
| **Database** | MongoDB (Motor driver) with automatic local persistent store fallback |
| **Machine Learning** | Scikit-learn (`IsolationForest`, `Ridge`, `SGDClassifier`, `TfidfVectorizer`), NumPy, Pandas |

---

## 🚀 Quick Start Guide

### Step 1: Backend Setup
Open a terminal in `backend/`:
```bash
# Navigate to backend directory
cd backend

# Install python dependencies
pip install -r requirements.txt

# Start FastAPI backend server (runs on http://localhost:8000)
python run_backend.py
```
> *API Documentation is interactively available at [http://localhost:8000/docs](http://localhost:8000/docs).*

### Step 2: Frontend Setup
Open a second terminal in `frontend/`:
```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start Vite React development server (runs on http://localhost:3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 💡 Quick Demo Walkthrough

1. **One-Click Demo Student Access**:
   - On the login page, click **"✨ Explore as Demo College Student"**.
   - An account (`Aarav Sharma`) is instantly created and loaded with realistic student expenses.
2. **Review Anomalies & Duplicates**:
   - Notice the top warning banner and the **"AI Anomaly Inspector"** tab.
   - Spot the duplicate ₹649 Netflix charges and the ₹3,850 weekend splurge.
3. **Inspect Forecast**:
   - Check the **"AI Monthly Expense Forecast"** card showing current spend vs projected month-end spend vs budget.
4. **Test Real-Time AI Auto-Categorization**:
   - Click **"+ Add Transaction"** and type *"Zomato butter chicken with friends"*. Notice the AI immediately predicts `Food & Dining` with high confidence!
5. **Import Custom CSV Statements**:
   - Click **"Import Bank CSV"** and drag `sample_transactions.csv` to batch analyze new statements.
