from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas import UserSignup, UserLogin, AdminLogin, AccountResponseSchema
from app.models import Account, UserProfile
from app.dependencies import get_db
from app.auth import hash_password, verify_password, create_access_token
from sqlalchemy.future import select
from datetime import datetime

router = APIRouter()

@router.post("/signup", summary="User Signup")
async def signup(user: UserSignup, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.email == user.email))
    if result.scalars().first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    new_account = Account(
        name=user.name,
        email=user.email,
        hash_password=hash_password(user.password),
        role="user"
    )
    db.add(new_account)
    await db.commit()
    await db.refresh(new_account)

    new_profile = UserProfile(user_id=new_account.user_id)
    db.add(new_profile)
    await db.commit()
    
    return {"msg": "Signup successful"}

@router.post("/login", response_model=AccountResponseSchema)
async def login(user: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.email == user.email))
    account = result.scalars().first()
    if not account or not verify_password(user.password, account.hash_password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")

    account.last_login = datetime.utcnow()
    await db.commit()

    token = create_access_token({"sub": str(account.user_id), "role": account.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": account.user_id,
            "name": account.name,
            "email": account.email,
            "role": account.role,
            "status": account.status
        }
    }

@router.post("/admin/login", response_model=AccountResponseSchema)
async def admin_login(admin: AdminLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Account).where(Account.email == admin.email, Account.role == 'admin'))
    account = result.scalars().first()
    if not account or not verify_password(admin.password, account.hash_password):
        raise HTTPException(status_code=400, detail="Incorrect credentials")
    
    account.last_login = datetime.utcnow()
    await db.commit()
    
    token = create_access_token({"sub": str(account.user_id), "role": account.role})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": account.user_id,
            "name": account.name,
            "email": account.email,
            "role": account.role,
            "status": account.status
        }
    }