# app/routers/practice_routes.py

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List, Dict, Any
import traceback

from app.dependencies import get_db, get_current_user
from app.services.practice_service import (
    get_practice_signs,
    update_progress,
    get_practice_levels
)
from app.schemas import (
    GameScoreUpdateSchema
    
)
from app.models import UserProfile


router = APIRouter(dependencies=[Depends(get_current_user)])


@router.get("/signs/{user_id}/{difficulty}", response_model=List[Dict[str, Any]])
async def get_signs(user_id: int, difficulty: str, db: AsyncSession = Depends(get_db)):
    """Get signs for a specific difficulty level"""
    try:
        signs = await get_practice_signs(db, user_id, difficulty)
        return signs
    except Exception as e:
        print(f"Error getting signs by difficulty: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving signs: {str(e)}"
        )

@router.get("/hearts/{user_id}", response_model=Dict[str, Any])
async def get_hearts(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get user's hearts"""
    try:
        # Directly access the UserProfile instead of using get_user_status
        result = await db.execute(select(UserProfile).where(UserProfile.user_id == user_id))
        profile = result.scalars().first()
        
        if not profile:
            # If profile doesn't exist, return default values instead of 404
            return {
                "hearts": 5,
                "rubies": 0
            }
        
        return {
            "hearts": profile.hearts,
            "rubies": profile.rubies
        }
    except Exception as e:
        print(f"Error getting user hearts: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving user hearts: {str(e)}"
        )

@router.post("/update-progress/{user_id}", response_model=Dict[str, Any])
async def update_game_progress(
    user_id: int, 
    data: GameScoreUpdateSchema,
    db: AsyncSession = Depends(get_db)
):
    """Update user's progress for a game and level"""
    try:
        result = await update_progress(
            db, 
            user_id, 
            data.level_id, 
            data.game_id, 
            data.score,
            data.hearts_lost
        )
        return result
    except Exception as e:
        print(f"Error updating progress: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"Error updating progress: {str(e)}"
        )
    
# Add these routes to your existing practice_routes.py

@router.get("/levels/{user_id}", response_model=Dict[str, Any])
async def get_levels(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get all practice levels with games"""
    try:
        result = await get_practice_levels(db, user_id)
        return result
    except Exception as e:
        print(f"Error getting practice levels: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500, 
            detail=f"Error retrieving practice levels: {str(e)}"
        )