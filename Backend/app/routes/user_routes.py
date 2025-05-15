from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from datetime import datetime, timezone

from app.models import UserProfile
from app.dependencies import get_db, get_current_user
from app.schemas import UserStatusSchema

router = APIRouter(dependencies=[Depends(get_current_user)])

@router.get("/{user_id}", response_model=UserStatusSchema)
async def get_status(user_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    return UserStatusSchema(
        user_id=profile.user_id,
        profile_url=profile.profile_url,
        progress=profile.progress,
        rubies=profile.rubies,
        hearts=profile.hearts,
        streak=profile.streak,
        certificate=profile.certificate,
        updated_at=profile.updated_at
    )

@router.get("/{user_id}/heart-timer")
async def get_heart_refresh_timer(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )
    profile = result.scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    if profile.hearts >= 5:
        return {"seconds_until_next_heart": 0}

    now = datetime.now(timezone.utc)
    last_updated = (
        profile.hearts_last_updated.replace(tzinfo=timezone.utc)
        if profile.hearts_last_updated
        else now
    )
    elapsed = (now - last_updated).total_seconds()

    heart_interval = 10 * 60
    seconds_until_next = max(0, heart_interval - (elapsed % heart_interval))

    return {"seconds_until_next_heart": int(seconds_until_next)}
