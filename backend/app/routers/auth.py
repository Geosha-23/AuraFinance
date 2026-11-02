import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, status, Depends
try:
    from app.database import get_users_collection, get_budgets_collection
    from app.models import UserRegister, UserLogin, TokenResponse, UserProfile
    from app.auth import hash_password, verify_password, create_access_token, get_current_user
except ImportError:
    from backend.app.database import get_users_collection, get_budgets_collection
    from backend.app.models import UserRegister, UserLogin, TokenResponse, UserProfile
    from backend.app.auth import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=TokenResponse)
async def register(user_data: UserRegister):
    users = get_users_collection()
    existing = await users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    user_id = str(uuid.uuid4())
    hashed_pwd = hash_password(user_data.password)
    now_str = datetime.utcnow().isoformat()

    new_user = {
        "_id": user_id,
        "id": user_id,
        "name": user_data.name,
        "email": user_data.email.lower(),
        "password": hashed_pwd,
        "monthly_allowance": user_data.monthly_allowance or 15000.0,
        "created_at": now_str
    }
    await users.insert_one(new_user)

    # Initialize default student budgets
    now = datetime.now()
    target_month_str = f"{now.year:04d}-{now.month:02d}"
    budgets_col = get_budgets_collection()
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
    for b in default_budgets:
        b["_id"] = b["id"]
    await budgets_col.insert_many(default_budgets)

    token = create_access_token({"sub": user_id, "email": new_user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserProfile(
            id=user_id,
            name=new_user["name"],
            email=new_user["email"],
            monthly_allowance=new_user["monthly_allowance"],
            created_at=now_str
        )
    }

@router.post("/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    users = get_users_collection()
    user = await users.find_one({"email": credentials.email.lower()})
    if not user or not verify_password(credentials.password, user.get("password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password combination."
        )

    token = create_access_token({"sub": str(user["_id"]), "email": user["email"]})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": UserProfile(
            id=str(user["_id"]),
            name=user.get("name", "Student"),
            email=user["email"],
            monthly_allowance=float(user.get("monthly_allowance", 15000.0)),
            created_at=str(user.get("created_at", ""))
        )
    }

@router.get("/me", response_model=UserProfile)
async def get_me(current_user: dict = Depends(get_current_user)):
    return UserProfile(
        id=str(current_user["_id"]),
        name=current_user.get("name", "Student"),
        email=current_user["email"],
        monthly_allowance=float(current_user.get("monthly_allowance", 15000.0)),
        created_at=str(current_user.get("created_at", ""))
    )
