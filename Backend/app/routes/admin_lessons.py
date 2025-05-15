from fastapi import APIRouter, Depends, HTTPException, status, Form, Query, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models import Lesson, Unit, Sign
from app.dependencies import get_db, get_admin_user
from app.schemas import LessonSchema, LessonImageUploadResponse
from typing import List, Optional
import os
import uuid
from pathlib import Path

router = APIRouter()

@router.get("/unit/{unit_id}", response_model=List[LessonSchema])
async def get_lessons_by_unit(
    unit_id: int,
    include_archived: bool = Query(False, description="Include archived lessons"),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    query = select(Lesson).where(Lesson.unit_id == unit_id).order_by(Lesson.order_index)
    
    if not include_archived:
        query = query.where(Lesson.archived == False)
        
    result = await db.execute(query)
    lessons = result.scalars().all()
    return lessons

@router.post("/", response_model=LessonSchema, status_code=status.HTTP_201_CREATED)
async def create_lesson(
    unit_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    rubies_reward: int = Form(0),
    order_index: int = Form(...),
    image: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    unit_result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = unit_result.scalars().first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    image_url = None
    if image:
        # Create a directory for uploads if it doesn't exist
        upload_dir = Path("static/lessons")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate a unique filename
        file_extension = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save the uploaded file
        with open(file_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        # Set the image URL relative to the static directory
        image_url = f"/static/lessons/{unique_filename}"
    
    new_lesson = Lesson(
        unit_id=unit_id,
        title=title,
        description=description,
        rubies_reward=rubies_reward,
        order_index=order_index,
        image_url=image_url,
        archived=False
    )
    db.add(new_lesson)
    await db.commit()
    await db.refresh(new_lesson)
    return new_lesson

@router.put("/{lesson_id}", response_model=LessonSchema)
async def update_lesson(
    lesson_id: int,
    unit_id: int = Form(...),
    title: str = Form(...),
    description: str = Form(None),
    rubies_reward: int = Form(0),
    order_index: int = Form(...),
    image: UploadFile = File(None),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    if image:
        # Remove old image if it exists
        if lesson.image_url:
            old_image_path = Path(f".{lesson.image_url}")
            if old_image_path.exists():
                old_image_path.unlink()
        
        # Create a directory for uploads if it doesn't exist
        upload_dir = Path("static/lessons")
        upload_dir.mkdir(parents=True, exist_ok=True)
        
        # Generate a unique filename
        file_extension = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
        unique_filename = f"{uuid.uuid4()}{file_extension}"
        file_path = upload_dir / unique_filename
        
        # Save the uploaded file
        with open(file_path, "wb") as f:
            content = await image.read()
            f.write(content)
        
        # Update the image URL
        lesson.image_url = f"/static/lessons/{unique_filename}"
    
    lesson.unit_id = unit_id
    lesson.title = title
    lesson.description = description
    lesson.rubies_reward = rubies_reward
    lesson.order_index = order_index
    
    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.delete("/{lesson_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Remove image if it exists
    if lesson.image_url:
        image_path = Path(f".{lesson.image_url}")
        if image_path.exists():
            image_path.unlink()
    
    # Remove associated signs
    signs_result = await db.execute(select(Sign).where(Sign.lesson_id == lesson_id))
    signs = signs_result.scalars().all()
    for sign in signs:
        await db.delete(sign)
    
    # Delete the lesson
    await db.delete(lesson)
    await db.commit()
    return

@router.patch("/{lesson_id}/archive", response_model=LessonSchema)
async def archive_lesson(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lesson.archived = True

    await db.execute(
        update(Sign)
        .where(Sign.lesson_id == lesson_id)
        .values(archived=True)
    )

    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.patch("/{lesson_id}/image", response_model=LessonSchema)
async def update_lesson_image(
    lesson_id: int,
    image: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Remove old image if it exists
    if lesson.image_url:
        old_image_path = Path(f".{lesson.image_url}")
        if old_image_path.exists():
            old_image_path.unlink()
    
    # Create a directory for uploads if it doesn't exist
    upload_dir = Path("static/lessons")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate a unique filename
    file_extension = os.path.splitext(image.filename)[1] if image.filename else ".jpg"
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    file_path = upload_dir / unique_filename
    
    # Save the uploaded file
    with open(file_path, "wb") as f:
        content = await image.read()
        f.write(content)
    
    # Update the image URL
    lesson.image_url = f"/static/lessons/{unique_filename}"
    await db.commit()
    await db.refresh(lesson)
    return lesson

@router.delete("/{lesson_id}/image", response_model=LessonSchema)
async def delete_lesson_image(
    lesson_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Remove image if it exists
    if lesson.image_url:
        image_path = Path(f".{lesson.image_url}")
        if image_path.exists():
            image_path.unlink()
        
        # Clear the image URL
        lesson.image_url = None
        await db.commit()
        await db.refresh(lesson)
    
    return lesson

@router.post("/presign-upload", response_model=LessonImageUploadResponse)
async def presign_upload(
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    """Generate a presigned URL for image upload"""
    # Create a directory for uploads if it doesn't exist
    upload_dir = Path("static/lessons")
    upload_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate a unique filename
    unique_filename = f"{uuid.uuid4()}.jpg"
    file_path = f"lessons/{unique_filename}"
    file_url = f"/static/lessons/{unique_filename}"
    
    # For a real application, this would generate an AWS S3 presigned URL
    # For simplicity, we're just returning file paths
    return { 
        "upload_url": f"/api/admin/lessons/upload/{unique_filename}",
        "file_path": file_path,
        "file_url": file_url
    }