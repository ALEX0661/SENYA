from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, desc, and_, Integer, case               
from app.models import Unit, Lesson, Sign, UserProgress, Account, UserProfile, UserPracticeProgress
from app.dependencies import get_db, get_admin_user
from app.schemas import AnalyticsOverviewSchema, UserStatisticsSchema, LessonAnalyticsSchema, SignAnalyticsSchema, MostFailedLessonSchema, DailyCountSchema, UserStreakSchema, UserCompletionSchema
from typing import List, Any, Dict
from datetime import datetime, timedelta

router = APIRouter()

@router.get("/overview", response_model=AnalyticsOverviewSchema)
async def get_analytics_overview(
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """Get overall analytics data for the application"""
    users_result = await db.execute(select(func.count()).select_from(Account))
    total_users = users_result.scalar()

    seven_days_ago = datetime.now() - timedelta(days=7)
    active_users_result = await db.execute(
        select(func.count())
        .select_from(Account)
        .where(Account.last_login >= seven_days_ago)
    )
    active_users = active_users_result.scalar()

    units_result = await db.execute(select(func.count()).select_from(Unit).where(Unit.archived == False))
    total_units = units_result.scalar()

    lessons_result = await db.execute(select(func.count()).select_from(Lesson).where(Lesson.archived == False))
    total_lessons = lessons_result.scalar()

    signs_result = await db.execute(select(func.count()).select_from(Sign).where(Sign.archived == False))
    total_signs = signs_result.scalar()

    completed_lessons_result = await db.execute(
        select(func.count())
        .select_from(UserProgress)
        .where(UserProgress.completed == True)
    )
    completed_lessons = completed_lessons_result.scalar()

    streak_result = await db.execute(select(func.avg(UserProfile.streak)).select_from(UserProfile))
    avg_streak = streak_result.scalar() or 0

    rubies_result = await db.execute(select(func.sum(UserProfile.rubies)).select_from(UserProfile))
    total_rubies = rubies_result.scalar() or 0

    return {
        "total_users": total_users,
        "active_users_last_week": active_users,
        "total_units": total_units,
        "total_lessons": total_lessons,
        "total_signs": total_signs,
        "completed_lessons": completed_lessons,
        "average_streak": round(avg_streak, 1),
        "total_rubies_earned": total_rubies
    }

@router.get("/users", response_model=UserStatisticsSchema)
async def get_user_statistics(
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """
    Get statistics about user engagement and performance,
    including per-day counts and lists of usernames.
    """
    # 1️⃣ Define time window
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)

    # 2️⃣ Fetch raw signups (timestamp + name)
    signup_rows = await db.execute(
        select(Account.created_at, Account.name)
        .where(Account.created_at >= thirty_days_ago)
    )
    signup_data = signup_rows.all()

    # 3️⃣ Fetch raw logins (timestamp + name)
    login_rows = await db.execute(
        select(Account.last_login, Account.name)
        .where(Account.last_login >= thirty_days_ago)
    )
    login_data = login_rows.all()

    # 4️⃣ Group into dicts keyed by ISO date
    signups_by_day: Dict[str, Dict[str, Any]] = {}
    for created_at, name in signup_data:
        day = created_at.date().isoformat()
        entry = signups_by_day.setdefault(day, {"count": 0, "names": []})
        entry["count"] += 1
        entry["names"].append(name)

    logins_by_day: Dict[str, Dict[str, Any]] = {}
    for last_login, name in login_data:
        day = last_login.date().isoformat()
        entry = logins_by_day.setdefault(day, {"count": 0, "names": []})
        entry["count"] += 1
        entry["names"].append(name)

    # 5️⃣ Build a full 31‑day list (so gaps appear as zero)
    days = [
        (thirty_days_ago + timedelta(days=i)).date().isoformat()
        for i in range(31)
    ]

    signup_list: List[DailyCountSchema] = []
    login_list: List[DailyCountSchema] = []
    for day in days:
        su = signups_by_day.get(day, {"count": 0, "names": []})
        li = logins_by_day .get(day, {"count": 0, "names": []})
        signup_list.append(DailyCountSchema(date=day, count=su["count"], names=su["names"]))
        login_list .append(DailyCountSchema(date=day, count=li["count"], names=li["names"]))

    # 6️⃣ Top streaks (unchanged)
    top_streak_rows = await db.execute(
        select(Account.name, UserProfile.streak)
        .join(UserProfile, Account.user_id == UserProfile.user_id)
        .order_by(desc(UserProfile.streak))
        .limit(5)
    )
    top_streaks = [
        UserStreakSchema(username=r.name, streak=r.streak)
        for r in top_streak_rows
    ]

    # 7️⃣ Top completions (unchanged)
    top_comp_rows = await db.execute(
        select(
            Account.name,
            func.count().label("completed_count")
        )
        .join(UserProgress, Account.user_id == UserProgress.user_id)
        .where(UserProgress.completed == True)
        .group_by(Account.name)
        .order_by(desc("completed_count"))
        .limit(5)
    )
    top_completions = [
        UserCompletionSchema(username=r.name, completed_lessons=r.completed_count)
        for r in top_comp_rows
    ]

    # 8️⃣ Average lessons completed per user (unchanged)
    avg_lessons_row = await db.execute(
        select(
            func.avg(
                select(func.count())
                .select_from(UserProgress)
                .where(
                    and_(
                        UserProgress.user_id == Account.user_id,
                        UserProgress.completed == True
                    )
                )
                .correlate(Account)
                .scalar_subquery()
            )
        )
        .select_from(Account)
    )
    avg_lessons_completed = avg_lessons_row.scalar() or 0

    # 9️⃣ Return assembled payload
    return UserStatisticsSchema(
        signups_by_day=signup_list,
        logins_by_day=login_list,
        top_streaks=top_streaks,
        top_completions=top_completions,
        average_lessons_completed=round(avg_lessons_completed, 1)
    )

@router.get("/lessons", response_model=List[LessonAnalyticsSchema])
async def get_lesson_analytics(
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """Get analytics data for individual lessons"""
    lesson_stats_result = await db.execute(
        select(
            Lesson.id,
            Lesson.title,
            Lesson.unit_id,
            Unit.title.label("unit_title"),
            func.count(UserProgress.id).label("total_attempts"),
            func.sum(func.cast(UserProgress.completed, Integer)).label("completions")
        )
        .select_from(Lesson)
        .join(Unit, Lesson.unit_id == Unit.id)
        .outerjoin(UserProgress, Lesson.id == UserProgress.lesson_id)
        .where(Lesson.archived == False)
        .group_by(Lesson.id, Lesson.title, Lesson.unit_id, Unit.title)
        .order_by(Lesson.unit_id, Lesson.order_index)
    )

    lesson_analytics = []
    for row in lesson_stats_result:
        completion_rate = 0
        if row.total_attempts > 0 and row.completions is not None:
            completion_rate = (row.completions / row.total_attempts) * 100

        avg_progress_result = await db.execute(
            select(func.avg(UserProgress.progress))
            .where(
                and_(
                    UserProgress.lesson_id == row.id,
                    UserProgress.completed == False
                )
            )
        )
        avg_progress = avg_progress_result.scalar() or 0

        lesson_analytics.append({
            "lesson_id": row.id,
            "lesson_title": row.title,
            "unit_id": row.unit_id,
            "unit_title": row.unit_title,
            "total_attempts": row.total_attempts,
            "completions": row.completions or 0,
            "completion_rate": round(completion_rate, 1),
            "average_progress": round(avg_progress, 1)
        })

    return lesson_analytics

@router.get("/signs", response_model=List[SignAnalyticsSchema])
async def get_sign_analytics(
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """Get analytics data for individual signs"""
    signs_result = await db.execute(
        select(
            Sign.id,
            Sign.text,
            Sign.difficulty_level,
            Lesson.id.label("lesson_id"),
            Lesson.title.label("lesson_title"),
            Unit.id.label("unit_id"),
            Unit.title.label("unit_title")
        )
        .select_from(Sign)
        .join(Lesson, Sign.lesson_id == Lesson.id)
        .join(Unit, Lesson.unit_id == Unit.id)
        .where(Sign.archived == False)
        .order_by(Sign.difficulty_level, Sign.id)
    )

    sign_analytics = []
    for row in signs_result:
        error_rate = {"beginner":10,"intermediate":25,"advanced":40}.get(row.difficulty_level, 0)
        sign_analytics.append({
            "sign_id": row.id,
            "sign_text": row.text,
            "difficulty_level": row.difficulty_level,
            "lesson_id": row.lesson_id,
            "lesson_title": row.lesson_title,
            "unit_id": row.unit_id,
            "unit_title": row.unit_title,
            "error_rate": error_rate,
            "attempts": 0
        })

    sign_analytics.sort(key=lambda x: x["error_rate"], reverse=True)
    return sign_analytics[:20]

@router.get(
    "/most-failed",
    response_model=List[MostFailedLessonSchema],
    summary="Top lessons by failure rate",
)
async def get_most_failed_lessons(
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """
    Return the lessons with the highest percentage of failed attempts.
    Failure rate = failures / total_attempts * 100.
    """
    # 1️⃣ Compute total attempts and completions per lesson
    stats = await db.execute(
        select(
            Lesson.id.label("lesson_id"),
            Lesson.title.label("lesson_title"),
            Unit.title.label("unit_title"),
            func.count(UserProgress.id).label("total_attempts"),
            # count of failures = count where completed=False
            func.sum(
                case((UserProgress.completed == False, 1), else_=0)
            ).label("failures")
        )
        .select_from(Lesson)
        .join(Unit, Lesson.unit_id == Unit.id)
        .outerjoin(UserProgress, Lesson.id == UserProgress.lesson_id)
        .where(Lesson.archived == False)
        .group_by(Lesson.id, Lesson.title, Unit.title)
        .order_by(desc("failures"), desc("total_attempts"))
        .limit(10)  # top 10 most failed lessons
    )

    results = []
    for row in stats:
        total = row.total_attempts or 0
        fails = row.failures or 0
        rate = (fails / total * 100) if total > 0 else 0
        results.append({
            "lesson_id":     row.lesson_id,
            "lesson_title":  row.lesson_title,
            "unit_title":    row.unit_title,
            "total_attempts": total,
            "failures":       fails,
            "failure_rate":   round(rate, 1)
        })

    return results
