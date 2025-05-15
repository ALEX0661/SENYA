from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.dependencies import get_db, get_current_user
from app.models import UserProfile, HeartPackage
from app.schemas import HeartPurchase, HeartPurchaseResponse, HeartPackage as HeartPackageSchema

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.post("/purchase-hearts", response_model=HeartPurchaseResponse, status_code=status.HTTP_200_OK)
async def purchase_hearts(
    request: HeartPurchase,
    db: AsyncSession = Depends(get_db)
):
    heart_package = (await db.execute(
        select(HeartPackage).where(HeartPackage.id == request.package_id)
    )).scalars().first()
    
    if not heart_package:
        raise HTTPException(status_code=404, detail="Heart package not found")
    
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == request.user_id)
    )).scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    if profile.rubies < heart_package.ruby_cost:
        raise HTTPException(status_code=400, detail="Not enough rubies")
    
    profile.rubies -= heart_package.ruby_cost
    profile.hearts += heart_package.hearts_amount
    
    max_hearts = 5
    if profile.hearts > max_hearts:
        profile.hearts = max_hearts
    
    await db.commit()
    
    return {
        "user_id": profile.user_id,
        "hearts": profile.hearts,
        "rubies": profile.rubies
    }

@router.get("/heart-packages", response_model=List[HeartPackageSchema])
async def get_heart_packages(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(HeartPackage))
    packages = result.scalars().all()
    return packages