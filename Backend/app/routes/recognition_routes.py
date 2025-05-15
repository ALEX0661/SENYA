from fastapi import APIRouter, HTTPException, Request, Depends, File, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from pydantic import BaseModel
import numpy as np
import cv2
import base64
import tensorflow as tf
from app.dependencies import get_db, get_current_user
from app.models import Sign, UserProgress, Lesson

router = APIRouter()

# Global variable to store the model
model = None

class ImageRequest(BaseModel):
    image: str  # Base64 encoded image

async def load_recognition_model():
    """Load the TensorFlow model for sign recognition."""
    global model
    try:
        model = tf.keras.models.load_model('models/model.h5')
        print("✅ ASL Recognition model loaded successfully!")
        return True
    except Exception as e:
        print(f"❌ Failed to load ASL Recognition model: {e}")
        model = None
        return False

@router.get("/model-status")
async def model_status():
    """Check if the ML model is loaded."""
    global model
    is_loaded = model is not None
    return {"model_loaded": is_loaded}

@router.post("/predict")
async def predict_sign(request: ImageRequest):
    """Predict the sign from a base64 encoded image."""
    global model
    if model is None:
        try:
            await load_recognition_model()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model not loaded: {str(e)}")
    
    try:
        # Decode base64 image
        img_data = base64.b64decode(request.image)
        
        # Convert to numpy array
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Preprocess the image
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))  # Resize to match model input size
        img = img / 255.0  # Normalize
        
        # Add batch dimension
        img = np.expand_dims(img, axis=0)
        
        # Make prediction
        prediction = model.predict(img)
        
        # Get the highest probability class
        predicted_class_index = np.argmax(prediction[0])
        confidence = float(prediction[0][predicted_class_index])
        
        # Map index to letter (assuming ASL alphabet A-Z)
        letters = "abcdefghijklmnopqrstuvwxyz"
        if 0 <= predicted_class_index < len(letters):
            letter = letters[predicted_class_index]
        else:
            letter = "unknown"
        
        return {"letter": letter, "confidence": confidence}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")

@router.post("/check-sign/{sign_id}")
async def check_sign(
    sign_id: int, 
    request: ImageRequest, 
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Check if a user's sign matches the expected sign."""
    # Get the sign from the database
    sign = await db.get(Sign, sign_id)
    if not sign:
        raise HTTPException(status_code=404, detail="Sign not found")
    
    # Analyze the image
    result = await predict_sign(request)
    
    # Check if the detected letter matches the expected sign
    is_correct = result["letter"].lower() == sign.text.lower()
    
    return {
        "is_correct": is_correct,
        "confidence": result["confidence"],
        "detected_letter": result["letter"],
        "expected_letter": sign.text
    }

@router.post("/lessons/{lesson_id}/check-progress")
async def check_lesson_progress(
    lesson_id: int,
    request: ImageRequest,
    db: AsyncSession = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """Check a user's sign against their current lesson progress."""
    # Get current lesson
    result = await db.execute(select(Lesson).where(Lesson.id == lesson_id))
    lesson = result.scalars().first()
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")
    
    # Get current user progress
    result = await db.execute(
        select(UserProgress).where(
            UserProgress.user_id == current_user["id"],
            UserProgress.lesson_id == lesson_id
        )
    )
    user_progress = result.scalars().first()
    
    # If no progress record exists, create one
    if not user_progress:
        user_progress = UserProgress(
            user_id=current_user["id"],
            lesson_id=lesson_id,
            progress=0,
            completed=False,
            last_question=0
        )
        db.add(user_progress)
        await db.commit()
        await db.refresh(user_progress)
    
    # Get the current sign based on progress
    current_sign_index = user_progress.last_question
    if current_sign_index >= len(lesson.signs):
        return {"detail": "Lesson completed", "completed": True}
    
    current_sign = lesson.signs[current_sign_index]
    
    # Analyze the image
    result = await predict_sign(request)
    
    # Check if the detected letter matches the expected sign
    is_correct = result["letter"].lower() == current_sign.text.lower()
    
    # Update progress if correct with good confidence
    if is_correct and result["confidence"] > 0.70:
        user_progress.last_question += 1
        user_progress.progress = int((user_progress.last_question / len(lesson.signs)) * 100)
        
        # Check if lesson is complete
        if user_progress.last_question >= len(lesson.signs):
            user_progress.completed = True
            
            # Get user profile to update rubies
            # Note: You'll need to implement this part based on your models
            # This is a simplified example
            if hasattr(current_user, "profile"):
                current_user.profile.rubies += lesson.rubies_reward
        
        await db.commit()
    
    return {
        "is_correct": is_correct,
        "confidence": result["confidence"],
        "detected_letter": result["letter"],
        "expected_letter": current_sign.text,
        "progress": user_progress.progress,
        "completed": user_progress.completed
    }

@router.post("/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    current_user = Depends(get_current_user)
):
    """Process an uploaded image file for sign recognition."""
    global model
    if model is None:
        try:
            await load_recognition_model()
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Model not loaded: {str(e)}")
    
    try:
        contents = await file.read()
        
        # Convert to numpy array
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        # Preprocess the image
        img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
        img = cv2.resize(img, (224, 224))
        img = img / 255.0
        
        # Add batch dimension
        img = np.expand_dims(img, axis=0)
        
        # Make prediction
        prediction = model.predict(img)
        
        # Get the highest probability class
        predicted_class_index = np.argmax(prediction[0])
        confidence = float(prediction[0][predicted_class_index])
        
        # Map index to letter (assuming ASL alphabet A-Z)
        letters = "abcdefghijklmnopqrstuvwxyz"
        if 0 <= predicted_class_index < len(letters):
            letter = letters[predicted_class_index]
        else:
            letter = "unknown"
        
        return {"letter": letter, "confidence": confidence}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")