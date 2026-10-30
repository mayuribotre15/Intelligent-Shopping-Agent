"""
Products API – product details, price history, reviews, and comparisons.
"""
from typing import Optional

from fastapi import APIRouter, Query

from app.services.product_service import ProductAggregatorService
from app.services.watsonx_service import (
    analyse_product_comparison,
    analyse_reviews,
    generate_sustainability_insights,
    predict_price_trend,
)

router = APIRouter(prefix="/products", tags=["Products"])
aggregator = ProductAggregatorService()


@router.get("/search")
async def search_products(
    q: str = Query(..., min_length=1, description="Search query"),
    category: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    platforms: Optional[str] = Query(None, description="Comma-separated platform names"),
):
    """Search for products across platforms (query-param version)."""
    platform_list = platforms.split(",") if platforms else None
    results = await aggregator.search_products(
        query=q,
        category=category,
        min_price=min_price,
        max_price=max_price,
        platforms=platform_list,
    )
    return {
        "query": q,
        "results": results,
        "count": len(results),
        "disclaimer": "Prices and availability are sourced from permitted product feeds. Always verify before purchase.",
    }


@router.get("/trending")
async def get_trending(category: Optional[str] = None):
    """Return trending products, optionally filtered by category."""
    products = await aggregator.get_trending_products(category=category)
    return {"products": products, "count": len(products)}


@router.get("/{external_id}/price-history")
async def get_price_history(external_id: str, platform: Optional[str] = None):
    """Return historical price data for a specific product."""
    history = await aggregator.get_price_history(external_id)
    return {
        "external_id": external_id,
        "price_history": history,
        "data_source": "Historical price database",
        "disclaimer": "Historical price data may be incomplete. Price forecasts carry inherent uncertainty.",
    }


@router.post("/compare")
async def compare_products(product_ids: list[str]):
    """
    Compare a list of products (by external_id) using AI analysis.
    Returns structured comparison with AI-generated insights.
    """
    products = []
    for pid in product_ids[:5]:
        p = await aggregator.get_product_details(pid, "amazon_mock")
        if not p:
            p = await aggregator.get_product_details(pid, "ebay_mock")
        if p:
            products.append(p)

    if len(products) < 2:
        return {"error": "Need at least 2 valid products to compare."}

    analysis = await analyse_product_comparison(products)
    return {
        "products": products,
        "ai_analysis": analysis,
        "disclaimer": "AI analysis is based on available product data. Verify key specifications before purchase.",
    }


@router.get("/{external_id}/reviews/analysis")
async def analyse_product_reviews(external_id: str, product_title: str = "Product"):
    """AI-powered review analysis with pattern detection."""
    # In production, fetch reviews from DB; using mock here
    mock_reviews = [
        {"rating": 5, "title": "Excellent!", "body": "Best headphones I've ever owned. Great ANC.", "verified_purchase": True},
        {"rating": 4, "title": "Good but pricey", "body": "Sound quality is superb but the price is a bit high.", "verified_purchase": True},
        {"rating": 5, "title": "Amazing product", "body": "Highly recommend. ANC is incredible.", "verified_purchase": False},
        {"rating": 3, "title": "Decent", "body": "Ok", "verified_purchase": True},
        {"rating": 5, "title": "Love it", "body": "Perfect for travel. Very comfortable.", "verified_purchase": True},
        {"rating": 2, "title": "Disappointed", "body": "Battery drains faster than advertised.", "verified_purchase": True},
    ]
    try:
        analysis = await analyse_reviews(mock_reviews, product_title)
    except Exception:
        analysis = "AI review analysis is temporarily unavailable. Please try again later."
    return {
        "product_id": external_id,
        "review_analysis": analysis,
        "review_count_analysed": len(mock_reviews),
        "disclaimer": (
            "Review pattern analysis is for informational purposes only. "
            "Flagged patterns do not confirm inauthentic reviews."
        ),
    }


@router.get("/{external_id}/sustainability")
async def get_sustainability_insights(external_id: str, platform: str = "amazon_mock"):
    """AI-powered sustainability analysis for a product."""
    product = await aggregator.get_product_details(external_id, platform)
    if not product:
        return {"error": "Product not found."}

    insights = await generate_sustainability_insights(product)
    return {
        "product_id": external_id,
        "sustainability_insights": insights,
        "disclaimer": (
            "Sustainability data is sourced from available product information. "
            "Unverified claims are noted but not confirmed."
        ),
    }


@router.get("/{external_id}/price-trend-analysis")
async def price_trend_analysis(external_id: str, product_title: str = "Product"):
    """AI-powered price trend analysis with buy-now-or-wait recommendation."""
    history = await aggregator.get_price_history(external_id)
    if not history:
        return {"message": "No historical price data available for this product."}

    analysis = await predict_price_trend(history, product_title)
    return {
        "product_id": external_id,
        "trend_analysis": analysis,
        "price_history": history,
        "disclaimer": "Price forecasts are based on observed historical patterns and carry inherent uncertainty. This is not financial advice.",
    }
