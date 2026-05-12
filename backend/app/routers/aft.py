import os, uuid, shutil
from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from datetime import datetime, date
from ..database import get_db
from ..models.core import User
from ..models.aft import Finding, AuditYear, Assignment, Evidence, Response
from ..utils.auth import get_current_user

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "documents")
os.makedirs(UPLOAD_DIR, exist_ok=True)
ALLOWED_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                 "application/msword", "application/vnd.ms-excel",
                 "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}
MAX_SIZE_BYTES = 25 * 1024 * 1024  # 25 MB

router = APIRouter(prefix="/api/aft", tags=["Audit Findings Tracker"])


class FindingCreate(BaseModel):
    audit_year_id: int
    ag_ref_number: str | None = None
    description: str
    finding_type: str
    severity: str
    root_cause: str | None = None
    financial_impact: float = 0
    directorate_id: int | None = None
    is_repeat: bool = False
    repeat_years_count: int = 0


class FindingUpdate(BaseModel):
    description: str | None = None
    finding_type: str | None = None
    severity: str | None = None
    status: str | None = None
    root_cause: str | None = None
    financial_impact: float | None = None
    directorate_id: int | None = None


class AssignmentCreate(BaseModel):
    finding_id: int
    assignee_id: int
    due_date: date
    notes: str | None = None


class AuditYearCreate(BaseModel):
    financial_year: str
    audit_opinion: str | None = None
    ag_letter_uploaded: bool = False


@router.get("/audit-years")
def get_audit_years(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    years = db.query(AuditYear).filter(AuditYear.entity_id == current_user.entity_id).order_by(AuditYear.financial_year.desc()).all()
    return [{"year_id": y.year_id, "financial_year": y.financial_year, "audit_opinion": y.audit_opinion,
             "total_findings": y.total_findings, "closed_findings": y.closed_findings,
             "ag_letter_uploaded": y.ag_letter_uploaded} for y in years]


@router.post("/audit-years")
def create_audit_year(data: AuditYearCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO", "Auditor"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to create financial years")
    existing = db.query(AuditYear).filter(AuditYear.entity_id == current_user.entity_id,
                                          AuditYear.financial_year == data.financial_year).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Financial year {data.financial_year} already exists")
    year = AuditYear(entity_id=current_user.entity_id, **data.model_dump())
    db.add(year); db.commit(); db.refresh(year)
    return {"year_id": year.year_id, "financial_year": year.financial_year, "message": "Financial year created"}


@router.put("/audit-years/{year_id}")
def update_audit_year(year_id: int, data: AuditYearCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    year = db.query(AuditYear).filter(AuditYear.year_id == year_id, AuditYear.entity_id == current_user.entity_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Financial year not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(year, k, v)
    db.commit()
    return {"message": "Financial year updated"}


@router.get("/findings")
def get_findings(
    audit_year_id: int | None = None,
    status: str | None = None,
    severity: str | None = None,
    is_repeat: bool | None = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    query = db.query(Finding).filter(Finding.entity_id == current_user.entity_id)
    if audit_year_id:
        query = query.filter(Finding.audit_year_id == audit_year_id)
    if status:
        query = query.filter(Finding.status == status)
    if severity:
        query = query.filter(Finding.severity == severity)
    if is_repeat is not None:
        query = query.filter(Finding.is_repeat == is_repeat)
    findings = query.order_by(Finding.created_at.desc()).all()
    results = []
    for f in findings:
        assignees = db.query(Assignment).filter(Assignment.finding_id == f.finding_id, Assignment.status == "Active").all()
        results.append({
            "finding_id": f.finding_id, "ag_ref_number": f.ag_ref_number,
            "description": f.description, "finding_type": f.finding_type,
            "severity": f.severity, "status": f.status,
            "financial_impact": float(f.financial_impact) if f.financial_impact else 0,
            "is_repeat": f.is_repeat, "repeat_years_count": f.repeat_years_count,
            "directorate": f.directorate.name if f.directorate else None,
            "assignees": [{"name": a.assignee.full_name, "due_date": str(a.due_date)} for a in assignees],
            "audit_year_id": f.audit_year_id,
            "created_at": f.created_at.isoformat() if f.created_at else None,
        })
    return results


@router.get("/findings/{finding_id}")
def get_finding(finding_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    f = db.query(Finding).filter(Finding.finding_id == finding_id, Finding.entity_id == current_user.entity_id).first()
    if not f:
        raise HTTPException(status_code=404, detail="Finding not found")
    assignments = db.query(Assignment).filter(Assignment.finding_id == finding_id).all()
    evidences = db.query(Evidence).filter(Evidence.finding_id == finding_id).all()
    responses = db.query(Response).filter(Response.finding_id == finding_id).all()
    return {
        "finding_id": f.finding_id, "ag_ref_number": f.ag_ref_number,
        "description": f.description, "finding_type": f.finding_type,
        "severity": f.severity, "status": f.status, "root_cause": f.root_cause,
        "financial_impact": float(f.financial_impact) if f.financial_impact else 0,
        "is_repeat": f.is_repeat, "repeat_years_count": f.repeat_years_count,
        "directorate": f.directorate.name if f.directorate else None,
        "directorate_id": f.directorate_id,
        "audit_year_id": f.audit_year_id,
        "assignments": [{"assignment_id": a.assignment_id, "assignee": a.assignee.full_name,
                         "due_date": str(a.due_date), "status": a.status, "notes": a.notes} for a in assignments],
        "evidences": [{"evidence_id": e.evidence_id, "filename": e.filename, "status": e.status,
                       "upload_date": e.upload_date.isoformat() if e.upload_date else None} for e in evidences],
        "responses": [{"response_id": r.response_id, "response_text": r.response_text,
                       "is_ai_generated": r.is_ai_generated, "version": r.version} for r in responses],
    }


@router.post("/findings")
def create_finding(data: FindingCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    # Validate audit year belongs to this entity
    year = db.query(AuditYear).filter(AuditYear.year_id == data.audit_year_id, AuditYear.entity_id == current_user.entity_id).first()
    if not year:
        raise HTTPException(status_code=400, detail="Invalid audit year. Please select a valid audit year.")
    # Treat directorate_id of 0 as null
    dir_id = data.directorate_id if data.directorate_id and data.directorate_id != 0 else None
    finding = Finding(
        entity_id=current_user.entity_id, audit_year_id=data.audit_year_id,
        ag_ref_number=data.ag_ref_number, description=data.description,
        finding_type=data.finding_type, severity=data.severity,
        root_cause=data.root_cause, financial_impact=data.financial_impact,
        directorate_id=dir_id, is_repeat=data.is_repeat,
        repeat_years_count=data.repeat_years_count,
    )
    db.add(finding)
    db.commit()
    db.refresh(finding)
    # Update audit year count
    year = db.query(AuditYear).filter(AuditYear.year_id == data.audit_year_id).first()
    if year:
        year.total_findings = db.query(func.count(Finding.finding_id)).filter(Finding.audit_year_id == year.year_id).scalar()
        db.commit()
    return {"finding_id": finding.finding_id, "message": "Finding created successfully"}


@router.put("/findings/{finding_id}")
def update_finding(finding_id: int, data: FindingUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    finding = db.query(Finding).filter(Finding.finding_id == finding_id, Finding.entity_id == current_user.entity_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(finding, field, value)
    db.commit()
    return {"message": "Finding updated successfully"}


@router.post("/assignments")
def create_assignment(data: AssignmentCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    assignment = Assignment(
        finding_id=data.finding_id, assignee_id=data.assignee_id,
        assigned_by=current_user.user_id, due_date=data.due_date, notes=data.notes,
    )
    db.add(assignment)
    finding = db.query(Finding).filter(Finding.finding_id == data.finding_id).first()
    if finding and finding.status == "New":
        finding.status = "Assigned"
    db.commit()
    return {"assignment_id": assignment.assignment_id, "message": "Assignment created"}


@router.get("/stats")
def get_aft_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    eid = current_user.entity_id
    total = db.query(func.count(Finding.finding_id)).filter(Finding.entity_id == eid).scalar() or 0
    by_severity = db.query(Finding.severity, func.count(Finding.finding_id)).filter(
        Finding.entity_id == eid).group_by(Finding.severity).all()
    by_status = db.query(Finding.status, func.count(Finding.finding_id)).filter(
        Finding.entity_id == eid).group_by(Finding.status).all()
    by_type = db.query(Finding.finding_type, func.count(Finding.finding_id)).filter(
        Finding.entity_id == eid).group_by(Finding.finding_type).all()
    return {
        "total": total,
        "by_severity": {s: c for s, c in by_severity},
        "by_status": {s: c for s, c in by_status},
        "by_type": {t: c for t, c in by_type},
    }


@router.post("/audit-years/{year_id}/upload-ag-letter")
async def upload_ag_letter(
    year_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO"):
        raise HTTPException(status_code=403, detail="Only AO, CFO or System Admin may upload AG letters")
    year = db.query(AuditYear).filter(AuditYear.year_id == year_id, AuditYear.entity_id == current_user.entity_id).first()
    if not year:
        raise HTTPException(status_code=404, detail="Audit year not found")
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF or Word documents are accepted")
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 25 MB limit")
    ext = os.path.splitext(file.filename or "doc.pdf")[1]
    fname = f"ag_letter_{year_id}_{uuid.uuid4().hex[:8]}{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f_out:
        f_out.write(contents)
    year.ag_letter_path = fname
    year.ag_letter_uploaded = True
    db.commit()
    return {"message": "AG letter uploaded successfully", "filename": fname, "size_kb": len(contents) // 1024}


@router.post("/findings/{finding_id}/upload-evidence")
async def upload_evidence(
    finding_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    finding = db.query(Finding).filter(Finding.finding_id == finding_id, Finding.entity_id == current_user.entity_id).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    if file.content_type not in ALLOWED_TYPES | {"image/jpeg", "image/png"}:
        raise HTTPException(status_code=400, detail="Unsupported file type")
    contents = await file.read()
    if len(contents) > MAX_SIZE_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 25 MB limit")
    ext = os.path.splitext(file.filename or "evidence.pdf")[1]
    fname = f"evidence_{finding_id}_{uuid.uuid4().hex[:8]}{ext}"
    fpath = os.path.join(UPLOAD_DIR, fname)
    with open(fpath, "wb") as f_out:
        f_out.write(contents)
    evidence = Evidence(
        finding_id=finding_id,
        filename=file.filename or fname,
        file_path=fname,
        file_size_kb=len(contents) // 1024,
        uploaded_by=current_user.user_id,
    )
    db.add(evidence)
    if finding.status == "Assigned":
        finding.status = "Evidence_Submitted"
    db.commit()
    return {"message": "Evidence uploaded successfully", "filename": file.filename, "size_kb": len(contents) // 1024}
