from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel
from ..database import get_db
from ..models.core import User
from ..utils.auth import verify_password, hash_password, create_access_token, get_current_user

router = APIRouter(prefix="/api/auth", tags=["Authentication"])


class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    full_name: str
    role: str
    entity_id: int


class UserResponse(BaseModel):
    user_id: int
    email: str
    full_name: str
    role: str
    entity_id: int
    directorate_id: int | None
    is_active: bool

    class Config:
        from_attributes = True


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str


@router.post("/login", response_model=TokenResponse)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == form_data.username).first()
    if not user or not verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    user.last_login = datetime.utcnow()
    db.commit()
    token = create_access_token(data={"sub": str(user.user_id), "entity_id": user.entity_id, "role": user.role})
    return TokenResponse(
        access_token=token, token_type="bearer",
        user_id=user.user_id, full_name=user.full_name,
        role=user.role, entity_id=user.entity_id
    )


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user


@router.post("/change-password")
def change_password(req: ChangePasswordRequest, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if not verify_password(req.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.password_hash = hash_password(req.new_password)
    db.commit()
    return {"message": "Password changed successfully"}
