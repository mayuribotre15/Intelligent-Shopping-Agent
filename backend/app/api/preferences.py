"""
User preferences API routes.
"""
import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import User, UserPreference
from app.schemas.schemas import PreferencesIn, PreferencesOut

router = APIRouter(prefix="/preferences", tags=["User Preferences"])


@router.get("/", response_model=PreferencesOut)
async def get_preferences(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prefs = await db.scalar(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    if not prefs:
        # Return defaults
        return PreferencesOut(
            id=uuid.uuid4(),
            updated_at=current_user.created_at,
        )
    return prefs


@router.put("/", response_model=PreferencesOut)
async def upsert_preferences(
    payload: PreferencesIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    prefs = await db.scalar(
        select(UserPreference).where(UserPreference.user_id == current_user.id)
    )
    if prefs:
        for field, value in payload.model_dump(exclude_none=True).items():
            setattr(prefs, field, value)
    else:
        prefs = UserPreference(
            id=uuid.uuid4(),
            user_id=current_user.id,
            **payload.model_dump(),
        )
        db.add(prefs)
    return prefs
