"""
SQLAlchemy ORM models for the Intelligent Shopping AI application.
"""
import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, DateTime, Float, ForeignKey, Integer,
    String, Text, JSON, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


# ---------------------------------------------------------------------------
# User
# ---------------------------------------------------------------------------

class User(Base):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[Optional[str]] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    preferences: Mapped[Optional["UserPreference"]] = relationship("UserPreference", back_populates="user", uselist=False)
    shopping_lists: Mapped[list["ShoppingList"]] = relationship("ShoppingList", back_populates="user")
    price_alerts: Mapped[list["PriceAlert"]] = relationship("PriceAlert", back_populates="user")
    search_history: Mapped[list["SearchHistory"]] = relationship("SearchHistory", back_populates="user")


# ---------------------------------------------------------------------------
# User Preferences
# ---------------------------------------------------------------------------

class UserPreference(Base):
    __tablename__ = "user_preferences"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    budget_min: Mapped[Optional[float]] = mapped_column(Float)
    budget_max: Mapped[Optional[float]] = mapped_column(Float)
    preferred_categories: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    preferred_brands: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    required_features: Mapped[Optional[list]] = mapped_column(JSON, default=list)
    shopping_urgency: Mapped[Optional[str]] = mapped_column(String(50))  # urgent/flexible/waiting
    location: Mapped[Optional[str]] = mapped_column(String(255))
    sustainability_preference: Mapped[Optional[str]] = mapped_column(String(50))  # high/medium/low
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="preferences")


# ---------------------------------------------------------------------------
# Product
# ---------------------------------------------------------------------------

class Product(Base):
    __tablename__ = "products"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    platform: Mapped[str] = mapped_column(String(100), index=True)  # amazon/ebay/walmart/etc
    title: Mapped[str] = mapped_column(String(500))
    description: Mapped[Optional[str]] = mapped_column(Text)
    brand: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    category: Mapped[Optional[str]] = mapped_column(String(255), index=True)
    image_url: Mapped[Optional[str]] = mapped_column(String(1000))
    product_url: Mapped[Optional[str]] = mapped_column(String(1000))
    specifications: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    sustainability_info: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    sustainability_score: Mapped[Optional[float]] = mapped_column(Float)
    embedding: Mapped[Optional[list]] = mapped_column(JSON)  # vector stored as JSON
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    prices: Mapped[list["ProductPrice"]] = relationship("ProductPrice", back_populates="product", order_by="ProductPrice.fetched_at.desc()")
    reviews: Mapped[list["ProductReview"]] = relationship("ProductReview", back_populates="product")


# ---------------------------------------------------------------------------
# Product Price (historical)
# ---------------------------------------------------------------------------

class ProductPrice(Base):
    __tablename__ = "product_prices"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    price: Mapped[float] = mapped_column(Float, nullable=False)
    original_price: Mapped[Optional[float]] = mapped_column(Float)
    discount_percent: Mapped[Optional[float]] = mapped_column(Float)
    currency: Mapped[str] = mapped_column(String(10), default="USD")
    in_stock: Mapped[bool] = mapped_column(Boolean, default=True)
    seller_name: Mapped[Optional[str]] = mapped_column(String(255))
    seller_rating: Mapped[Optional[float]] = mapped_column(Float)
    shipping_cost: Mapped[Optional[float]] = mapped_column(Float)
    estimated_delivery_days: Mapped[Optional[int]] = mapped_column(Integer)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), index=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(1000))

    product: Mapped["Product"] = relationship("Product", back_populates="prices")


# ---------------------------------------------------------------------------
# Product Review
# ---------------------------------------------------------------------------

class ProductReview(Base):
    __tablename__ = "product_reviews"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"), index=True)
    platform: Mapped[str] = mapped_column(String(100))
    reviewer_id: Mapped[Optional[str]] = mapped_column(String(255))
    rating: Mapped[Optional[float]] = mapped_column(Float)
    title: Mapped[Optional[str]] = mapped_column(String(500))
    body: Mapped[Optional[str]] = mapped_column(Text)
    verified_purchase: Mapped[Optional[bool]] = mapped_column(Boolean)
    helpful_votes: Mapped[int] = mapped_column(Integer, default=0)
    review_date: Mapped[Optional[datetime]] = mapped_column(DateTime)
    suspicious_flags: Mapped[Optional[dict]] = mapped_column(JSON, default=dict)
    fetched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    product: Mapped["Product"] = relationship("Product", back_populates="reviews")


# ---------------------------------------------------------------------------
# Shopping List
# ---------------------------------------------------------------------------

class ShoppingList(Base):
    __tablename__ = "shopping_lists"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(255), default="My Shopping List")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now(), onupdate=func.now())

    user: Mapped["User"] = relationship("User", back_populates="shopping_lists")
    items: Mapped[list["ShoppingListItem"]] = relationship("ShoppingListItem", back_populates="shopping_list")


class ShoppingListItem(Base):
    __tablename__ = "shopping_list_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    shopping_list_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("shopping_lists.id", ondelete="CASCADE"))
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    product_name: Mapped[str] = mapped_column(String(500))
    target_price: Mapped[Optional[float]] = mapped_column(Float)
    quantity: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[Optional[str]] = mapped_column(Text)
    added_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    shopping_list: Mapped["ShoppingList"] = relationship("ShoppingList", back_populates="items")


# ---------------------------------------------------------------------------
# Price Alert
# ---------------------------------------------------------------------------

class PriceAlert(Base):
    __tablename__ = "price_alerts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True)
    product_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="CASCADE"))
    target_price: Mapped[float] = mapped_column(Float, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    triggered_at: Mapped[Optional[datetime]] = mapped_column(DateTime)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped["User"] = relationship("User", back_populates="price_alerts")


# ---------------------------------------------------------------------------
# Search History
# ---------------------------------------------------------------------------

class SearchHistory(Base):
    __tablename__ = "search_history"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    query: Mapped[str] = mapped_column(String(1000))
    search_type: Mapped[str] = mapped_column(String(50))  # text/voice/image
    results_count: Mapped[int] = mapped_column(Integer, default=0)
    searched_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    user: Mapped[Optional["User"]] = relationship("User", back_populates="search_history")
