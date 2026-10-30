"""
Shopping list and price alert API routes.
"""
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.dependencies import get_current_user
from app.database import get_db
from app.models import PriceAlert, ShoppingList, ShoppingListItem, User
from app.schemas.schemas import (
    PriceAlertIn,
    PriceAlertOut,
    ShoppingListIn,
    ShoppingListOut,
)

router = APIRouter(prefix="/lists", tags=["Shopping Lists & Alerts"])


# ---------------------------------------------------------------------------
# Shopping Lists
# ---------------------------------------------------------------------------

@router.get("/", response_model=list[ShoppingListOut])
async def get_lists(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ShoppingList).where(ShoppingList.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/", response_model=ShoppingListOut, status_code=201)
async def create_list(
    payload: ShoppingListIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shopping_list = ShoppingList(
        id=uuid.uuid4(),
        user_id=current_user.id,
        name=payload.name,
    )
    db.add(shopping_list)
    await db.flush()

    for item_data in payload.items:
        item = ShoppingListItem(
            id=uuid.uuid4(),
            shopping_list_id=shopping_list.id,
            **item_data.model_dump(),
        )
        db.add(item)

    await db.flush()
    await db.refresh(shopping_list)
    return shopping_list


@router.post("/{list_id}/items", status_code=201)
async def add_item(
    list_id: uuid.UUID,
    item_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shopping_list = await db.scalar(
        select(ShoppingList).where(
            ShoppingList.id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found.")

    item = ShoppingListItem(id=uuid.uuid4(), shopping_list_id=list_id, **item_data)
    db.add(item)
    return {"message": "Item added successfully."}


@router.delete("/{list_id}/items/{item_id}", status_code=204)
async def remove_item(
    list_id: uuid.UUID,
    item_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    shopping_list = await db.scalar(
        select(ShoppingList).where(
            ShoppingList.id == list_id,
            ShoppingList.user_id == current_user.id,
        )
    )
    if not shopping_list:
        raise HTTPException(status_code=404, detail="Shopping list not found.")

    item = await db.scalar(
        select(ShoppingListItem).where(
            ShoppingListItem.id == item_id,
            ShoppingListItem.shopping_list_id == list_id,
        )
    )
    if not item:
        raise HTTPException(status_code=404, detail="Item not found.")

    await db.delete(item)


# ---------------------------------------------------------------------------
# Price Alerts
# ---------------------------------------------------------------------------

@router.get("/alerts", response_model=list[PriceAlertOut])
async def get_alerts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(PriceAlert).where(PriceAlert.user_id == current_user.id)
    )
    return result.scalars().all()


@router.post("/alerts", response_model=PriceAlertOut, status_code=201)
async def create_alert(
    payload: PriceAlertIn,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alert = PriceAlert(
        id=uuid.uuid4(),
        user_id=current_user.id,
        product_id=payload.product_id,
        target_price=payload.target_price,
    )
    db.add(alert)
    return alert


@router.delete("/alerts/{alert_id}", status_code=204)
async def delete_alert(
    alert_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    alert = await db.scalar(
        select(PriceAlert).where(
            PriceAlert.id == alert_id,
            PriceAlert.user_id == current_user.id,
        )
    )
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    await db.delete(alert)
