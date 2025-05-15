from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload, contains_eager
from datetime import datetime, timedelta

from app.models import (
    Lesson, Unit, Sign, UserProgress, UserProfile, Account
)
from app.dependencies import get_db, get_current_user
from app.schemas import (
    LessonResponseSchema,
    ProgressUpdateSchema,
    ProgressResponseSchema,
    UnitWithLessonsSchema,
    UserProgressSchema,
    UnitProgressResponse
)

router = APIRouter()

@router.get("/units/", response_model=List[UnitWithLessonsSchema])
async def get_units(
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    result = await db.execute(
        select(Unit)
        .outerjoin(Unit.lessons)
        .options(contains_eager(Unit.lessons))
        .where(Unit.archived == False)
        .where(Lesson.archived == False)
        .order_by(Unit.order_index, Lesson.order_index)
    )
    return result.scalars().unique().all()

@router.get("/", summary="List all lessons", response_model=List[LessonResponseSchema])
async def list_lessons(
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    result = await db.execute(
        select(Lesson)
        .where(Lesson.archived == False)
        .order_by(Lesson.order_index)
    )
    return result.scalars().all()

@router.get("/{lesson_id}", response_model=LessonResponseSchema)
async def get_lesson(
    lesson_id: int, 
    db: AsyncSession = Depends(get_db),
):
    lesson_result = await db.execute(
        select(Lesson)
        .outerjoin(Lesson.signs)
        .options(
            contains_eager(Lesson.signs),
        )
        .where(Lesson.id == lesson_id)
        .where(Lesson.archived == False)
        .where(Sign.archived == False)
    )
    lesson = lesson_result.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    lesson.video_url = lesson.signs[0].video_url if lesson.signs else None
    return lesson

@router.get("/user-progress/{user_id}/{lesson_id}", response_model=UserProgressSchema)
async def get_user_progress(
    user_id: int, 
    lesson_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    lesson = (await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson_id, Lesson.archived == False)
    )).scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found or archived")

    progress = (await db.execute(
        select(UserProgress)
        .where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == lesson_id
        )
    )).scalars().first()
    if not progress:
        return {
            "user_id": user_id,
            "lesson_id": lesson_id,
            "progress": 0,
            "completed": False,
            "last_question": 0
        }
    return progress

@router.post("/refresh-hearts/{user_id}", response_model=dict)
async def refresh_hearts(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )).scalars().first()
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")

    now = datetime.utcnow()
    minutes_passed = (now - profile.hearts_last_updated).total_seconds() / 60
    hearts_to_add = int(minutes_passed / 10)
    if hearts_to_add > 0:
        profile.hearts = min(profile.hearts + hearts_to_add, 5)
        profile.hearts_last_updated = now - timedelta(minutes=minutes_passed % 10)
    await db.commit()
    return {"user_id": profile.user_id, "hearts": profile.hearts}

@router.get("/unit-status/{user_id}/{unit_id}", response_model=dict)
async def get_unit_status(
    user_id: int, 
    unit_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    current_unit = (await db.execute(
        select(Unit)
        .where(Unit.id == unit_id, Unit.archived == False)
    )).scalars().first()
    
    if not current_unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    if current_unit.order_index == 0:
        return {"is_locked": False}
    
    previous_unit = (await db.execute(
        select(Unit)
        .where(
            Unit.order_index < current_unit.order_index,
            Unit.archived == False
        )
        .order_by(Unit.order_index.desc())
        .limit(1)
    )).scalars().first()
    
    if not previous_unit:
        return {"is_locked": False}
    
    lessons = (await db.execute(
        select(Lesson)
        .where(Lesson.unit_id == previous_unit.id, Lesson.archived == False)
    )).scalars().all()
    
    if not lessons:
        return {"is_locked": True, "reason": "Previous unit has no lessons"}
    
    all_completed = True
    for lesson in lessons:
        prog = (await db.execute(
            select(UserProgress)
            .where(
                UserProgress.user_id == user_id,
                UserProgress.lesson_id == lesson.id
            )
        )).scalars().first()
        
        if not prog or not prog.completed:
            all_completed = False
            break
    
    return {"is_locked": not all_completed}

@router.get("/lesson-status/{user_id}/{lesson_id}", response_model=dict)
async def get_lesson_status(
    user_id: int, 
    lesson_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    lesson = (await db.execute(
        select(Lesson).where(Lesson.id == lesson_id)
    )).scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    first_lesson = (await db.execute(
        select(Lesson)
        .where(Lesson.unit_id == lesson.unit_id)
        .order_by(Lesson.order_index)
        .limit(1)
    )).scalars().first()
    if first_lesson and first_lesson.id == lesson_id:
        return {"is_locked": False}

    prev = (await db.execute(
        select(Lesson)
        .where(
            Lesson.unit_id == lesson.unit_id,
            Lesson.order_index < lesson.order_index
        )
        .order_by(Lesson.order_index.desc())
        .limit(1)
    )).scalars().first()
    if not prev:
        return {"is_locked": False}

    prog = (await db.execute(
        select(UserProgress)
        .where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == prev.id
        )
    )).scalars().first()
    return {"is_locked": not (prog and prog.completed)}

from datetime import datetime, timedelta
from fastapi import HTTPException

@router.patch(
    "/update-progress/{user_id}/{lesson_id}",
    response_model=ProgressResponseSchema
)
async def update_progress(
    user_id: int,
    lesson_id: int,
    progress_data: ProgressUpdateSchema,
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    try:
        lesson = (
            await db.execute(
                select(Lesson)
                .where(Lesson.id == lesson_id, Lesson.archived.is_(False))
            )
        ).scalars().first()
        if not lesson:
            raise HTTPException(404, "Lesson not found or archived")

        up = (
            await db.execute(
                select(UserProgress)
                .where(
                    UserProgress.user_id == user_id,
                    UserProgress.lesson_id == lesson_id
                )
            )
        ).scalars().first()
        if not up:
            up = UserProgress(
                user_id=user_id,
                lesson_id=lesson_id,
                progress=0,
                completed=False,
                last_question=0
            )
            db.add(up)

        new_prog = max(0, min(progress_data.progress, 100))
        up.progress = new_prog
        up.last_question = progress_data.current_question

        profile = (
            await db.execute(
                select(UserProfile).where(UserProfile.user_id == user_id)
            )
        ).scalars().first()
        if not profile:
            raise HTTPException(404, "User profile not found")

        if not progress_data.is_correct:
            profile.hearts = max(profile.hearts - 1, 0)

        rubies_earned = 0
        next_unlocked = False
        if new_prog >= 100 and not up.completed:
            up.completed = True
            profile.rubies += lesson.rubies_reward
            rubies_earned = lesson.rubies_reward

            today = datetime.utcnow().date()
            last_date = (
                profile.last_lesson_date.date()
                if profile.last_lesson_date
                else None
            )
            if last_date == today:
                pass
            elif last_date == today - timedelta(days=1):
                profile.streak += 1
            else:
                profile.streak = 1
            profile.last_lesson_date = datetime.utcnow()

            nxt = (
                await db.execute(
                    select(Lesson).where(Lesson.id == lesson.id + 1)
                )
            ).scalars().first()
            next_unlocked = bool(nxt)

        await db.commit()

        return {
            "progress": up.progress,
            "completed": up.completed,
            "hearts_remaining": profile.hearts,
            "rubies_earned": rubies_earned,
            "next_lesson_unlocked": next_unlocked
        }

    except HTTPException:
        await db.rollback()
        raise
    except Exception:
        await db.rollback()
        raise HTTPException(500, "Could not update progress")


@router.get("/unit-progress/{user_id}/{unit_id}", response_model=UnitProgressResponse, status_code=status.HTTP_200_OK)
async def get_unit_progress(
    user_id: int, 
    unit_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    lessons = (await db.execute(
        select(Lesson)
        .where(Lesson.unit_id == unit_id, Lesson.archived == False)
    )).scalars().all()
    if not lessons:
        return UnitProgressResponse(
            progress_percentage=0.0,
            completed_lessons=0,
            total_lessons=0
        )

    total = 0
    completed = 0
    for lesson in lessons:
        prog = (await db.execute(
            select(UserProgress)
            .where(
                UserProgress.user_id == user_id,
                UserProgress.lesson_id == lesson.id
            )
        )).scalars().first()
        if prog:
            total += prog.progress
            if prog.completed:
                completed += 1

    return UnitProgressResponse(
        progress_percentage=total / len(lessons),
        completed_lessons=completed,
        total_lessons=len(lessons)
    )

# This endpoint is causing the 401 error - update it to make it public
@router.get("/lesson-progress/{user_id}/{lesson_id}", response_model=dict)
async def get_lesson_progress(
    user_id: int, 
    lesson_id: int, 
    db: AsyncSession = Depends(get_db)
    # Remove the current_user dependency to make it public
):
    lesson = (await db.execute(
        select(Lesson)
        .where(Lesson.id == lesson_id, Lesson.archived == False)
    )).scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    prog = (await db.execute(
        select(UserProgress)
        .where(
            UserProgress.user_id == user_id,
            UserProgress.lesson_id == lesson_id
        )
    )).scalars().first()
    if not prog:
        return {"progress": 0, "completed": False}
    return {"progress": prog.progress, "completed": prog.completed}

@router.get("/daily-challenges/{user_id}", response_model=LessonResponseSchema)
async def get_daily_challenges(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    completed_progress = await db.execute(
        select(UserProgress)
        .where(
            UserProgress.user_id == user_id,
            UserProgress.completed == True
        )
    )
    completed_lesson_ids = [p.lesson_id for p in completed_progress.scalars().all()]
    
    if not completed_lesson_ids:
        raise HTTPException(
            status_code=404, 
            detail="No completed lessons found. Complete lessons to unlock daily challenges."
        )
    
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )).scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    current_date = datetime.utcnow().date()
    if profile.last_challenge_date and profile.last_challenge_date.date() == current_date:
        raise HTTPException(
            status_code=400, 
            detail="Daily challenge already completed today. Come back tomorrow!"
        )
    
    import random
    challenge_id = random.choice(completed_lesson_ids)
    
    challenge_lesson = await db.execute(
        select(Lesson)
        .where(
            Lesson.id == challenge_id,
            Lesson.archived == False
        )
        .options(
            selectinload(Lesson.signs),
        )
    )
    
    lesson = challenge_lesson.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Challenge lesson not found")
    
    lesson.video_url = lesson.signs[0].video_url if lesson.signs else None
    
    return lesson

@router.post("/complete-daily-challenge/{user_id}", response_model=dict)
async def complete_daily_challenge(
    user_id: int, 
    db: AsyncSession = Depends(get_db),
    current_user: Account = Depends(get_current_user)
):
    profile = (await db.execute(
        select(UserProfile).where(UserProfile.user_id == user_id)
    )).scalars().first()
    
    if not profile:
        raise HTTPException(status_code=404, detail="User profile not found")
    
    current_date = datetime.utcnow().date()
    if profile.last_challenge_date and profile.last_challenge_date.date() == current_date:
        return {"success": False, "message": "Daily challenge already completed today"}
    
    profile.rubies += 10
    
    profile.last_challenge_date = datetime.utcnow()
    
    if not profile.last_lesson_date or profile.last_lesson_date.date() != current_date:
        if profile.last_lesson_date and profile.last_lesson_date.date() == current_date - timedelta(days=1):
            profile.streak += 1
        elif not profile.last_lesson_date or profile.last_lesson_date.date() < current_date - timedelta(days=1):
            profile.streak = 1
    
    await db.commit()
    
    return {
        "success": True,
        "rubies": profile.rubies,
        "streak": profile.streak,
        "rubies_earned": 10
    }