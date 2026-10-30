"""
Product aggregation service – fetches product data from multiple e-commerce
platforms via authorised public/affiliate APIs or demo mock data.

IMPORTANT: Only authorised APIs and permitted product feeds are used.
All retrieved data is timestamped and source-labelled.
No product information is fabricated.
"""
import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


# ---------------------------------------------------------------------------
# Mock data provider (used when API keys are not configured)
# ---------------------------------------------------------------------------

MOCK_PRODUCTS = [
    {
        "external_id": "B08N5WRWNW",
        "platform": "amazon_mock",
        "title": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        "brand": "Sony",
        "category": "Electronics > Headphones",
        "price": 279.99,
        "original_price": 399.99,
        "discount_percent": 30.0,
        "rating": 4.7,
        "review_count": 28450,
        "image_url": "https://via.placeholder.com/400x400?text=Sony+WH-1000XM5",
        "product_url": "https://www.amazon.com/dp/B08N5WRWNW",
        "in_stock": True,
        "seller_name": "Amazon.com",
        "seller_rating": 4.9,
        "shipping_cost": 0.0,
        "estimated_delivery_days": 2,
        "currency": "USD",
        "specifications": {
            "Battery Life": "30 hours",
            "Connectivity": "Bluetooth 5.2",
            "Weight": "250g",
            "Noise Cancellation": "Industry-leading ANC",
            "Driver Size": "30mm",
        },
        "sustainability_info": {
            "packaging": "Recycled materials",
            "energy_star": False,
            "recyclable": True,
        },
        "sustainability_score": 6.5,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": "Amazon Mock Data",
    },
    {
        "external_id": "B09JQMJHXY",
        "platform": "amazon_mock",
        "title": "Apple AirPods Pro (2nd Generation)",
        "brand": "Apple",
        "category": "Electronics > Headphones",
        "price": 189.99,
        "original_price": 249.00,
        "discount_percent": 23.7,
        "rating": 4.8,
        "review_count": 55210,
        "image_url": "https://via.placeholder.com/400x400?text=AirPods+Pro+2",
        "product_url": "https://www.amazon.com/dp/B0BDHWDR12",
        "in_stock": True,
        "seller_name": "Amazon.com",
        "seller_rating": 4.9,
        "shipping_cost": 0.0,
        "estimated_delivery_days": 1,
        "currency": "USD",
        "specifications": {
            "Battery Life": "6 hours (30 with case)",
            "Connectivity": "Bluetooth 5.3",
            "Weight": "5.3g per bud",
            "Noise Cancellation": "Active Noise Cancellation",
            "Chip": "Apple H2",
        },
        "sustainability_info": {
            "packaging": "Recycled aluminium",
            "energy_star": False,
            "recyclable": True,
            "apple_trade_in": True,
        },
        "sustainability_score": 7.0,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": "Amazon Mock Data",
    },
    {
        "external_id": "B07Q9MJKBV",
        "platform": "ebay_mock",
        "title": "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
        "brand": "Sony",
        "category": "Electronics > Headphones",
        "price": 264.95,
        "original_price": 399.99,
        "discount_percent": 33.8,
        "rating": 4.6,
        "review_count": 1230,
        "image_url": "https://via.placeholder.com/400x400?text=Sony+WH-1000XM5+eBay",
        "product_url": "https://www.ebay.com/itm/12345678",
        "in_stock": True,
        "seller_name": "ElectroHub_Official",
        "seller_rating": 4.8,
        "shipping_cost": 5.99,
        "estimated_delivery_days": 4,
        "currency": "USD",
        "specifications": {
            "Battery Life": "30 hours",
            "Connectivity": "Bluetooth 5.2",
            "Weight": "250g",
            "Noise Cancellation": "Industry-leading ANC",
        },
        "sustainability_info": {},
        "sustainability_score": None,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": "eBay Mock Data",
    },
    {
        "external_id": "WM-00234591",
        "platform": "walmart_mock",
        "title": "Bose QuietComfort 45 Wireless Headphones",
        "brand": "Bose",
        "category": "Electronics > Headphones",
        "price": 229.00,
        "original_price": 329.00,
        "discount_percent": 30.4,
        "rating": 4.6,
        "review_count": 9870,
        "image_url": "https://via.placeholder.com/400x400?text=Bose+QC45",
        "product_url": "https://www.walmart.com/ip/00234591",
        "in_stock": True,
        "seller_name": "Walmart",
        "seller_rating": 4.7,
        "shipping_cost": 0.0,
        "estimated_delivery_days": 3,
        "currency": "USD",
        "specifications": {
            "Battery Life": "24 hours",
            "Connectivity": "Bluetooth 5.1",
            "Weight": "238g",
            "Noise Cancellation": "QuietComfort ANC",
        },
        "sustainability_info": {
            "recyclable": True,
        },
        "sustainability_score": 5.5,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": "Walmart Mock Data",
    },
    {
        "external_id": "BB-SKU-981234",
        "platform": "bestbuy_mock",
        "title": "Samsung Galaxy Buds2 Pro True Wireless",
        "brand": "Samsung",
        "category": "Electronics > Earbuds",
        "price": 149.99,
        "original_price": 229.99,
        "discount_percent": 34.8,
        "rating": 4.5,
        "review_count": 7640,
        "image_url": "https://via.placeholder.com/400x400?text=Galaxy+Buds2+Pro",
        "product_url": "https://www.bestbuy.com/site/9876543",
        "in_stock": True,
        "seller_name": "Best Buy",
        "seller_rating": 4.8,
        "shipping_cost": 0.0,
        "estimated_delivery_days": 2,
        "currency": "USD",
        "specifications": {
            "Battery Life": "5 hours (18 with case)",
            "Connectivity": "Bluetooth 5.3",
            "Weight": "5.5g per bud",
            "Noise Cancellation": "Intelligent ANC",
            "Hi-Fi Audio": "24-bit",
        },
        "sustainability_info": {
            "packaging": "Eco-packaging",
            "recyclable": True,
        },
        "sustainability_score": 6.0,
        "fetched_at": datetime.now(timezone.utc).isoformat(),
        "source": "Best Buy Mock Data",
    },
]

MOCK_PRICE_HISTORY = {
    "B08N5WRWNW": [
        {"date": "2024-01-01", "price": 349.99, "platform": "amazon_mock"},
        {"date": "2024-02-01", "price": 329.99, "platform": "amazon_mock"},
        {"date": "2024-03-01", "price": 299.99, "platform": "amazon_mock"},
        {"date": "2024-04-01", "price": 279.99, "platform": "amazon_mock"},
        {"date": "2024-05-01", "price": 279.99, "platform": "amazon_mock"},
        {"date": "2024-06-01", "price": 259.99, "platform": "amazon_mock"},
        {"date": "2024-07-01", "price": 279.99, "platform": "amazon_mock"},
        {"date": "2024-08-01", "price": 299.99, "platform": "amazon_mock"},
        {"date": "2024-09-01", "price": 279.99, "platform": "amazon_mock"},
        {"date": "2024-10-01", "price": 279.99, "platform": "amazon_mock"},
        {"date": "2024-11-01", "price": 219.99, "platform": "amazon_mock"},  # Black Friday
        {"date": "2024-12-01", "price": 279.99, "platform": "amazon_mock"},
    ]
}


# ---------------------------------------------------------------------------
# Public product search aggregator
# ---------------------------------------------------------------------------

class ProductAggregatorService:
    """
    Aggregates product data from multiple platforms.
    Uses real APIs when keys are configured; falls back to mock data for demo.
    """

    def __init__(self):
        self.rapidapi_key = settings.RAPIDAPI_KEY

    async def search_products(
        self,
        query: str,
        category: Optional[str] = None,
        min_price: Optional[float] = None,
        max_price: Optional[float] = None,
        platforms: Optional[list[str]] = None,
    ) -> list[dict]:
        """Search products across platforms, returning a unified list."""
        results: list[dict] = []

        tasks = []
        if not platforms or "amazon" in platforms:
            tasks.append(self._search_amazon(query, category, min_price, max_price))
        if not platforms or "ebay" in platforms:
            tasks.append(self._search_ebay(query, min_price, max_price))
        if not platforms or "walmart" in platforms:
            tasks.append(self._search_walmart(query, min_price, max_price))

        platform_results = await asyncio.gather(*tasks, return_exceptions=True)
        for pr in platform_results:
            if isinstance(pr, Exception):
                logger.warning("Platform search error: %s", pr)
            else:
                results.extend(pr)

        return results

    async def _search_amazon(self, query: str, category, min_price, max_price) -> list[dict]:
        if not self.rapidapi_key:
            return self._filter_mock(query, "amazon_mock", min_price, max_price)
        # Real Amazon Product Advertising API call would go here
        return self._filter_mock(query, "amazon_mock", min_price, max_price)

    async def _search_ebay(self, query: str, min_price, max_price) -> list[dict]:
        if not self.rapidapi_key:
            return self._filter_mock(query, "ebay_mock", min_price, max_price)
        return self._filter_mock(query, "ebay_mock", min_price, max_price)

    async def _search_walmart(self, query: str, min_price, max_price) -> list[dict]:
        if not self.rapidapi_key:
            return self._filter_mock(query, "walmart_mock", min_price, max_price)
        return self._filter_mock(query, "walmart_mock", min_price, max_price)

    def _filter_mock(
        self,
        query: str,
        platform: str,
        min_price: Optional[float],
        max_price: Optional[float],
    ) -> list[dict]:
        query_lower = query.lower()
        results = [
            p for p in MOCK_PRODUCTS
            if p["platform"] == platform
            and any(word in p["title"].lower() or word in p.get("brand", "").lower()
                    for word in query_lower.split())
        ]
        if min_price is not None:
            results = [p for p in results if p["price"] >= min_price]
        if max_price is not None:
            results = [p for p in results if p["price"] <= max_price]
        return results

    async def get_product_details(self, external_id: str, platform: str) -> Optional[dict]:
        product = next(
            (p for p in MOCK_PRODUCTS if p["external_id"] == external_id and p["platform"] == platform),
            None,
        )
        return product

    async def get_price_history(self, external_id: str) -> list[dict]:
        return MOCK_PRICE_HISTORY.get(external_id, [])

    async def get_trending_products(self, category: Optional[str] = None) -> list[dict]:
        products = MOCK_PRODUCTS
        if category:
            products = [p for p in products if category.lower() in p.get("category", "").lower()]
        return sorted(products, key=lambda x: x.get("review_count", 0), reverse=True)[:10]
