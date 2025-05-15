from fastapi import Depends, HTTPException, status, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.main import async_session
from app.auth import decode_access_token
from app.models import Account, Sign
from fastapi.security import OAuth2PasswordBearer
from app.auth import verify_access_token

security = HTTPBearer()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

async def get_db():
    async with async_session() as session:
        yield session

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db)
) -> Account:
    payload = decode_access_token(token)
    if not payload or "sub" not in payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid authentication credentials"
        )
    
    user_id = payload["sub"]
    result = await db.execute(select(Account).where(Account.user_id == user_id))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="User not found"
        )
    return user

async def add_video_to_sign(db: AsyncSession, sign_id: int, video_filename: str):
    r2_url_prefix = "https://10bbfdc0897bf4e826451e6e6054ffff.r2.cloudflarestorage.com/senya-videos/"
    full_video_url = f"{r2_url_prefix}{video_filename}"

    result = await db.execute(select(Sign).where(Sign.id == sign_id))
    sign = result.scalars().first()

    if sign:
        sign.video_url = full_video_url
        await db.commit()
    else:
        raise Exception("Sign not found")

async def get_admin_user(
    current_user: Account = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized. Admin access required."
        )
    return current_user