from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import date
from ..database import get_db
from ..models.core import User
from ..models.ifw import IFWItem, IFWCondonation
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/ifw", tags=["IFWE Register"])


class IFWItemCreate(BaseModel):
    reference_number: str | None = None
    ifwe_type: str
    amount: float
    financial_year: str | None = None
    description: str | None = None
    root_cause: str | None = None
    responsible_official_id: int | None = None


class IFWItemUpdate(BaseModel):
    status: str | None = None
    description: str | None = None
    root_cause: str | None = None
    amount: float | None = None


class CondonationCreate(BaseModel):
    item_id: int
    application_date: date | None = None
    council_resolution_no: str | None = None


@router.get("/items")
def get_items(
    ifwe_type: str | None = None,
    status: str | None = None,
    financial_year: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(IFWItem).filter(IFWItem.entity_id == current_user.entity_id)
    if ifwe_type:
        query = query.filter(IFWItem.ifwe_type == ifwe_type)
    if status:
        query = query.filter(IFWItem.status == status)
    if financial_year:
        query = query.filter(IFWItem.financial_year == financial_year)
    items = query.order_by(IFWItem.financial_year.desc(), IFWItem.amount.desc()).all()
    return [{
        "item_id": i.item_id, "reference_number": i.reference_number,
        "ifwe_type": i.ifwe_type, "amount": float(i.amount),
        "financial_year": i.financial_year, "description": i.description,
        "status": i.status, "root_cause": i.root_cause,
        "responsible_official": i.responsible_official.full_name if i.responsible_official else None,
        "condonations": [{"cond_id": c.cond_id, "outcome": c.outcome, "application_date": str(c.application_date) if c.application_date else None}
                         for c in i.condonations],
    } for i in items]


@router.get("/items/{item_id}")
def get_item(item_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(IFWItem).filter(IFWItem.item_id == item_id, IFWItem.entity_id == current_user.entity_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return {
        "item_id": item.item_id, "reference_number": item.reference_number,
        "ifwe_type": item.ifwe_type, "amount": float(item.amount),
        "financial_year": item.financial_year, "description": item.description,
        "status": item.status, "root_cause": item.root_cause,
        "responsible_official": item.responsible_official.full_name if item.responsible_official else None,
        "responsible_official_id": item.responsible_official_id,
        "condonations": [{"cond_id": c.cond_id, "outcome": c.outcome,
                          "application_date": str(c.application_date) if c.application_date else None,
                          "council_resolution_no": c.council_resolution_no,
                          "nt_reference": c.nt_reference} for c in item.condonations],
    }


@router.post("/items")
def create_item(data: IFWItemCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = IFWItem(entity_id=current_user.entity_id, **data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return {"item_id": item.item_id, "message": "IFWE item created"}


@router.put("/items/{item_id}")
def update_item(item_id: int, data: IFWItemUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(IFWItem).filter(IFWItem.item_id == item_id, IFWItem.entity_id == current_user.entity_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    return {"message": "Item updated"}


@router.post("/condonations")
def create_condonation(data: CondonationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    item = db.query(IFWItem).filter(IFWItem.item_id == data.item_id, IFWItem.entity_id == current_user.entity_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    cond = IFWCondonation(item_id=data.item_id, application_date=data.application_date, council_resolution_no=data.council_resolution_no)
    db.add(cond)
    item.status = "Condonation_Applied"
    db.commit()
    return {"cond_id": cond.cond_id, "message": "Condonation application created"}


@router.get("/stats")
def get_ifw_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    eid = current_user.entity_id
    by_type = db.query(IFWItem.ifwe_type, func.sum(IFWItem.amount), func.count(IFWItem.item_id)).filter(
        IFWItem.entity_id == eid).group_by(IFWItem.ifwe_type).all()
    by_status = db.query(IFWItem.status, func.sum(IFWItem.amount), func.count(IFWItem.item_id)).filter(
        IFWItem.entity_id == eid).group_by(IFWItem.status).all()
    by_year = db.query(IFWItem.financial_year, func.sum(IFWItem.amount)).filter(
        IFWItem.entity_id == eid).group_by(IFWItem.financial_year).order_by(IFWItem.financial_year).all()
    total = db.query(func.sum(IFWItem.amount)).filter(IFWItem.entity_id == eid).scalar() or 0
    return {
        "total_amount": float(total),
        "by_type": [{"type": t, "amount": float(a), "count": c} for t, a, c in by_type],
        "by_status": [{"status": s, "amount": float(a), "count": c} for s, a, c in by_status],
        "by_year": [{"year": y, "amount": float(a)} for y, a in by_year],
    }
