"""
Agentic AI API routes.
"""
import logging
from typing import Optional

from fastapi import APIRouter, Depends

from app.agents.shopping_agent import ShoppingAgent
from app.api.dependencies import get_optional_user
from app.models import User
from app.schemas.schemas import AgentQueryRequest

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/agent", tags=["Agentic AI"])

# One agent per request – stateless for horizontal scaling.
# For persistent sessions, use Redis-backed session store.


@router.post("/query")
async def agent_query(
    request: AgentQueryRequest,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Send a natural-language query to the Shopping Agent.
    The agent classifies intent and invokes the appropriate tools.
    """
    agent = ShoppingAgent()
    prefs = None
    if current_user and hasattr(current_user, "preferences") and current_user.preferences:
        p = current_user.preferences
        prefs = {
            "budget_min": p.budget_min,
            "budget_max": p.budget_max,
            "preferred_categories": p.preferred_categories,
            "preferred_brands": p.preferred_brands,
            "required_features": p.required_features,
            "shopping_urgency": p.shopping_urgency,
            "sustainability_preference": p.sustainability_preference,
        }

    response = await agent.process_query(
        user_message=request.message,
        user_preferences=prefs,
        context=request.context,
    )
    return response


@router.get("/compare-prices")
async def compare_prices(
    query: str,
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Compare current prices for a product across all tracked platforms."""
    agent = ShoppingAgent()
    return await agent.compare_prices_across_platforms(query)


@router.get("/dashboard")
async def get_dashboard(
    current_user: Optional[User] = Depends(get_optional_user),
):
    """Return aggregated data for the Smart Shopping Pulse dashboard."""
    agent = ShoppingAgent()
    prefs = None
    return await agent.get_dashboard_data(prefs)
