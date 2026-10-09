import os
import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile

ALLOWED_MIME_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif",
    "image/jpg",
    "image/pjpeg"
}

ALLOWED_EXTENSIONS = {"jpg", "jpeg", "png", "webp", "gif"}


def init_cloudinary():
    """
    Ensures Cloudinary SDK is initialized with credentials from environment variables.
    """
    from dotenv import load_dotenv
    load_dotenv()

    cloud_name = (os.getenv("CLOUDINARY_CLOUD_NAME") or "").strip()
    api_key = (os.getenv("CLOUDINARY_API_KEY") or "").strip()
    api_secret = (os.getenv("CLOUDINARY_API_SECRET") or "").strip()

    if not cloud_name or not api_key or not api_secret:
        raise HTTPException(
            status_code=500,
            detail="Cloudinary configuration error: missing required environment variables."
        )

    cloudinary.config(
        cloud_name=cloud_name,
        api_key=api_key,
        api_secret=api_secret,
        secure=True
    )


def validate_and_read_image(file: UploadFile, max_size_mb: float = 5.0) -> bytes:
    """
    Validates uploaded file MIME type, extension, and size.
    Returns file bytes if valid, or raises HTTPException(400).
    """
    if not file.content_type or not (
        file.content_type.startswith("image/") or file.content_type in ALLOWED_MIME_TYPES
    ):
        raise HTTPException(status_code=400, detail="Uploaded file must be a valid image (JPEG, PNG, WEBP, or GIF).")

    ext = file.filename.split(".")[-1].lower() if file.filename and "." in file.filename else ""
    if ext and ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file extension '.{ext}'. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}."
        )

    contents = file.file.read()
    max_bytes = int(max_size_mb * 1024 * 1024)

    if len(contents) > max_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed limit of {max_size_mb} MB."
        )

    if len(contents) == 0:
        raise HTTPException(status_code=400, detail="Uploaded file is empty.")

    return contents


def upload_image_to_cloudinary(file_bytes: bytes, folder: str) -> dict:
    """
    Uploads file bytes to Cloudinary under the specified folder.
    Returns dict containing 'secure_url' and 'public_id'.
    """
    init_cloudinary()
    try:
        response = cloudinary.uploader.upload(
            file_bytes,
            folder=folder,
            resource_type="image"
        )
        secure_url = response.get("secure_url")
        public_id = response.get("public_id")

        if not secure_url or not public_id:
            raise ValueError("Cloudinary upload did not return required url or public_id.")

        return {
            "secure_url": secure_url,
            "public_id": public_id
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload image to Cloudinary storage: {str(e)}"
        )


def delete_cloudinary_image(public_id: str) -> bool:
    """
    Safely deletes an asset from Cloudinary using public_id.
    Logs warning on failure without throwing exceptions.
    """
    if not public_id:
        return False
    try:
        init_cloudinary()
        res = cloudinary.uploader.destroy(public_id, resource_type="image")
        result_status = res.get("result")
        return result_status in ["ok", "not_found"]
    except Exception as e:
        print(f"[Warning] Failed to delete Cloudinary asset '{public_id}': {e}")
        return False
