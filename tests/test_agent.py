"""
Unit tests for the ShoppingAgent agentic AI layer.
"""
import pytest
from unittest.mock import AsyncMock, patch
from app.agents.shopping_agent import ShoppingAgent


@pytest.fixture
def agent():
    return ShoppingAgent()


def test_intent_classification_compare(agent):
    assert agent._classify_intent("compare Sony vs Bose headphones") == "compare"
    assert agent._classify_intent("what is the difference between these two") == "compare"


def test_intent_classification_search(agent):
    assert agent._classify_intent("find me wireless earbuds") == "search"
    assert agent._classify_intent("show noise cancelling headphones") == "search"


def test_intent_classification_price_analysis(agent):
    assert agent._classify_intent("should I buy now or wait for a discount") == "price_analysis"
    assert agent._classify_intent("price history for this product") == "price_analysis"


def test_intent_classification_reviews(agent):
    assert agent._classify_intent("customers say this product is great") == "review_analysis"
    assert agent._classify_intent("analyse review for this product") == "review_analysis"


def test_intent_classification_sustainability(agent):
    assert agent._classify_intent("is this product eco-friendly") == "sustainability"
    assert agent._classify_intent("sustainability score for this item") == "sustainability"


def test_intent_classification_recommendation(agent):
    assert agent._classify_intent("recommend the best headphones for me") == "recommendation"
    assert agent._classify_intent("what should i buy for music") == "recommendation"


def test_intent_classification_chat(agent):
    assert agent._classify_intent("hello how are you") == "chat"


def test_review_pattern_detection_high_five_star(agent):
    reviews = [{"rating": 5} for _ in range(9)] + [{"rating": 3}]
    flags = agent._detect_review_patterns(reviews)
    assert any("5-star" in f.lower() or "five-star" in f.lower() or "5 star" in f.lower()
               or "proportion" in f.lower() for f in flags)


def test_review_pattern_detection_short_reviews(agent):
    reviews = [{"rating": 5, "body": "ok"} for _ in range(5)]
    flags = agent._detect_review_patterns(reviews)
    assert any("short" in f.lower() for f in flags)


def test_review_pattern_detection_clean(agent):
    reviews = [
        {"rating": 4, "body": "Great product, noise cancellation is excellent and battery lasts well."},
        {"rating": 3, "body": "Decent but overpriced compared to alternatives."},
        {"rating": 5, "body": "Best headphones I have ever owned. Highly recommend for travel."},
    ]
    flags = agent._detect_review_patterns(reviews)
    # Clean reviews should have no flags
    assert len(flags) == 0


def test_review_pattern_no_confirmed_fake_claim(agent):
    """Flags must not claim reviews are fake – only note patterns."""
    reviews = [{"rating": 5} for _ in range(10)]
    flags = agent._detect_review_patterns(reviews)
    for flag in flags:
        assert "fake" not in flag.lower(), "Must not claim reviews are fake"
        assert "fraudulent" not in flag.lower()
        assert "inauthentic" not in flag.lower()


@pytest.mark.anyio
async def test_dashboard_includes_disclaimer(agent):
    data = await agent.get_dashboard_data()
    assert "data_disclaimer" in data
    assert "last_updated" in data


@pytest.mark.anyio
async def test_price_comparison_includes_disclaimer(agent):
    data = await agent.compare_prices_across_platforms("headphones")
    assert "disclaimer" in data
    assert "fetched_at" in data
