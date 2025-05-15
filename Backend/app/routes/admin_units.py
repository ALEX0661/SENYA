from fastapi import APIRouter, Depends, HTTPException, status, Form, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import update
from app.models import Unit, Lesson, Sign
from app.dependencies import get_db, get_admin_user
from app.schemas import UnitSchema, UnitUpdateSchema 
from typing import List

router = APIRouter()

@router.get("/", response_model=List[UnitSchema])
async def get_all_units(
    include_archived: bool = Query(False, description="Include archived units"),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    query = select(Unit).order_by(Unit.order_index)
    
    if not include_archived:
        query = query.where(Unit.archived == False)
        
    result = await db.execute(query)
    units = result.scalars().unique().all()
    return units

@router.post("/", response_model=UnitSchema, status_code=status.HTTP_201_CREATED)
async def create_unit(
    title: str = Form(...),
    description: str = Form(None),
    order_index: int = Form(...),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    new_unit = Unit(
        title=title,
        description=description,
        order_index=order_index,
        status="active",
        archived=False
    )
    db.add(new_unit)
    await db.commit()
    await db.refresh(new_unit)
    return new_unit

@router.put("/{unit_id}", response_model=UnitSchema)
async def update_unit(
    unit_id: int,
    title: str = Form(...),
    description: str = Form(None),
    order_index: int = Form(...),
    status: str = Form(...),
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalars().first()
    
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    
    unit.title = title
    unit.description = description
    unit.order_index = order_index
    unit.status = status
    
    await db.commit()
    await db.refresh(unit)
    return unit

@router.patch("/{unit_id}/archive", response_model=UnitSchema)
async def archive_unit(
    unit_id: int,
    db: AsyncSession = Depends(get_db),
    admin_user = Depends(get_admin_user)
):
    result = await db.execute(select(Unit).where(Unit.id == unit_id))
    unit = result.scalars().first()
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")

    unit.archived = True

    await db.execute(
        update(Lesson)
        .where(Lesson.unit_id == unit_id)
        .values(archived=True)
    )

    subq = select(Lesson.id).where(Lesson.unit_id == unit_id)
    await db.execute(
        update(Sign)
        .where(Sign.lesson_id.in_(subq))
        .values(archived=True)
    )

    await db.commit()
    await db.refresh(unit)
    return unit