from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from ..database import get_db
from ..models.core import User
from ..models.bvm import Budget, Expenditure
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/bvm", tags=["Budget vs Actual Monitor"])


class BudgetCreate(BaseModel):
    financial_year: str
    vote_code: str
    vote_description: str | None = None
    directorate_id: int | None = None
    original_budget: float = 0
    adjusted_budget: float = 0
    budget_type: str = "Operating"


@router.get("/budgets")
def get_budgets(
    financial_year: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Budget).filter(Budget.entity_id == current_user.entity_id)
    if financial_year:
        query = query.filter(Budget.financial_year == financial_year)
    budgets = query.order_by(Budget.vote_code).all()
    results = []
    for b in budgets:
        latest_exp = db.query(Expenditure).filter(Expenditure.budget_id == b.budget_id).order_by(Expenditure.period.desc()).first()
        results.append({
            "budget_id": b.budget_id, "vote_code": b.vote_code,
            "vote_description": b.vote_description, "budget_type": b.budget_type,
            "directorate": b.directorate.name if b.directorate else None,
            "original_budget": float(b.original_budget),
            "adjusted_budget": float(b.adjusted_budget),
            "actual_spend": float(latest_exp.actual_spend) if latest_exp else 0,
            "commitment": float(latest_exp.commitment) if latest_exp else 0,
            "projected_yearend": float(latest_exp.projected_yearend) if latest_exp else 0,
            "ytd_variance_pct": float(latest_exp.ytd_variance_pct) if latest_exp else 0,
            "available_budget": float(b.adjusted_budget) - (float(latest_exp.actual_spend) + float(latest_exp.commitment)) if latest_exp else float(b.adjusted_budget),
        })
    return results


@router.get("/budgets/{budget_id}/expenditure")
def get_expenditure_history(budget_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budget = db.query(Budget).filter(Budget.budget_id == budget_id, Budget.entity_id == current_user.entity_id).first()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    exps = db.query(Expenditure).filter(Expenditure.budget_id == budget_id).order_by(Expenditure.period).all()
    return {
        "budget": {"vote_code": budget.vote_code, "vote_description": budget.vote_description,
                    "adjusted_budget": float(budget.adjusted_budget)},
        "expenditures": [{"period": str(e.period), "actual_spend": float(e.actual_spend),
                          "commitment": float(e.commitment), "projected_yearend": float(e.projected_yearend),
                          "ytd_variance_pct": float(e.ytd_variance_pct)} for e in exps],
    }


@router.post("/budgets")
def create_budget(data: BudgetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    budget = Budget(entity_id=current_user.entity_id, **data.model_dump())
    db.add(budget)
    db.commit()
    return {"budget_id": budget.budget_id, "message": "Budget created"}


@router.get("/stats")
def get_bvm_stats(
    financial_year: str = "2024/25",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    eid = current_user.entity_id
    budgets = db.query(Budget).filter(Budget.entity_id == eid, Budget.financial_year == financial_year).all()
    total_budget = sum(float(b.adjusted_budget) for b in budgets)
    total_spent = 0
    total_commitment = 0
    overspent_votes = 0
    for b in budgets:
        latest = db.query(Expenditure).filter(Expenditure.budget_id == b.budget_id).order_by(Expenditure.period.desc()).first()
        if latest:
            total_spent += float(latest.actual_spend)
            total_commitment += float(latest.commitment)
            if float(latest.ytd_variance_pct) > 5:
                overspent_votes += 1
    return {
        "total_budget": total_budget,
        "total_spent": total_spent,
        "total_commitment": total_commitment,
        "available": total_budget - total_spent - total_commitment,
        "utilization_pct": round(total_spent / total_budget * 100, 1) if total_budget else 0,
        "overspent_votes": overspent_votes,
        "total_votes": len(budgets),
    }
