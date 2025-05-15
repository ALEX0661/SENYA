from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Query, Form, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models import Sign, Lesson
from app.dependencies import get_db, get_admin_user
import uuid, os
import boto3
from botocore.config import Config
from botocore.exceptions import ClientError

router = APIRouter()

def get_r2_client():
    endpoint = os.getenv('CLOUDFLARE_R2_ENDPOINT', '').split('/senya-videos')[0].rstrip('/')
    access_key = os.getenv('CLOUDFLARE_R2_ACCESS_KEY')
    secret_key = os.getenv('CLOUDFLARE_R2_SECRET_KEY')
    
    if not endpoint or not access_key or not secret_key:
        raise HTTPException(
            status_code=500, 
            detail="Server configuration error: Missing R2 credentials"
        )
    
    return boto3.client(
        's3',
        endpoint_url=endpoint,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        config=Config(signature_version='s3v4'),
        region_name='auto'
    )

@router.get("/lesson/{lesson_id}")
async def get_signs_by_lesson(
    lesson_id: int, 
    include_archived: bool = Query(False, description="Include archived signs"),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    query = select(Sign).where(Sign.lesson_id == lesson_id).order_by(Sign.id)
    
    if not include_archived:
        query = query.where(Sign.archived == False)
        
    result = await db.execute(query)
    signs = result.scalars().all()
    return signs

@router.post("/", status_code=201)
async def create_sign(
    background_tasks: BackgroundTasks,
    lesson_id: int = Form(...),
    text: str = Form(...), 
    difficulty_level: str = Form("beginner"), 
    file: UploadFile = File(...), 
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    try:
        lesson_result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
        lesson = lesson_result.scalars().first()
        if not lesson:
            raise HTTPException(status_code=404, detail="Lesson not found")
        
        file_contents = await file.read()
        if not file_contents:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
            
        file_ext = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_ext}"
        
        bucket_name = os.getenv('CLOUDFLARE_R2_BUCKET')
        if not bucket_name:
            raise HTTPException(
                status_code=500, 
                detail="Server configuration error: Missing R2 bucket name"
            )
        
        try:
            r2_client = get_r2_client()
            
            r2_client.put_object(
                Bucket=bucket_name,
                Key=unique_filename,
                Body=file_contents,
                ContentType=file.content_type or "video/mp4"
            )
            
            video_url = f"https://senya-video-server.senya-videos.workers.dev/{unique_filename}"
            
            sign = Sign(
                lesson_id=lesson_id, 
                text=text, 
                video_url=video_url, 
                difficulty_level=difficulty_level,
                archived=False
            )
            db.add(sign)
            await db.commit()
            await db.refresh(sign)
            return sign
            
        except ClientError as e:
            raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")
            
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.put("/{sign_id}")
async def update_sign(
    sign_id: int, 
    text: str = Form(...), 
    difficulty_level: str = Form(...), 
    file: UploadFile = File(None), 
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    try:
        result = await db.execute(select(Sign).where(Sign.id == sign_id))
        sign = result.scalars().first()
        if not sign:
            raise HTTPException(status_code=404, detail="Sign not found")
            
        sign.text = text
        sign.difficulty_level = difficulty_level
        
        if file and file.filename:
            file_contents = await file.read()
            file_ext = os.path.splitext(file.filename)[1]
            unique_filename = f"{uuid.uuid4()}{file_ext}"
            
            r2_client = get_r2_client()
            bucket_name = os.getenv('CLOUDFLARE_R2_BUCKET')
            
            try:
                r2_client.put_object(
                    Bucket=bucket_name,
                    Key=unique_filename,
                    Body=file_contents,
                    ContentType=file.content_type or "video/mp4"
                )
                
                sign.video_url = f"https://senya-video-server.senya-videos.workers.dev/{unique_filename}"
                
            except ClientError as e:
                raise HTTPException(status_code=500, detail=f"Failed to upload video: {str(e)}")
        
        await db.commit()
        await db.refresh(sign)
        return sign
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Error updating sign: {str(e)}")

@router.patch("/{sign_id}/archive")
async def archive_sign(
    sign_id: int, 
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    try:
        result = await db.execute(select(Sign).where(Sign.id == sign_id))
        sign = result.scalars().first()
        if not sign:
            raise HTTPException(status_code=404, detail="Sign not found")
            
        sign.archived = True
        await db.commit()
        await db.refresh(sign)
        return sign
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise
        raise HTTPException(status_code=500, detail=f"Error archiving sign: {str(e)}")