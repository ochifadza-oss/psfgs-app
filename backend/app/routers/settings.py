import os
import uuid
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
from ..database import get_db
from ..models.core import User, Entity
from ..utils.auth import get_current_user

router = APIRouter(prefix="/api/settings", tags=["Settings"])

UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "uploads", "logos")
os.makedirs(UPLOAD_DIR, exist_ok=True)


class EntitySettingsResponse(BaseModel):
    entity_id: int
    entity_name: str
    logo_path: str | None
    abbreviation: str | None
    demarcation_code: str | None
    entity_type: str
    legislation_type: str
    province: str | None
    financial_year_end: int
    physical_address: str | None
    postal_address: str | None
    phone: str | None
    fax: str | None
    email: str | None
    website: str | None
    municipal_manager: str | None
    cfo_name: str | None
    mayor_name: str | None
    speaker_name: str | None

    class Config:
        from_attributes = True


class EntitySettingsUpdate(BaseModel):
    entity_name: str | None = None
    abbreviation: str | None = None
    demarcation_code: str | None = None
    entity_type: str | None = None
    legislation_type: str | None = None
    province: str | None = None
    financial_year_end: int | None = None
    physical_address: str | None = None
    postal_address: str | None = None
    phone: str | None = None
    fax: str | None = None
    email: str | None = None
    website: str | None = None
    municipal_manager: str | None = None
    cfo_name: str | None = None
    mayor_name: str | None = None
    speaker_name: str | None = None


class EntityBrandingResponse(BaseModel):
    entity_name: str
    logo_path: str | None
    abbreviation: str | None

    class Config:
        from_attributes = True


@router.get("/branding", response_model=EntityBrandingResponse)
def get_entity_branding(db: Session = Depends(get_db)):
    """Public endpoint for login page branding - no auth required."""
    entity = db.query(Entity).filter(Entity.is_active == True).first()
    if not entity:
        return EntityBrandingResponse(entity_name="Municipality", logo_path=None, abbreviation=None)
    return entity


@router.get("/entity", response_model=EntitySettingsResponse)
def get_entity_settings(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    entity = db.query(Entity).filter(Entity.entity_id == current_user.entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    return entity


@router.put("/entity", response_model=EntitySettingsResponse)
def update_entity_settings(
    updates: EntitySettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO"):
        raise HTTPException(status_code=403, detail="Only System Admin, Accounting Officer, or CFO can update entity settings")
    entity = db.query(Entity).filter(Entity.entity_id == current_user.entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")
    update_data = updates.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(entity, field, value)
    db.commit()
    db.refresh(entity)
    return entity


@router.post("/entity/logo")
def upload_logo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role not in ("System_Admin", "Accounting_Officer", "CFO"):
        raise HTTPException(status_code=403, detail="Only System Admin, Accounting Officer, or CFO can upload logo")
    if file.content_type not in ("image/png", "image/jpeg", "image/svg+xml", "image/webp"):
        raise HTTPException(status_code=400, detail="Logo must be PNG, JPEG, SVG, or WebP")
    if file.size and file.size > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Logo must be under 2MB")

    entity = db.query(Entity).filter(Entity.entity_id == current_user.entity_id).first()
    if not entity:
        raise HTTPException(status_code=404, detail="Entity not found")

    # Remove old logo if exists
    if entity.logo_path:
        old_path = os.path.join(UPLOAD_DIR, os.path.basename(entity.logo_path))
        if os.path.exists(old_path):
            os.remove(old_path)

    ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "png"
    filename = f"entity_{entity.entity_id}_{uuid.uuid4().hex[:8]}.{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as f:
        f.write(file.file.read())

    entity.logo_path = f"/api/settings/logo/{filename}"
    db.commit()
    return {"message": "Logo uploaded successfully", "logo_path": entity.logo_path}


@router.get("/logo/{filename}")
def get_logo(filename: str):
    filepath = os.path.join(UPLOAD_DIR, filename)
    if not os.path.exists(filepath):
        raise HTTPException(status_code=404, detail="Logo not found")
    return FileResponse(filepath)
