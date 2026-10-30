"""
Search API – text, voice, and image-based product search.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile

from app.api.dependencies import get_optional_user
from app.multimodal.search import image_search, text_search, voice_search
from app.schemas.schemas import SearchResponse, TextSearchRequest
from app.models import User

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/search", tags=["Search"])

MAX_UPLOAD_BYTES = 10 * 1024 * 1024  # 10 MB


@router.post("/text", response_model=SearchResponse)
async def search_text(
    request: TextSearchRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Text-based product search across e-commerce platforms."""
    result = await text_search(
        query=request.query,
        category=request.category,
        min_price=request.min_price,
        max_price=request.max_price,
    )
    return SearchResponse(**result)


@router.post("/voice")
async def search_voice(
    audio: UploadFile = File(..., description="Audio file (WAV or MP3)"),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Voice-based product search – transcribes audio and searches for matching products."""
    allowed_types = {"audio/wav", "audio/mpeg", "audio/mp3", "audio/wave"}
    if audio.content_type and audio.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported audio format. Use WAV or MP3.")

    audio_bytes = await audio.read(MAX_UPLOAD_BYTES + 1)
    if len(audio_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Audio file too large (max 10 MB).")

    fmt = "wav" if "wav" in (audio.content_type or "") else "mp3"
    result = await voice_search(audio_bytes, fmt)
    return result


@router.post("/image")
async def search_image(
    image: UploadFile = File(..., description="Product image (JPEG or PNG)"),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Image-based product search – extracts features from image and finds similar products."""
    allowed_types = {"image/jpeg", "image/png", "image/webp"}
    if image.content_type and image.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Unsupported image format. Use JPEG, PNG, or WebP.")

    image_bytes = await image.read(MAX_UPLOAD_BYTES + 1)
    if len(image_bytes) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="Image too large (max 10 MB).")

    result = await image_search(image_bytes)
    return result
