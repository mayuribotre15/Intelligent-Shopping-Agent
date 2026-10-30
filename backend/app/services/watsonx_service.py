"""
IBM watsonx.ai service – Llama 3.3 70B Instruct integration.

Responsible for:
- Text generation (chat, reasoning, summarisation)
- Product comparison
- Review analysis
- Agentic tool-call orchestration
"""
import logging
from typing import Any

import httpx
from app.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

# ---------------------------------------------------------------------------
# IAM token cache (simple in-process; use Redis in multi-instance deploys)
# ---------------------------------------------------------------------------
_iam_token_cache: dict[str, Any] = {}


async def _get_iam_token() -> str:
    """Fetch or return a cached IBM Cloud IAM access token."""
    import time

    if _iam_token_cache.get("token") and time.time() < _iam_token_cache.get("expires_at", 0) - 60:
        return _iam_token_cache["token"]

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(
            "https://iam.cloud.ibm.com/identity/token",
            data={
                "grant_type": "urn:ibm:params:oauth:grant-type:apikey",
                "apikey": settings.WATSONX_API_KEY,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        resp.raise_for_status()
        data = resp.json()
        _iam_token_cache["token"] = data["access_token"]
        _iam_token_cache["expires_at"] = time.time() + data.get("expires_in", 3600)
        return _iam_token_cache["token"]


# ---------------------------------------------------------------------------
# Core generation call
# ---------------------------------------------------------------------------

async def generate_text(
    prompt: str,
    system_prompt: str = "",
    max_new_tokens: int = 1500,
    temperature: float = 0.3,
    top_p: float = 0.9,
) -> str:
    """
    Call the watsonx.ai text generation endpoint with Llama 3.3 70B Instruct.
    Returns the generated text string.
    """
    token = await _get_iam_token()
    url = f"{settings.WATSONX_URL}/ml/v1/text/generation?version=2024-05-31"

    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model_id": settings.WATSONX_MODEL_ID,
        "project_id": settings.WATSONX_PROJECT_ID,
        "messages": messages,
        "parameters": {
            "max_new_tokens": max_new_tokens,
            "temperature": temperature,
            "top_p": top_p,
            "decoding_method": "sample",
            "repetition_penalty": 1.05,
        },
    }

    async with httpx.AsyncClient(timeout=120) as client:
        try:
            resp = await client.post(
                url,
                json=payload,
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
            )
            resp.raise_for_status()
            result = resp.json()
            # watsonx.ai chat response
            choices = result.get("choices") or result.get("results", [])
            if choices:
                first = choices[0]
                if "message" in first:
                    return first["message"].get("content", "")
                if "generated_text" in first:
                    return first["generated_text"]
            return str(result)
        except httpx.HTTPStatusError as exc:
            logger.error("watsonx.ai HTTP error %s: %s", exc.response.status_code, exc.response.text)
            raise
        except Exception as exc:
            logger.error("watsonx.ai call failed: %s", exc)
            raise


# ---------------------------------------------------------------------------
# Specialised helpers
# ---------------------------------------------------------------------------

SHOPPING_SYSTEM_PROMPT = """You are an Intelligent Shopping AI assistant powered by IBM watsonx.ai.
You help users make informed purchasing decisions. You are:
- Helpful: provide clear, actionable, personalised recommendations.
- Accurate: only state what is grounded in the provided data; never fabricate prices, reviews, or specs.
- Transparent: always cite confidence levels and data sources; clearly flag uncertainty.
- Ethical: respect user privacy; do not endorse counterfeit goods or suspicious sellers.
- Sustainable: highlight environmental considerations when available.
Respond in well-structured, concise language."""


async def analyse_product_comparison(products_data: list[dict]) -> str:
    prompt = f"""Analyse and compare the following {len(products_data)} products for a shopper.
For each product provide:
1. Key strengths and weaknesses
2. Best use-case
3. Value-for-money rating (1–10) with justification

Products (JSON):
{products_data}

Finish with a clear recommendation identifying the best overall pick, the best budget pick, and the best premium pick.
Always note your confidence level and any data gaps."""
    return await generate_text(prompt, system_prompt=SHOPPING_SYSTEM_PROMPT, max_new_tokens=2000)


async def analyse_reviews(reviews: list[dict], product_title: str) -> str:
    prompt = f"""Analyse the following customer reviews for '{product_title}'.
Provide:
1. Overall sentiment summary
2. Top 3 praised aspects
3. Top 3 criticised aspects
4. Any patterns that may warrant closer attention (e.g. sudden rating spikes, repeated generic phrases, short timeframe clusters) – note these as 'patterns worth noting', not confirmed as fake.
5. Confidence level of the analysis (low/medium/high) and data limitations.

Reviews (JSON):
{reviews[:50]}"""
    return await generate_text(prompt, system_prompt=SHOPPING_SYSTEM_PROMPT, max_new_tokens=1500)


async def predict_price_trend(price_history: list[dict], product_title: str) -> str:
    prompt = f"""You are given historical price data for '{product_title}'.
Analyse the trend and answer:
1. Is the current price above, below, or near the historical average?
2. What pattern does the price follow (seasonal, promotional, stable)?
3. Based ONLY on observed historical patterns, should the user consider buying now or waiting? State this as a possibility, not a certainty.
4. Clearly state the uncertainty of this forecast.

Price history (JSON – date, price):
{price_history}"""
    return await generate_text(prompt, system_prompt=SHOPPING_SYSTEM_PROMPT, max_new_tokens=800)


async def generate_shopping_recommendation(
    user_preferences: dict,
    candidate_products: list[dict],
) -> str:
    prompt = f"""A shopper has the following preferences:
{user_preferences}

From the candidate products below, recommend the top 3 best matches.
For each recommendation explain:
- Why it fits the user's preferences
- Advantages and disadvantages
- Price competitiveness
- Confidence level (low/medium/high)
- Any caveats or missing information

Candidate products:
{candidate_products}"""
    return await generate_text(prompt, system_prompt=SHOPPING_SYSTEM_PROMPT, max_new_tokens=2000)


async def generate_sustainability_insights(product: dict) -> str:
    prompt = f"""Based ONLY on the following product information, provide sustainability insights.
If no environmental data is available, say so clearly – do not invent sustainability claims.

Product:
{product}

Provide:
1. Available environmental certifications or claims
2. Estimated product lifecycle considerations (if data available)
3. Sustainability score justification (0–10, with explicit uncertainty note if data is limited)"""
    return await generate_text(prompt, system_prompt=SHOPPING_SYSTEM_PROMPT, max_new_tokens=600)


async def chat_with_agent(conversation_history: list[dict], user_message: str) -> str:
    """General-purpose shopping assistant chat."""
    history_text = "\n".join(
        f"{m['role'].capitalize()}: {m['content']}" for m in conversation_history[-10:]
    )
    prompt = f"""Conversation history:
{history_text}

User: {user_message}

Respond as the Intelligent Shopping AI assistant. Be concise, helpful, and transparent."""
    return await generate_text(prompt, system_prompt=SHOPPING_SYSTEM_PROMPT, max_new_tokens=1200)
