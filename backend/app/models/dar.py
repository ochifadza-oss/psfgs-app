from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Delegation(Base):
    __tablename__ = "dar_delegation"
    delegation_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    delegator_id = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    delegate_id = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    power_description = Column(Text, nullable=False)
    financial_limit = Column(Numeric(18, 2))
    effective_date = Column(DateTime, nullable=False)
    expiry_date = Column(DateTime)
    legislative_reference = Column(String(100))
    parent_delegation_id = Column(Integer, ForeignKey("dar_delegation.delegation_id"))
    status = Column(Enum("Active", "Expired", "Revoked", "Suspended"), default="Active")
    council_resolution = Column(String(80))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    delegator = relationship("User", foreign_keys=[delegator_id])
    delegate = relationship("User", foreign_keys=[delegate_id])
