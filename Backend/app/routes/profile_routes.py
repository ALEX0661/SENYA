from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.dependencies import get_db, get_current_user
from app.models import Account, UserProfile
from app.schemas import UserProfileUpdate
from app.auth import hash_password
import os, uuid
import shutil
from pathlib import Path
from datetime import datetime
import time

router = APIRouter(dependencies=[Depends(get_current_user)])

IMAGE_FOLDER = Path("static/images/profiles")
os.makedirs(IMAGE_FOLDER, exist_ok=True)
IMAGE_BASE_URL = "/static/images/profiles"

@router.get("/{user_id}", summary="Get User Profile")
async def get_profile(user_id: int, db: AsyncSession = Depends(get_db)):
    acct_res = await db.execute(select(Account).where(Account.user_id == user_id))
    account = acct_res.scalars().first()
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = prof_res.scalars().first()

    if not account or not profile:
        raise HTTPException(404, "Profile not found")

    return {
        "account": {
            "user_id": account.user_id,
            "name": account.name,
            "email": account.email,
        },
        "profile": {
            "user_id": profile.user_id,
            "profile_url": profile.profile_url,
            "progress": getattr(profile, "progress", {}),
            "rubies": profile.rubies,
            "hearts": profile.hearts,
            "streak": profile.streak,
            "certificate": profile.certificate,
            "updated_at": profile.updated_at,
        },
    }

@router.put("/{user_id}", summary="Update User Profile")
async def update_profile(
    user_id: int, update: UserProfileUpdate, db: AsyncSession = Depends(get_db)
):
    acct_res = await db.execute(select(Account).where(Account.user_id == user_id))
    account = acct_res.scalars().first()
    if not account:
        raise HTTPException(404, "Account not found")

    if update.name is not None:
        account.name = update.name
    if update.email is not None:
        account.email = update.email
    if update.password is not None:
        account.hash_password = hash_password(update.password)

    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = prof_res.scalars().first()
    if not profile:
        raise HTTPException(404, "Profile not found")

    if update.profile_url is not None:
        profile.profile_url = update.profile_url

    await db.commit()
    return {"msg": "Profile updated successfully"}

@router.post("/{user_id}/upload-profile-picture", summary="Upload Profile Picture")
async def upload_profile_picture(
    user_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db)
):
    prof_res = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = prof_res.scalars().first()
    if not profile:
        raise HTTPException(404, "Profile not found")

    content_type = file.content_type
    if not content_type.startswith("image/"):
        raise HTTPException(400, "File must be an image")

    user_dir = IMAGE_FOLDER / str(user_id)
    os.makedirs(user_dir, exist_ok=True)

    file_ext = os.path.splitext(file.filename)[1]
    unique_filename = f"{uuid.uuid4()}{file_ext}"
    file_path = user_dir / unique_filename

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(500, "Failed to save file")
    finally:
        file.file.close()

    profile_url = f"{IMAGE_BASE_URL}/{user_id}/{unique_filename}"
    profile.profile_url = profile_url
    await db.commit()

    return {
        "success": True,
        "profile_url": profile_url,
        "msg": "Profile picture uploaded successfully"
    }

@router.post("/{user_id}/certificate", response_model=dict)
async def generate_certificate(user_id: int, db: AsyncSession = Depends(get_db)):
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )).scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    profile.certificate = True
    
    certificate_data = {
        "user_id": user_id,
        "name": (await db.execute(
            select(Account.name).where(Account.user_id == user_id)
        )).scalar_one_or_none(),
        "issue_date": datetime.utcnow().isoformat(),
        "certificate_id": f"SSL-{user_id}-{int(time.time())}"
    }
    
    await db.commit()
    
    return {
        "success": True, 
        "certificate": certificate_data
    }