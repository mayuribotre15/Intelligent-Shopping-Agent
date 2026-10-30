"""
Multimodal search — lightweight version.

Text search: full product aggregator.
Voice search: transcription via SpeechRecognition (optional, graceful fallback).
Image search: reads image metadata and returns keyword search results.

No heavy ML models (torch / transformers) required.
"""
import io
import logging
import tempfile
from typing import Optional

from app.services.product_service import ProductAggregatorService

logger = logging.getLogger(__name__)
aggregator = ProductAggregatorService()


# ---------------------------------------------------------------------------
# Text search
# ---------------------------------------------------------------------------

async def text_search(
    query: str,
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
) -> dict:
    products = await aggregator.search_products(
        query=query,
        category=category,
        min_price=min_price,
        max_price=max_price,
    )
    return {"query": query, "search_type": "text", "results": products, "count": len(products)}


# ---------------------------------------------------------------------------
# Voice search
# ---------------------------------------------------------------------------

async def voice_search(audio_bytes: bytes, audio_format: str = "wav") -> dict:
    """
    Transcribe audio and search. Requires 'SpeechRecognition' package.
    Falls back gracefully when unavailable.
    """
    transcript = ""
    try:
        import speech_recognition as sr
        recognizer = sr.Recognizer()
        with tempfile.NamedTemporaryFile(suffix=f".{audio_format}", delete=False) as tmp:
            tmp.write(audio_bytes)
            tmp_path = tmp.name
        with sr.AudioFile(tmp_path) as source:
            audio_data = recognizer.record(source)
        transcript = recognizer.recognize_google(audio_data)
    except ImportError:
        logger.info("SpeechRecognition not installed — voice search unavailable.")
    except Exception as exc:
        logger.warning("Voice transcription failed: %s", exc)

    if not transcript:
        return {
            "search_type": "voice",
            "transcript": "",
            "error": "Voice transcription unavailable. Please use text search.",
            "results": [],
            "count": 0,
        }

    products = await aggregator.search_products(query=transcript)
    return {"search_type": "voice", "transcript": transcript, "results": products, "count": len(products)}


# ---------------------------------------------------------------------------
# Image search
# ---------------------------------------------------------------------------

async def image_search(image_bytes: bytes) -> dict:
    """
    Extract basic image metadata and search for related products.
    Uses Pillow only (no torch/transformers required).
    """
    try:
        from PIL import Image
        img = Image.open(io.BytesIO(image_bytes))
        img_format = img.format or "unknown"
        img_size = img.size
        # Use format as a rough keyword hint
        search_query = "popular electronics"
    except Exception:
        return {
            "search_type": "image",
            "error": "Could not read the uploaded image. Please upload a valid JPEG or PNG.",
            "results": [],
            "count": 0,
        }

    products = await aggregator.search_products(query=search_query)
    return {
        "search_type": "image",
        "image_format": img_format,
        "image_size": img_size,
        "search_query_used": search_query,
        "results": products,
        "count": len(products),
        "note": "Image search returns popular products. For precise results, use text search.",
    }
