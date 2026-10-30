"""
Pydantic schemas for request/response validation.
"""
import uuid
from datetime import datetime, timezone
from typing import Any, Optional

from pydantic import BaseModel, EmailStr, Field


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------

class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class UserOut(BaseModel):
    id: uuid.UUID
    email: str
    full_name: Optional[str]
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Preferences
# ---------------------------------------------------------------------------

class PreferencesIn(BaseModel):
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    preferred_categories: list[str] = []
    preferred_brands: list[str] = []
    required_features: list[str] = []
    shopping_urgency: Optional[str] = None  # urgent/flexible/waiting
    location: Optional[str] = None
    sustainability_preference: Optional[str] = None  # high/medium/low
    currency: str = "USD"


class PreferencesOut(PreferencesIn):
    id: uuid.UUID
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class ProductPriceOut(BaseModel):
    price: float
    original_price: Optional[float]
    discount_percent: Optional[float]
    currency: str
    in_stock: bool
    seller_name: Optional[str]
    seller_rating: Optional[float]
    shipping_cost: Optional[float]
    estimated_delivery_days: Optional[int]
    fetched_at: datetime
    source_url: Optional[str]

    model_config = {"from_attributes": True}


class ProductOut(BaseModel):
    id: uuid.UUID
    external_id: Optional[str]
    platform: str
    title: str
    description: Optional[str]
    brand: Optional[str]
    category: Optional[str]
    image_url: Optional[str]
    product_url: Optional[str]
    specifications: Optional[dict]
    sustainability_info: Optional[dict]
    sustainability_score: Optional[float]

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Search
# ---------------------------------------------------------------------------

class TextSearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    category: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    platforms: Optional[list[str]] = None


class SearchResponse(BaseModel):
    query: str
    search_type: str
    results: list[dict]
    count: int
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------

class AgentQueryRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    context: Optional[dict[str, Any]] = None


class AgentResponse(BaseModel):
    intent: str
    message: Optional[str] = None
    products: Optional[list[dict]] = None
    analysis: Optional[str] = None
    price_history: Optional[list[dict]] = None
    price_stats: Optional[dict] = None
    deals: Optional[list[dict]] = None
    best_deal: Optional[dict] = None
    potential_savings: Optional[float] = None
    review_flags: Optional[list[str]] = None
    confidence: str = "medium"
    timestamp: str
    source: str
    disclaimer: Optional[str] = None


# ---------------------------------------------------------------------------
# Shopping List
# ---------------------------------------------------------------------------

class ShoppingListItemIn(BaseModel):
    product_name: str = Field(min_length=1, max_length=500)
    target_price: Optional[float] = None
    quantity: int = Field(default=1, ge=1)
    notes: Optional[str] = None
    product_id: Optional[uuid.UUID] = None


class ShoppingListIn(BaseModel):
    name: str = Field(default="My Shopping List", max_length=255)
    items: list[ShoppingListItemIn] = []


class ShoppingListItemOut(ShoppingListItemIn):
    id: uuid.UUID
    added_at: datetime

    model_config = {"from_attributes": True}


class ShoppingListOut(BaseModel):
    id: uuid.UUID
    name: str
    items: list[ShoppingListItemOut]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Price Alert
# ---------------------------------------------------------------------------

class PriceAlertIn(BaseModel):
    product_id: uuid.UUID
    target_price: float = Field(gt=0)


class PriceAlertOut(PriceAlertIn):
    id: uuid.UUID
    is_active: bool
    triggered_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


# ---------------------------------------------------------------------------
# Dashboard
# ---------------------------------------------------------------------------

class DashboardResponse(BaseModel):
    trending_products: list[dict]
    trending_categories: dict[str, int]
    platform_summary: dict[str, dict]
    total_products_tracked: int
    last_updated: str
    data_disclaimer: str
