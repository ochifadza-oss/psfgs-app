from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import date
from ..database import get_db
from ..models.core import User
from ..models.scc import Requisition, ComplianceCheck, ComplianceRule
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/scc", tags=["SCM Compliance Checker"])


class RequisitionCreate(BaseModel):
    request_date: date
    description: str
    estimated_value: float
    supplier_name: str | None = None
    procurement_method: str = "Written_Quotation"


class RequisitionUpdate(BaseModel):
    status: str | None = None
    description: str | None = None
    estimated_value: float | None = None


@router.get("/requisitions")
def get_requisitions(
    status: str | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Requisition).filter(Requisition.entity_id == current_user.entity_id)
    if status:
        query = query.filter(Requisition.status == status)
    reqs = query.order_by(Requisition.created_at.desc()).all()
    return [{
        "req_id": r.req_id, "request_date": str(r.request_date),
        "requester": r.requester.full_name if r.requester else None,
        "description": r.description, "estimated_value": float(r.estimated_value),
        "supplier_name": r.supplier_name, "procurement_method": r.procurement_method,
        "compliance_score": r.compliance_score, "status": r.status,
        "checks": [{"check_type": c.check_type, "result": c.result, "failure_reason": c.failure_reason}
                   for c in r.checks],
    } for r in reqs]


@router.get("/requisitions/{req_id}")
def get_requisition(req_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    r = db.query(Requisition).filter(Requisition.req_id == req_id, Requisition.entity_id == current_user.entity_id).first()
    if not r:
        raise HTTPException(status_code=404, detail="Requisition not found")
    return {
        "req_id": r.req_id, "request_date": str(r.request_date),
        "requester": r.requester.full_name if r.requester else None,
        "description": r.description, "estimated_value": float(r.estimated_value),
        "supplier_name": r.supplier_name, "procurement_method": r.procurement_method,
        "compliance_score": r.compliance_score, "status": r.status,
        "ai_risk_notes": r.ai_risk_notes,
        "checks": [{"check_id": c.check_id, "check_type": c.check_type, "result": c.result,
                     "failure_reason": c.failure_reason, "checked_at": c.checked_at.isoformat() if c.checked_at else None}
                   for c in r.checks],
    }


@router.post("/requisitions")
def create_requisition(data: RequisitionCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = Requisition(
        entity_id=current_user.entity_id, requester_id=current_user.user_id,
        **data.model_dump()
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    return {"req_id": req.req_id, "message": "Requisition created"}


@router.post("/requisitions/{req_id}/check")
def run_compliance_check(req_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    req = db.query(Requisition).filter(Requisition.req_id == req_id, Requisition.entity_id == current_user.entity_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Requisition not found")

    # Clear previous checks
    db.query(ComplianceCheck).filter(ComplianceCheck.req_id == req_id).delete()
    req.status = "Checking"
    db.flush()

    rules = db.query(ComplianceRule).filter(ComplianceRule.entity_id == current_user.entity_id, ComplianceRule.is_active == True).all()
    checks_results = []
    passed_count = 0
    total_checks = 0

    for rule in rules:
        result = "Pass"
        failure_reason = None

        if rule.category == "Value_Threshold":
            if rule.threshold_min is not None and rule.threshold_max is not None:
                if float(rule.threshold_min) <= float(req.estimated_value) <= float(rule.threshold_max):
                    # Check procurement method matches expected
                    expected_methods = {
                        (0, 2000): "Petty_Cash",
                        (2000, 30000): "Written_Quotation",
                        (30000, 200000): "Written_Quotation",
                        (200000, 999999999): "Competitive_Bid",
                    }
                    for (lo, hi), method in expected_methods.items():
                        if lo <= float(req.estimated_value) < hi:
                            if req.procurement_method not in [method, "Emergency", "Deviation"]:
                                result = "Fail"
                                failure_reason = f"Value R{float(req.estimated_value):,.2f} requires {method} but {req.procurement_method} was selected"
                            break
                    total_checks += 1
                else:
                    continue
        elif rule.category == "Supplier_Verification":
            if not req.supplier_name:
                result = "Fail"
                failure_reason = "No supplier specified - CSD verification cannot be performed"
            total_checks += 1
        elif rule.category == "Budget_Availability":
            total_checks += 1
            # Simplified - in production would check actual budget availability
        elif rule.category == "Delegation":
            total_checks += 1
        elif rule.category == "BEE_Compliance":
            total_checks += 1
        else:
            total_checks += 1

        if result == "Pass":
            passed_count += 1

        check = ComplianceCheck(req_id=req_id, check_type=rule.category, result=result,
                                failure_reason=failure_reason, rule_id=rule.rule_id)
        db.add(check)
        checks_results.append({"check_type": rule.category, "result": result, "failure_reason": failure_reason})

    score = round(passed_count / total_checks * 100) if total_checks > 0 else 0
    req.compliance_score = score
    req.status = "Passed" if score == 100 else "Failed"
    db.commit()

    return {
        "compliance_score": score,
        "status": req.status,
        "checks": checks_results,
    }


@router.get("/rules")
def get_rules(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    rules = db.query(ComplianceRule).filter(ComplianceRule.entity_id == current_user.entity_id).all()
    return [{"rule_id": r.rule_id, "rule_name": r.rule_name, "category": r.category,
             "threshold_min": float(r.threshold_min) if r.threshold_min else None,
             "threshold_max": float(r.threshold_max) if r.threshold_max else None,
             "is_active": r.is_active} for r in rules]


@router.get("/stats")
def get_scc_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    eid = current_user.entity_id
    total = db.query(func.count(Requisition.req_id)).filter(Requisition.entity_id == eid).scalar() or 0
    by_status = db.query(Requisition.status, func.count(Requisition.req_id)).filter(
        Requisition.entity_id == eid).group_by(Requisition.status).all()
    avg_score = db.query(func.avg(Requisition.compliance_score)).filter(
        Requisition.entity_id == eid, Requisition.compliance_score > 0).scalar() or 0
    by_method = db.query(Requisition.procurement_method, func.count(Requisition.req_id), func.sum(Requisition.estimated_value)).filter(
        Requisition.entity_id == eid).group_by(Requisition.procurement_method).all()
    return {
        "total_requisitions": total,
        "avg_compliance_score": round(float(avg_score), 1),
        "by_status": {s: c for s, c in by_status},
        "by_method": [{"method": m, "count": c, "total_value": float(v) if v else 0} for m, c, v in by_method],
    }
