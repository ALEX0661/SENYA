from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import (
    Sign,
    UserProfile,
    UserPracticeProgress,
    PracticeLevel,
    PracticeGame,
    Lesson,
    Unit,
    UserProgress
)
from typing import List, Dict, Any

async def get_practice_signs(db: AsyncSession, user_id: int, difficulty: str) -> List[Dict[str, Any]]:
    try:
        valid_difficulties = ["beginner", "intermediate", "advanced"]
        if difficulty not in valid_difficulties:
            difficulty = "beginner"
        
        result = await db.execute(
            select(Sign).where(
                Sign.difficulty_level == difficulty,
                Sign.archived == False
            )
        )
        signs = result.scalars().all()
        
        return [
            {
                "id": sign.id,
                "text": sign.text,
                "video_url": sign.video_url,
                "difficulty": sign.difficulty_level
            }
            for sign in signs
        ]
    
    except Exception as e:
        raise

async def get_practice_levels(db: AsyncSession, user_id: int) -> List[Dict[str, Any]]:
    try:
        levels_result = await db.execute(
            select(PracticeLevel).order_by(PracticeLevel.order_index)
        )
        levels = levels_result.scalars().all()
        
        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()
        
        overall_progress = 0
        try:
            units_result = await db.execute(
                select(Unit).where(Unit.archived == False)
            )
            units = units_result.scalars().all()
            
            if units:
                total_unit_progress = 0
                
                for unit in units:
                    lessons_result = await db.execute(
                        select(Lesson)
                        .where(Lesson.unit_id == unit.id, Lesson.archived == False)
                    )
                    lessons = lessons_result.scalars().all()
                    
                    if not lessons:
                        continue
                    
                    unit_total = 0
                    for lesson in lessons:
                        prog_result = await db.execute(
                            select(UserProgress)
                            .where(
                                UserProgress.user_id == user_id,
                                UserProgress.lesson_id == lesson.id
                            )
                        )
                        prog = prog_result.scalars().first()
                        if prog:
                            unit_total += prog.progress
                    
                    unit_progress = unit_total / len(lessons) if lessons else 0
                    total_unit_progress += unit_progress
                
                overall_progress = round(total_unit_progress / len(units)) if units else 0
        except Exception as e:
            pass
        
        user_progress_result = await db.execute(
            select(UserPracticeProgress)
            .where(UserPracticeProgress.user_id == user_id)
        )
        user_progress = user_progress_result.scalars().all()
        
        level_progress_map = {}
        game_progress_map = {}
        for progress in user_progress:
            if progress.level_id not in level_progress_map:
                level_progress_map[progress.level_id] = {
                    'progress': progress.progress,
                    'completed': progress.completed
                }
            
            game_key = f"{progress.level_id}_{progress.game_id}"
            game_progress_map[game_key] = {
                'high_score': progress.high_score,
                'progress': progress.progress,
                'completed': progress.completed
            }
        
        formatted_levels = []
        for level in levels:
            unlocked = True if level.order_index == 0 else overall_progress >= level.required_progress
            
            level_progress = level_progress_map.get(level.id, {'progress': 0, 'completed': False})
            
            formatted_games = []
            for game in level.games:
                game_key = f"{level.id}_{game.id}"
                game_progress = game_progress_map.get(game_key, {'high_score': 0, 'progress': 0, 'completed': False})
                
                formatted_games.append({
                    "id": game.game_identifier,
                    "name": game.name,
                    "description": game.description,
                    "userProgress": {
                        "high_score": game_progress['high_score'],
                        "progress": game_progress['progress'],
                        "completed": game_progress['completed']
                    }
                })
            
            formatted_levels.append({
                "id": level.id,
                "name": level.name,
                "description": level.description,
                "required_progress": level.required_progress,
                "progress": level_progress['progress'],
                "unlocked": unlocked,
                "games": formatted_games
            })
        
        return {
            "levels": formatted_levels,
            "overall_progress": overall_progress
        }
    
    except Exception as e:
        raise

async def update_progress(
    db: AsyncSession, 
    user_id: int, 
    level_id: int, 
    game_id: str, 
    score: int,
    hearts_lost: int = 0
) -> Dict[str, Any]:
    try:
        game_result = await db.execute(
            select(PracticeGame).where(PracticeGame.game_identifier == game_id)
        )
        game = game_result.scalars().first()
        if not game:
            raise ValueError(f"Game with identifier '{game_id}' not found")

        level_result = await db.execute(
            select(PracticeLevel).where(PracticeLevel.id == level_id)
        )
        level = level_result.scalars().first()

        difficulty_multiplier = 1
        if level and level.name:
            name_lower = level.name.lower()
            if "intermediate" in name_lower:
                difficulty_multiplier = 2
            elif "advanced" in name_lower:
                difficulty_multiplier = 3

        progress_result = await db.execute(
            select(UserPracticeProgress).where(
                UserPracticeProgress.user_id == user_id,
                UserPracticeProgress.level_id == level_id,
                UserPracticeProgress.game_id == game.id
            )
        )
        user_progress = progress_result.scalars().first()
        if not user_progress:
            user_progress = UserPracticeProgress(
                user_id=user_id,
                level_id=level_id,
                game_id=game.id,
                high_score=0,
                progress=0,
                completed=False
            )
            db.add(user_progress)

        progress_pct = min(100, score)
        user_progress.progress = max(user_progress.progress, progress_pct)
        old_high = user_progress.high_score
        if score > old_high:
            user_progress.high_score = score
        if score >= 80 and not user_progress.completed:
            user_progress.completed = True

        profile_result = await db.execute(
            select(UserProfile).where(UserProfile.user_id == user_id)
        )
        profile = profile_result.scalars().first()

        rubies_earned = 0
        if profile:
            if score < 50:
                profile.hearts = max(0, profile.hearts - 1)
            elif hearts_lost > 0:
                profile.hearts = max(0, profile.hearts - hearts_lost)

            if score >= 150:
                rubies_earned += 10 * difficulty_multiplier
            elif score >= 90:
                rubies_earned += 5 * difficulty_multiplier
            elif score >= 70:
                rubies_earned += 3 * difficulty_multiplier
            if score > old_high and old_high > 0:
                rubies_earned += 5 * difficulty_multiplier

            if rubies_earned > 0:
                profile.rubies += rubies_earned

            hearts = profile.hearts
            total_rubies = profile.rubies
        else:
            hearts = 0
            total_rubies = 0

        await db.commit()

        return {
            "level_progress": user_progress.progress,
            "game_high_score": user_progress.high_score,
            "rubies_earned": rubies_earned,
            "total_rubies": total_rubies,
            "hearts": hearts,
            "completed": user_progress.completed
        }
    except Exception:
        await db.rollback()
        raise
