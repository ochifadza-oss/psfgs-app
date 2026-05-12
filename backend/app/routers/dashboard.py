from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from ..database import get_db
from ..models.core import User, Entity
from ..models.aft import Finding, AuditYear
from ..models.ifw import IFWItem
from ..models.bvm import Budget, Expenditure
from ..models.scc import Requisition
from ..models.cmt import MisconductCase
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/summary")
def get_dashboard_summary(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    eid = current_user.entity_id
    entity = db.query(Entity).filter(Entity.entity_id == eid).first()

    # AFT stats
    total_findings = db.query(func.count(Finding.finding_id)).filter(Finding.entity_id == eid).scalar() or 0
    open_findings = db.query(func.count(Finding.finding_id)).filter(
        Finding.entity_id == eid, Finding.status.notin_(["Closed"])
    ).scalar() or 0
    overdue_findings = db.query(func.count(Finding.finding_id)).filter(
        Finding.entity_id == eid, Finding.status == "Overdue"
    ).scalar() or 0
    repeat_findings = db.query(func.count(Finding.finding_id)).filter(
        Finding.entity_id == eid, Finding.is_repeat == True
    ).scalar() or 0

    # IFW stats
    total_ifwe = db.query(func.sum(IFWItem.amount)).filter(IFWItem.entity_id == eid).scalar() or 0
    ifwe_count = db.query(func.count(IFWItem.item_id)).filter(IFWItem.entity_id == eid).scalar() or 0
    open_ifwe = db.query(func.count(IFWItem.item_id)).filter(
        IFWItem.entity_id == eid, IFWItem.status.notin_(["Condoned", "Recovered", "Written_Off"])
    ).scalar() or 0

    # BVM stats
    total_budget = db.query(func.sum(Budget.adjusted_budget)).filter(
        Budget.entity_id == eid, Budget.financial_year == "2024/25"
    ).scalar() or 0
    latest_exp = db.query(func.sum(Expenditure.actual_spend)).join(Budget).filter(
        Budget.entity_id == eid, Budget.financial_year == "2024/25"
    ).scalar() or 0

    # SCC stats
    scc_total = db.query(func.count(Requisition.req_id)).filter(Requisition.entity_id == eid).scalar() or 0
    scc_passed = db.query(func.count(Requisition.req_id)).filter(
        Requisition.entity_id == eid, Requisition.status.in_(["Passed", "Approved"])
    ).scalar() or 0
    scc_failed = db.query(func.count(Requisition.req_id)).filter(
        Requisition.entity_id == eid, Requisition.status == "Failed"
    ).scalar() or 0

    # CMT stats
    active_cases = db.query(func.count(MisconductCase.case_id)).filter(
        MisconductCase.entity_id == eid, MisconductCase.stage.notin_(["Closed"])
    ).scalar() or 0

    # Audit years
    audit_years = db.query(AuditYear).filter(AuditYear.entity_id == eid).order_by(AuditYear.financial_year.desc()).all()
    audit_history = [
        {"year": ay.financial_year, "opinion": ay.audit_opinion, "total": ay.total_findings, "closed": ay.closed_findings}
        for ay in audit_years
    ]

    return {
        "entity_name": entity.entity_name if entity else "Municipality",
        "audit": {
            "total_findings": total_findings,
            "open_findings": open_findings,
            "overdue_findings": overdue_findings,
            "repeat_findings": repeat_findings,
            "audit_history": audit_history,
        },
        "ifwe": {
            "total_amount": float(total_ifwe),
            "total_items": ifwe_count,
            "open_items": open_ifwe,
        },
        "budget": {
            "total_budget": float(total_budget),
            "total_spent": float(latest_exp),
            "utilization_pct": round(float(latest_exp) / float(total_budget) * 100, 1) if total_budget else 0,
        },
        "scm": {
            "total_requisitions": scc_total,
            "passed": scc_passed,
            "failed": scc_failed,
            "compliance_rate": round(scc_passed / scc_total * 100, 1) if scc_total else 0,
        },
        "consequence_management": {
            "active_cases": active_cases,
        },
    }
