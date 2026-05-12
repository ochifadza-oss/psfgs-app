from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class MisconductCase(Base):
    __tablename__ = "cmt_misconduct_case"
    case_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    case_reference = Column(String(30))
    misconduct_type = Column(Enum("Irregular_Expenditure", "Fruitless_Wasteful", "Fraud", "Theft", "Negligence", "Policy_Violation", "Other"), nullable=False)
    accused_official_id = Column(Integer, ForeignKey("core_user.user_id"))
    financial_impact = Column(Numeric(18, 2), default=0)
    referral_source = Column(Enum("AGSA", "Internal_Audit", "Whistleblower", "Management", "MPAC", "Treasury"), nullable=False)
    stage = Column(Enum("Registered", "Investigation", "Disciplinary_Hearing", "Appeal", "Recovery", "Closed"), default="Registered")
    outcome = Column(Enum("Pending", "Guilty", "Not_Guilty", "Settled", "Resigned", "Dismissed"), default="Pending")
    registered_by = Column(Integer, ForeignKey("core_user.user_id"))
    registered_date = Column(DateTime)
    closed_date = Column(DateTime)
    ifw_item_id = Column(Integer, ForeignKey("ifw_item.item_id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    accused_official = relationship("User", foreign_keys=[accused_official_id])
