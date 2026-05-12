from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Policy(Base):
    __tablename__ = "pcr_policy"
    policy_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    policy_name = Column(String(200), nullable=False)
    category = Column(Enum("Financial", "SCM", "HR", "IT", "Governance", "Risk", "Performance", "Other"), nullable=False)
    current_version = Column(String(10))
    effective_date = Column(DateTime)
    review_date = Column(DateTime)
    owner_id = Column(Integer, ForeignKey("core_user.user_id"))
    council_minute_ref = Column(String(80))
    status = Column(Enum("Draft", "Active", "Under_Review", "Expired", "Superseded"), default="Draft")
    document_path = Column(String(512))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    owner = relationship("User", foreign_keys=[owner_id])
