import aioboto3
import os
from datetime import datetime
from app.config import CLOUDFLARE_R2_BUCKET, CLOUDFLARE_R2_ACCESS_KEY, CLOUDFLARE_R2_SECRET_KEY

R2_ACCESS_KEY = os.getenv('CLOUDFLARE_R2_ACCESS_KEY', CLOUDFLARE_R2_ACCESS_KEY)
R2_SECRET_KEY = os.getenv('CLOUDFLARE_R2_SECRET_KEY', CLOUDFLARE_R2_SECRET_KEY)
R2_BUCKET = os.getenv('CLOUDFLARE_R2_BUCKET', CLOUDFLARE_R2_BUCKET)

R2_ENDPOINT_URL = os.getenv('CLOUDFLARE_R2_ENDPOINT', '')
if not R2_ENDPOINT_URL or R2_ENDPOINT_URL == '':
    R2_ENDPOINT_URL = "https://your-account-id.r2.cloudflarestorage.com"

if '/' in R2_ENDPOINT_URL[8:]:
    R2_ENDPOINT_URL = R2_ENDPOINT_URL.split('/', 3)[:3]
    R2_ENDPOINT_URL = '/'.join(R2_ENDPOINT_URL)

R2_ENDPOINT_URL = R2_ENDPOINT_URL.rstrip('/')

if os.getenv('R2_PUBLIC_URL_BASE'):
    PUBLIC_URL_BASE = os.getenv('R2_PUBLIC_URL_BASE')
else:
    PUBLIC_URL_BASE = f"https://{R2_BUCKET}.{R2_ENDPOINT_URL.split('//')[-1]}"

async def get_r2_client():
    if not R2_ENDPOINT_URL or not R2_ACCESS_KEY or not R2_SECRET_KEY:
        raise ValueError("Missing R2 credentials")
    
    session = aioboto3.Session()
    return session.client(
        "s3",
        aws_access_key_id=R2_ACCESS_KEY,
        aws_secret_access_key=R2_SECRET_KEY,
        endpoint_url=R2_ENDPOINT_URL,
        region_name='auto'
    )

async def upload_file_to_r2(file_obj, file_name):
    try:
        async with await get_r2_client() as client:
            await client.put_object(
                Bucket=R2_BUCKET, 
                Key=file_name, 
                Body=file_obj
            )
            
            file_url = f"{PUBLIC_URL_BASE}/{file_name}"
            return file_url
    except Exception as e:
        raise

async def generate_presigned_url_for_profile_pic(user_id, file_name):
    try:
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        file_extension = file_name.split('.')[-1] if '.' in file_name else 'jpg'
        file_path = f"profiles/{user_id}_{timestamp}.{file_extension}"
        
        async with await get_r2_client() as client:
            url = await client.generate_presigned_url(
                'put_object',
                Params={
                    'Bucket': R2_BUCKET,
                    'Key': file_path,
                    'ContentType': f'image/{file_extension}'
                },
                ExpiresIn=3600
            )
            
            file_url = f"{PUBLIC_URL_BASE}/{file_path}"
            
            return {
                "upload_url": url,
                "file_path": file_path,
                "file_url": file_url
            }
    except Exception as e:
        raise

async def get_profile_pic_url(file_path):
    try:
        async with await get_r2_client() as client:
            url = await client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': R2_BUCKET,
                    'Key': file_path
                },
                ExpiresIn=86400
            )
            
            return url
    except Exception as e:
        raise