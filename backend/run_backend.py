import sys
import os

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(BACKEND_DIR)

for path in [BACKEND_DIR, ROOT_DIR]:
    if path not in sys.path:
        sys.path.insert(0, path)

if __name__ == "__main__":
    import uvicorn
    print("=" * 60)
    print("Starting AI Personal Finance & Expense Anomaly Detector Backend")
    print("Interactive Swagger API Docs: http://localhost:8000/docs")
    print("Health check: http://localhost:8000/api/health")
    print("=" * 60)
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
