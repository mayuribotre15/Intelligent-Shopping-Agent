"""
Agentic AI orchestration layer.

This module implements the agentic reasoning loop that:
1. Interprets user intent
2. Calls appropriate tools (price comparison, review analysis, etc.)
3. Synthesises multi-step results into a final recommendation
4. Maintains conversation context

All predictions are presented with explicit uncertainty statements.
No data is fabricated.
"""
import logging
from datetime import datetime, timezone
from typing import Any, Optional

from app.services.watsonx_service import (
    analyse_product_comparison,
    analyse_reviews,
    chat_with_agent,
    generate_shopping_recommendation,
    generate_sustainability_insights,
    predict_price_trend,
)
from app.services.product_service import ProductAggregatorService

logger = logging.getLogger(__name__)
aggregator = ProductAggregatorService()


# ---------------------------------------------------------------------------
# Agent Actions / Tool Definitions
# ---------------------------------------------------------------------------

AGENT_TOOLS = {
    "search_products": "Search for products across e-commerce platforms",
    "compare_products": "Compare multiple products on price, quality, and features",
    "analyse_reviews": "Summarise and flag patterns in customer reviews",
    "price_trend": "Analyse historical price data and forecast trends",
    "sustainability": "Provide sustainability insights from product data",
    "shopping_recommendation": "Generate personalised product recommendations",
    "price_comparison": "Find the best current price across platforms",
}


class ShoppingAgent:
    """
    Agentic AI layer that orchestrates multi-step shopping research tasks.
    """

    def __init__(self):
        self.conversation_history: list[dict] = []

    # ------------------------------------------------------------------
    # Entry point
    # ------------------------------------------------------------------

    async def process_query(
        self,
        user_message: str,
        user_preferences: Optional[dict] = None,
        context: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Main entry: interpret user query, execute tools, return structured response.
        """
        intent = self._classify_intent(user_message)
        self.conversation_history.append({"role": "user", "content": user_message})

        response_data: dict[str, Any] = {
            "intent": intent,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "source": "Intelligent Shopping AI – Llama 3.3 70B via IBM watsonx.ai",
            "confidence": "medium",
        }

        try:
            if intent == "search":
                response_data.update(await self._handle_search(user_message, user_preferences))
            elif intent == "compare":
                response_data.update(await self._handle_compare(user_message, user_preferences, context))
            elif intent == "price_analysis":
                response_data.update(await self._handle_price_analysis(context))
            elif intent == "review_analysis":
                response_data.update(await self._handle_review_analysis(context))
            elif intent == "sustainability":
                response_data.update(await self._handle_sustainability(context))
            elif intent == "recommendation":
                response_data.update(await self._handle_recommendation(user_preferences, context))
            else:
                # General chat
                reply = await chat_with_agent(self.conversation_history[:-1], user_message)
                response_data["message"] = reply
                response_data["intent"] = "chat"

            self.conversation_history.append({
                "role": "assistant",
                "content": response_data.get("message", str(response_data.get("analysis", ""))),
            })
        except Exception as exc:
            logger.error("Agent processing error: %s", exc)
            response_data["error"] = "An error occurred during AI analysis. Please try again."
            response_data["message"] = "I encountered an issue processing your request. Please try again."

        return response_data

    # ------------------------------------------------------------------
    # Intent classification
    # ------------------------------------------------------------------

    def _classify_intent(self, message: str) -> str:
        message_lower = message.lower()
        # Order matters: more specific patterns first to avoid substring collisions
        if any(w in message_lower for w in ["compare", " vs ", "versus", "difference between", "better than"]):
            return "compare"
        if any(w in message_lower for w in ["price history", "buy now", "wait for", "price trend", "discount when"]):
            return "price_analysis"
        if any(w in message_lower for w in ["review", "feedback", "customers say", "customer opinion", "customer feedback", "analyse review", "what do people say"]):
            return "review_analysis"
        if any(w in message_lower for w in ["sustainable", "sustainability", "eco-friendly", "environment", "green product", "carbon footprint", "recyclable"]):
            return "sustainability"
        if any(w in message_lower for w in ["recommend", "suggest", "best for me", "what should i", "help me find", "best option for"]):
            return "recommendation"
        if any(w in message_lower for w in ["search", "find", "show", "look for"]):
            return "search"
        return "chat"

    # ------------------------------------------------------------------
    # Tool handlers
    # ------------------------------------------------------------------

    async def _handle_search(
        self,
        query: str,
        user_preferences: Optional[dict],
    ) -> dict:
        prefs = user_preferences or {}
        products = await aggregator.search_products(
            query=query,
            min_price=prefs.get("budget_min"),
            max_price=prefs.get("budget_max"),
        )
        if not products:
            return {
                "message": "No products found matching your query. Try broadening your search terms.",
                "products": [],
            }

        recommendation_text = await generate_shopping_recommendation(
            user_preferences=prefs,
            candidate_products=products[:10],
        )
        return {
            "message": recommendation_text,
            "products": products,
            "total_found": len(products),
        }

    async def _handle_compare(
        self,
        query: str,
        user_preferences: Optional[dict],
        context: Optional[dict],
    ) -> dict:
        products = context.get("products") if context else None
        if not products:
            products = await aggregator.search_products(query=query)

        if len(products) < 2:
            return {"message": "Need at least 2 products to compare.", "products": products}

        comparison_text = await analyse_product_comparison(products[:5])
        best_price = min(products, key=lambda p: p.get("price", float("inf")))
        best_rated = max(products, key=lambda p: p.get("rating", 0))

        return {
            "message": comparison_text,
            "products": products[:5],
            "best_price_product": best_price,
            "best_rated_product": best_rated,
            "comparison_dimensions": ["price", "rating", "sustainability_score", "shipping_cost"],
        }

    async def _handle_price_analysis(self, context: Optional[dict]) -> dict:
        if not context or "external_id" not in context:
            return {"message": "Please select a specific product for price trend analysis."}

        history = await aggregator.get_price_history(context["external_id"])
        if not history:
            return {
                "message": "No historical price data is available for this product at this time.",
                "price_history": [],
            }

        analysis = await predict_price_trend(history, context.get("product_title", "Selected Product"))
        avg_price = sum(h["price"] for h in history) / len(history)
        current_price = history[-1]["price"] if history else None
        min_price = min(h["price"] for h in history)
        max_price_hist = max(h["price"] for h in history)

        return {
            "message": analysis,
            "price_history": history,
            "price_stats": {
                "average": round(avg_price, 2),
                "current": current_price,
                "historical_min": min_price,
                "historical_max": max_price_hist,
                "data_source": "Mock historical data",
                "data_disclaimer": "Price forecasts are estimates based on observed patterns and carry inherent uncertainty.",
            },
        }

    async def _handle_review_analysis(self, context: Optional[dict]) -> dict:
        if not context or "reviews" not in context:
            return {"message": "No reviews provided for analysis."}

        reviews = context["reviews"]
        product_title = context.get("product_title", "Selected Product")
        analysis = await analyse_reviews(reviews, product_title)

        # Basic statistical review flags (pattern detection, not fake-review claims)
        flags = self._detect_review_patterns(reviews)

        return {
            "message": analysis,
            "review_flags": flags,
            "review_disclaimer": (
                "Review pattern analysis highlights statistical anomalies for informational purposes only. "
                "Flagged patterns do not confirm that reviews are inauthentic."
            ),
        }

    def _detect_review_patterns(self, reviews: list[dict]) -> list[str]:
        flags = []
        if not reviews:
            return flags

        ratings = [r.get("rating") for r in reviews if r.get("rating")]
        if ratings:
            avg = sum(ratings) / len(ratings)
            five_star_pct = sum(1 for r in ratings if r == 5) / len(ratings) * 100
            if five_star_pct > 80:
                flags.append(f"Unusually high proportion of 5-star ratings ({five_star_pct:.0f}%)")

        # Check for very short reviews
        short_reviews = [r for r in reviews if r.get("body") and len(r["body"]) < 20]
        if len(short_reviews) / max(len(reviews), 1) > 0.3:
            flags.append("High proportion of very short reviews (under 20 characters)")

        return flags

    async def _handle_sustainability(self, context: Optional[dict]) -> dict:
        if not context or "product" not in context:
            return {"message": "No product data provided for sustainability analysis."}

        product = context["product"]
        insights = await generate_sustainability_insights(product)
        return {
            "message": insights,
            "sustainability_disclaimer": (
                "Sustainability scores are derived from available product data only. "
                "Unverified claims from sellers are noted but not confirmed."
            ),
        }

    async def _handle_recommendation(
        self,
        user_preferences: Optional[dict],
        context: Optional[dict],
    ) -> dict:
        products = (context or {}).get("products") or await aggregator.get_trending_products()
        prefs = user_preferences or {}

        text = await generate_shopping_recommendation(
            user_preferences=prefs,
            candidate_products=products[:10],
        )
        return {
            "message": text,
            "products": products[:10],
        }

    # ------------------------------------------------------------------
    # Price comparison across platforms
    # ------------------------------------------------------------------

    async def compare_prices_across_platforms(self, product_query: str) -> dict:
        """Identify the best available deal across all platforms."""
        all_products = await aggregator.search_products(query=product_query)
        if not all_products:
            return {"message": "No products found.", "deals": []}

        deals = sorted(all_products, key=lambda p: p.get("price", float("inf")))
        best_deal = deals[0] if deals else None

        # Calculate potential savings vs. highest price
        if len(deals) > 1:
            highest = max(p["price"] for p in deals)
            savings = round(highest - deals[0]["price"], 2) if best_deal else 0
        else:
            savings = 0

        return {
            "deals": deals,
            "best_deal": best_deal,
            "potential_savings": savings,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "disclaimer": "Prices shown are from the most recent data fetch. Always verify on the retailer's website before purchasing.",
        }

    # ------------------------------------------------------------------
    # Dashboard data
    # ------------------------------------------------------------------

    async def get_dashboard_data(self, user_preferences: Optional[dict] = None) -> dict:
        """Aggregate data for the Smart Shopping Pulse dashboard."""
        trending = await aggregator.get_trending_products()

        # Group by category
        categories: dict[str, int] = {}
        for p in trending:
            cat = p.get("category", "Other").split(" > ")[0]
            categories[cat] = categories.get(cat, 0) + 1

        # Platform price comparison
        platform_summary: dict[str, dict] = {}
        for p in trending:
            plat = p.get("platform", "unknown")
            if plat not in platform_summary:
                platform_summary[plat] = {"count": 0, "avg_price": 0, "total": 0}
            platform_summary[plat]["count"] += 1
            platform_summary[plat]["total"] += p.get("price", 0)
            platform_summary[plat]["avg_price"] = round(
                platform_summary[plat]["total"] / platform_summary[plat]["count"], 2
            )

        return {
            "trending_products": trending[:8],
            "trending_categories": categories,
            "platform_summary": platform_summary,
            "total_products_tracked": len(trending),
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "data_disclaimer": "Dashboard data is sourced from permitted product feeds and updated periodically.",
        }
