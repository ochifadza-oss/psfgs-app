"""Routers for remaining PSFGS modules: AVS, CMT, DAR, PCR, S71, PKD, ERP, PYT, ARR, PSA, CFF, ARD"""
import os, uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel
from typing import Optional
from datetime import date

_DOC_UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "documents")
os.makedirs(_DOC_UPLOAD_DIR, exist_ok=True)
_ALLOWED_DOC_TYPES = {"application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword"}
_MAX_DOC_BYTES = 25 * 1024 * 1024
from passlib.context import CryptContext
from ..database import get_db
from ..models.core import User, Directorate
from ..models.avs import Asset, AssetCategory, Location, VerificationSession
from ..models.cmt import MisconductCase
from ..models.dar import Delegation
from ..models.pcr import Policy
from ..models.s71 import S71Report
from ..models.pkd import KPI, QuarterlyRecord
from ..models.erp import MetricSnapshot
from ..utils.auth import get_current_user

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ── AVS ──
avs_router = APIRouter(prefix="/api/avs", tags=["Asset Verification System"])

class AssetCreate(BaseModel):
    asset_number: str
    barcode: Optional[str] = None
    description: str
    category_id: Optional[int] = None
    location_id: Optional[int] = None
    cost: Optional[float] = None
    condition: str = "Good"
    status: str = "Active"
    serial_number: Optional[str] = None
    acquisition_date: Optional[date] = None
    useful_life_years: Optional[int] = None

@avs_router.get("/assets")
def get_assets(status: str | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Asset).filter(Asset.entity_id == current_user.entity_id)
    if status:
        query = query.filter(Asset.status == status)
    assets = query.order_by(Asset.asset_number).limit(200).all()
    return [{"asset_id": a.asset_id, "asset_number": a.asset_number, "barcode": a.barcode,
             "description": a.description, "cost": float(a.cost) if a.cost else 0,
             "condition": a.condition, "status": a.status,
             "category": a.category.category_name if a.category else None,
             "location": a.location.location_name if a.location else None} for a in assets]

@avs_router.get("/sessions")
def get_verification_sessions(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    sessions = db.query(VerificationSession).filter(VerificationSession.entity_id == current_user.entity_id).order_by(VerificationSession.start_date.desc()).all()
    return [{"session_id": s.session_id, "session_name": s.session_name, "status": s.status,
             "start_date": str(s.start_date) if s.start_date else None,
             "assets_verified": s.assets_verified, "assets_not_found": s.assets_not_found,
             "ghost_assets_found": s.ghost_assets_found} for s in sessions]

@avs_router.get("/stats")
def get_avs_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    eid = current_user.entity_id
    total = db.query(func.count(Asset.asset_id)).filter(Asset.entity_id == eid).scalar() or 0
    total_value = db.query(func.sum(Asset.cost)).filter(Asset.entity_id == eid).scalar() or 0
    by_status = db.query(Asset.status, func.count(Asset.asset_id)).filter(Asset.entity_id == eid).group_by(Asset.status).all()
    by_condition = db.query(Asset.condition, func.count(Asset.asset_id)).filter(Asset.entity_id == eid).group_by(Asset.condition).all()
    return {"total_assets": total, "total_value": float(total_value),
            "by_status": {s: c for s, c in by_status}, "by_condition": {c: n for c, n in by_condition}}

@avs_router.post("/assets")
def create_asset(data: AssetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    existing = db.query(Asset).filter(Asset.entity_id == current_user.entity_id, Asset.asset_number == data.asset_number).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Asset number {data.asset_number} already exists")
    asset = Asset(entity_id=current_user.entity_id, **data.model_dump())
    db.add(asset); db.commit(); db.refresh(asset)
    return {"asset_id": asset.asset_id, "asset_number": asset.asset_number, "message": "Asset created"}

@avs_router.put("/assets/{asset_id}")
def update_asset(asset_id: int, data: AssetCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    asset = db.query(Asset).filter(Asset.asset_id == asset_id, Asset.entity_id == current_user.entity_id).first()
    if not asset:
        raise HTTPException(status_code=404, detail="Asset not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        setattr(asset, k, v)
    db.commit()
    return {"message": "Asset updated"}

@avs_router.get("/categories")
def get_asset_categories(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    cats = db.query(AssetCategory).filter(AssetCategory.entity_id == current_user.entity_id).all()
    return [{"category_id": c.category_id, "category_name": c.category_name, "category_code": c.category_code} for c in cats]

@avs_router.get("/locations")
def get_locations(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    locs = db.query(Location).filter(Location.entity_id == current_user.entity_id).all()
    return [{"location_id": l.location_id, "location_name": l.location_name, "location_code": l.location_code} for l in locs]


# ── CMT ──
cmt_router = APIRouter(prefix="/api/cmt", tags=["Consequence Management Tracker"])

class CaseCreate(BaseModel):
    case_reference: str | None = None
    misconduct_type: str
    accused_official_id: int | None = None
    financial_impact: float = 0
    referral_source: str
    ifw_item_id: int | None = None

@cmt_router.get("/cases")
def get_cases(stage: str | None = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(MisconductCase).filter(MisconductCase.entity_id == current_user.entity_id)
    if stage:
        query = query.filter(MisconductCase.stage == stage)
    cases = query.order_by(MisconductCase.registered_date.desc()).all()
    return [{"case_id": c.case_id, "case_reference": c.case_reference, "misconduct_type": c.misconduct_type,
             "accused_official": c.accused_official.full_name if c.accused_official else None,
             "financial_impact": float(c.financial_impact), "referral_source": c.referral_source,
             "stage": c.stage, "outcome": c.outcome,
             "registered_date": str(c.registered_date) if c.registered_date else None} for c in cases]

@cmt_router.post("/cases")
def create_case(data: CaseCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    case = MisconductCase(entity_id=current_user.entity_id, registered_by=current_user.user_id,
                          registered_date=date.today(), **data.model_dump())
    db.add(case)
    db.commit()
    return {"case_id": case.case_id, "message": "Case registered"}

@cmt_router.get("/stats")
def get_cmt_stats(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    eid = current_user.entity_id
    total = db.query(func.count(MisconductCase.case_id)).filter(MisconductCase.entity_id == eid).scalar() or 0
    by_stage = db.query(MisconductCase.stage, func.count(MisconductCase.case_id)).filter(MisconductCase.entity_id == eid).group_by(MisconductCase.stage).all()
    total_impact = db.query(func.sum(MisconductCase.financial_impact)).filter(MisconductCase.entity_id == eid).scalar() or 0
    return {"total_cases": total, "total_financial_impact": float(total_impact), "by_stage": {s: c for s, c in by_stage}}


# ── DAR ──
dar_router = APIRouter(prefix="/api/dar", tags=["Delegation of Authority"])

class DelegationCreate(BaseModel):
    delegator_id: int
    delegate_id: int
    power_description: str
    financial_limit: Optional[float] = None
    effective_date: date
    expiry_date: Optional[date] = None
    legislative_reference: Optional[str] = None
    council_resolution_ref: Optional[str] = None
    status: str = "Active"

@dar_router.get("/delegations")
def get_delegations(status: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Delegation).filter(Delegation.entity_id == current_user.entity_id)
    if status:
        query = query.filter(Delegation.status == status)
    dels = query.order_by(Delegation.effective_date.desc()).all()
    return [{"delegation_id": d.delegation_id, "delegator": d.delegator.full_name, "delegate": d.delegate.full_name,
             "delegator_id": d.delegator_id, "delegate_id": d.delegate_id,
             "power_description": d.power_description, "financial_limit": float(d.financial_limit) if d.financial_limit else None,
             "effective_date": str(d.effective_date), "expiry_date": str(d.expiry_date) if d.expiry_date else None,
             "legislative_reference": d.legislative_reference,
             "council_resolution_ref": getattr(d, 'council_resolution_ref', None),
             "status": d.status} for d in dels]

@dar_router.post("/delegations")
def create_delegation(data: DelegationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO"):
        raise HTTPException(status_code=403, detail="Only MM, CFO, or Admin can create delegations")
    delegation = Delegation(entity_id=current_user.entity_id, **data.model_dump())
    db.add(delegation); db.commit(); db.refresh(delegation)
    return {"delegation_id": delegation.delegation_id, "message": "Delegation created"}

@dar_router.put("/delegations/{delegation_id}")
def update_delegation(delegation_id: int, data: DelegationCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    d = db.query(Delegation).filter(Delegation.delegation_id == delegation_id, Delegation.entity_id == current_user.entity_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Delegation not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        if hasattr(d, k): setattr(d, k, v)
    db.commit()
    return {"message": "Delegation updated"}


# ── PCR ──
pcr_router = APIRouter(prefix="/api/pcr", tags=["Policy Compliance Manager"])

class PolicyCreate(BaseModel):
    policy_name: str
    category: str
    current_version: Optional[str] = "1.0"
    effective_date: Optional[date] = None
    review_date: Optional[date] = None
    owner_id: Optional[int] = None
    council_approval_date: Optional[date] = None
    council_resolution_ref: Optional[str] = None
    status: str = "Active"
    document_type: str = "Policy"  # Policy, Regulation, Framework, Procedure, SOP, Other

@pcr_router.get("/policies")
def get_policies(status: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(Policy).filter(Policy.entity_id == current_user.entity_id)
    if status:
        query = query.filter(Policy.status == status)
    policies = query.order_by(Policy.policy_name).all()
    return [{"policy_id": p.policy_id, "policy_name": p.policy_name, "category": p.category,
             "current_version": p.current_version, "effective_date": str(p.effective_date) if p.effective_date else None,
             "review_date": str(p.review_date) if p.review_date else None,
             "owner": p.owner.full_name if p.owner else None, "owner_id": p.owner_id,
             "council_resolution_ref": getattr(p, 'council_resolution_ref', None),
             "council_approval_date": str(p.council_approval_date) if getattr(p, 'council_approval_date', None) else None,
             "document_type": getattr(p, 'document_type', 'Policy'),
             "status": p.status} for p in policies]

@pcr_router.post("/policies")
def create_policy(data: PolicyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO", "Auditor", "Director"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to create policies")
    payload = data.model_dump()
    # Remove fields that may not be on the model yet
    payload.pop('document_type', None)
    payload.pop('council_resolution_ref', None)
    payload.pop('council_approval_date', None)
    policy = Policy(entity_id=current_user.entity_id, **payload)
    if hasattr(policy, 'document_type'): policy.document_type = data.document_type
    if hasattr(policy, 'council_resolution_ref'): policy.council_resolution_ref = data.council_resolution_ref
    if hasattr(policy, 'council_approval_date'): policy.council_approval_date = data.council_approval_date
    db.add(policy); db.commit(); db.refresh(policy)
    return {"policy_id": policy.policy_id, "message": "Policy / document created"}

@pcr_router.put("/policies/{policy_id}")
def update_policy(policy_id: int, data: PolicyCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id, Policy.entity_id == current_user.entity_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    for k, v in data.model_dump(exclude_unset=True).items():
        if hasattr(policy, k): setattr(policy, k, v)
    db.commit()
    return {"message": "Policy updated"}

@pcr_router.delete("/policies/{policy_id}")
def delete_policy(policy_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    policy = db.query(Policy).filter(Policy.policy_id == policy_id, Policy.entity_id == current_user.entity_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    policy.status = "Suspended"
    db.commit()
    return {"message": "Policy suspended"}


@pcr_router.post("/policies/{policy_id}/upload-document")
async def upload_policy_document(
    policy_id: int,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO", "Director"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to upload policy documents")
    policy = db.query(Policy).filter(Policy.policy_id == policy_id, Policy.entity_id == current_user.entity_id).first()
    if not policy:
        raise HTTPException(status_code=404, detail="Policy not found")
    if file.content_type not in _ALLOWED_DOC_TYPES:
        raise HTTPException(status_code=400, detail="Only PDF or Word documents are accepted")
    contents = await file.read()
    if len(contents) > _MAX_DOC_BYTES:
        raise HTTPException(status_code=400, detail="File exceeds 25 MB limit")
    ext = os.path.splitext(file.filename or "policy.pdf")[1]
    fname = f"policy_{policy_id}_{uuid.uuid4().hex[:8]}{ext}"
    fpath = os.path.join(_DOC_UPLOAD_DIR, fname)
    with open(fpath, "wb") as f_out:
        f_out.write(contents)
    if hasattr(policy, 'document_path'):
        policy.document_path = fname
    db.commit()
    return {"message": "Document uploaded successfully", "filename": file.filename, "size_kb": len(contents) // 1024}


# ── S71 ──
s71_router = APIRouter(prefix="/api/s71", tags=["Section 71 Auto-Generator"])

@s71_router.get("/reports")
def get_s71_reports(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    reports = db.query(S71Report).filter(S71Report.entity_id == current_user.entity_id).order_by(S71Report.period.desc()).all()
    return [{"report_id": r.report_id, "period": str(r.period), "status": r.status,
             "days_after_month_end": r.days_after_month_end,
             "submitted_date": r.submitted_date.isoformat() if r.submitted_date else None} for r in reports]


# ── PKD ──
pkd_router = APIRouter(prefix="/api/pkd", tags=["Performance KPI Dashboard"])

class KPICreate(BaseModel):
    kpi_code: str
    description: str
    unit_of_measure: str
    annual_target: float
    financial_year: str
    directorate_id: Optional[int] = None
    q1_target: Optional[float] = None
    q2_target: Optional[float] = None
    q3_target: Optional[float] = None
    q4_target: Optional[float] = None
    status: str = "Active"

class QuarterlyUpdate(BaseModel):
    quarter: int  # 1-4
    actual_achievement: float
    commentary: Optional[str] = None

@pkd_router.get("/kpis")
def get_kpis(financial_year: Optional[str] = None, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    query = db.query(KPI).filter(KPI.entity_id == current_user.entity_id)
    if financial_year:
        query = query.filter(KPI.financial_year == financial_year)
    kpis = query.order_by(KPI.kpi_code).all()
    return [{"kpi_id": k.kpi_id, "kpi_code": k.kpi_code, "description": k.description,
             "unit_of_measure": k.unit_of_measure, "annual_target": float(k.annual_target) if k.annual_target else None,
             "status": k.status, "financial_year": k.financial_year,
             "directorate_id": k.directorate_id if hasattr(k, 'directorate_id') else None,
             "quarters": [{"quarter": q.quarter, "target": float(q.milestone_target) if q.milestone_target else None,
                          "actual": float(q.actual_achievement) if q.actual_achievement else None,
                          "traffic_light": q.traffic_light} for q in k.quarters]} for k in kpis]

@pkd_router.post("/kpis")
def create_kpi(data: KPICreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO", "Director"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to create KPIs")
    existing = db.query(KPI).filter(KPI.entity_id == current_user.entity_id,
                                    KPI.kpi_code == data.kpi_code,
                                    KPI.financial_year == data.financial_year).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"KPI code {data.kpi_code} already exists for {data.financial_year}")
    kpi = KPI(entity_id=current_user.entity_id, kpi_code=data.kpi_code, description=data.description,
              unit_of_measure=data.unit_of_measure, annual_target=data.annual_target,
              financial_year=data.financial_year, status=data.status)
    if hasattr(kpi, 'directorate_id'): kpi.directorate_id = data.directorate_id
    db.add(kpi); db.flush()
    # Create quarterly records
    targets = [data.q1_target, data.q2_target, data.q3_target, data.q4_target]
    for q, target in enumerate(targets, 1):
        record = QuarterlyRecord(kpi_id=kpi.kpi_id, quarter=q,
                                  milestone_target=target or (data.annual_target / 4))
        db.add(record)
    db.commit(); db.refresh(kpi)
    return {"kpi_id": kpi.kpi_id, "message": "KPI created with quarterly targets"}

@pkd_router.put("/kpis/{kpi_id}/quarterly")
def update_quarterly(kpi_id: int, data: QuarterlyUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    kpi = db.query(KPI).filter(KPI.kpi_id == kpi_id, KPI.entity_id == current_user.entity_id).first()
    if not kpi:
        raise HTTPException(status_code=404, detail="KPI not found")
    record = db.query(QuarterlyRecord).filter(QuarterlyRecord.kpi_id == kpi_id, QuarterlyRecord.quarter == data.quarter).first()
    if not record:
        record = QuarterlyRecord(kpi_id=kpi_id, quarter=data.quarter); db.add(record)
    record.actual_achievement = data.actual_achievement
    # Calculate traffic light
    if record.milestone_target and record.milestone_target > 0:
        pct = (data.actual_achievement / float(record.milestone_target)) * 100
        record.traffic_light = "Green" if pct >= 80 else ("Amber" if pct >= 50 else "Red")
    db.commit()
    return {"message": "Quarterly actual updated", "traffic_light": record.traffic_light}

@pkd_router.get("/financial-years")
def get_pkd_years(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    years = db.query(KPI.financial_year).filter(KPI.entity_id == current_user.entity_id).distinct().order_by(KPI.financial_year.desc()).all()
    return [y[0] for y in years]


# ── ERP ──
erp_router = APIRouter(prefix="/api/erp", tags=["Executive Reporting Portal"])

@erp_router.get("/metrics")
def get_metrics(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    metrics = db.query(MetricSnapshot).filter(MetricSnapshot.entity_id == current_user.entity_id).order_by(MetricSnapshot.captured_at.desc()).limit(100).all()
    return [{"snapshot_id": m.snapshot_id, "metric_source": m.metric_source, "metric_key": m.metric_key,
             "metric_value": float(m.metric_value) if m.metric_value else None,
             "metric_text": m.metric_text, "alert_level": m.alert_level,
             "period": str(m.period) if m.period else None} for m in metrics]


# ── Users ──
users_router = APIRouter(prefix="/api/users", tags=["User Management"])

@users_router.get("/")
def get_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    users = db.query(User).filter(User.entity_id == current_user.entity_id, User.is_active == True).all()
    return [{"user_id": u.user_id, "email": u.email, "full_name": u.full_name, "role": u.role,
             "directorate": u.directorate.name if u.directorate else None} for u in users]

@users_router.get("/directorates")
def get_directorates(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    from ..models.core import Directorate
    dirs = db.query(Directorate).filter(Directorate.entity_id == current_user.entity_id, Directorate.is_active == True).all()
    return [{"directorate_id": d.directorate_id, "name": d.name, "code": d.code,
             "head_official": getattr(d, 'head_official', None)} for d in dirs]


# ── User CRUD ──
class UserCreate(BaseModel):
    email: str
    full_name: str
    role: str
    directorate_id: Optional[int] = None
    password: str = "Admin@2026!"
    is_active: bool = True

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[str] = None
    directorate_id: Optional[int] = None
    is_active: Optional[bool] = None
    password: Optional[str] = None

VALID_ROLES = ["System_Admin", "Accounting_Officer", "CFO", "Director", "Manager", "Officer", "Auditor", "Viewer"]

@users_router.post("/")
def create_user(data: UserCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer"):
        raise HTTPException(status_code=403, detail="Only System Admin or Accounting Officer can create users")
    if data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid roles: {', '.join(VALID_ROLES)}")
    existing = db.query(User).filter(User.email == data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Email {data.email} is already registered")
    hashed = pwd_context.hash(data.password)
    user = User(
        entity_id=current_user.entity_id,
        email=data.email,
        full_name=data.full_name,
        role=data.role,
        directorate_id=data.directorate_id if data.directorate_id and data.directorate_id != 0 else None,
        password_hash=hashed,
        is_active=data.is_active,
    )
    db.add(user); db.commit(); db.refresh(user)
    return {"user_id": user.user_id, "email": user.email, "full_name": user.full_name, "message": "User created successfully"}

@users_router.put("/{user_id}")
def update_user(user_id: int, data: UserUpdate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to update users")
    user = db.query(User).filter(User.user_id == user_id, User.entity_id == current_user.entity_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if data.role and data.role not in VALID_ROLES:
        raise HTTPException(status_code=400, detail=f"Invalid role. Valid roles: {', '.join(VALID_ROLES)}")
    if data.full_name is not None: user.full_name = data.full_name
    if data.role is not None: user.role = data.role
    if data.is_active is not None: user.is_active = data.is_active
    if data.directorate_id is not None:
        user.directorate_id = data.directorate_id if data.directorate_id != 0 else None
    if data.password:
        user.password_hash = pwd_context.hash(data.password)
    db.commit()
    return {"message": "User updated successfully"}

@users_router.delete("/{user_id}")
def deactivate_user(user_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    if user_id == current_user.user_id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account")
    user = db.query(User).filter(User.user_id == user_id, User.entity_id == current_user.entity_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = False
    db.commit()
    return {"message": f"User {user.full_name} deactivated"}


# ── Directorate CRUD ──
class DirectorateCreate(BaseModel):
    name: str
    code: Optional[str] = None
    head_official: Optional[str] = None

@users_router.post("/directorates")
def create_directorate(data: DirectorateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to create directorates")
    existing = db.query(Directorate).filter(Directorate.entity_id == current_user.entity_id,
                                             Directorate.name == data.name).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Directorate '{data.name}' already exists")
    directorate = Directorate(entity_id=current_user.entity_id, name=data.name,
                              code=data.code, is_active=True)
    if hasattr(directorate, 'head_official'): directorate.head_official = data.head_official
    db.add(directorate); db.commit(); db.refresh(directorate)
    return {"directorate_id": directorate.directorate_id, "name": directorate.name, "message": "Directorate created"}

@users_router.put("/directorates/{directorate_id}")
def update_directorate(directorate_id: int, data: DirectorateCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions to update directorates")
    d = db.query(Directorate).filter(Directorate.directorate_id == directorate_id,
                                      Directorate.entity_id == current_user.entity_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Directorate not found")
    d.name = data.name
    if data.code is not None: d.code = data.code
    if data.head_official is not None and hasattr(d, 'head_official'): d.head_official = data.head_official
    db.commit()
    return {"message": "Directorate updated"}

@users_router.delete("/directorates/{directorate_id}")
def deactivate_directorate(directorate_id: int, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ("System_Admin", "Accounting_Officer"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    d = db.query(Directorate).filter(Directorate.directorate_id == directorate_id,
                                      Directorate.entity_id == current_user.entity_id).first()
    if not d:
        raise HTTPException(status_code=404, detail="Directorate not found")
    d.is_active = False
    db.commit()
    return {"message": f"Directorate '{d.name}' deactivated"}
