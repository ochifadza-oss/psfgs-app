from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, Numeric, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class ComplianceRule(Base):
    __tablename__ = "scc_compliance_rule"
    rule_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    rule_name = Column(String(200), nullable=False)
    rule_description = Column(Text)
    category = Column(Enum("Value_Threshold", "Documentation", "Supplier_Verification", "Budget_Availability", "Delegation", "BEE_Compliance"), nullable=False)
    threshold_min = Column(Numeric(18, 2))
    threshold_max = Column(Numeric(18, 2))
    is_active = Column(Boolean, default=True)


class Requisition(Base):
    __tablename__ = "scc_requisition"
    req_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    request_date = Column(DateTime, nullable=False)
    requester_id = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    description = Column(Text)
    estimated_value = Column(Numeric(18, 2), default=0)
    supplier_name = Column(String(200))
    procurement_method = Column(Enum("Petty_Cash", "Written_Quotation", "Competitive_Bid", "Single_Source", "Emergency", "Deviation"), default="Written_Quotation")
    compliance_score = Column(Integer, default=0)
    status = Column(Enum("Draft", "Checking", "Passed", "Failed", "Deviation_Requested", "Approved", "Rejected"), default="Draft")
    ai_risk_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    requester = relationship("User", foreign_keys=[requester_id])
    checks = relationship("ComplianceCheck", back_populates="requisition")


class ComplianceCheck(Base):
    __tablename__ = "scc_compliance_check"
    check_id = Column(Integer, primary_key=True, autoincrement=True)
    req_id = Column(Integer, ForeignKey("scc_requisition.req_id"), nullable=False)
    check_type = Column(Enum("Value_Threshold", "Documentation", "Supplier_Verification", "Budget_Availability", "Delegation", "BEE_Compliance"), nullable=False)
    result = Column(Enum("Pass", "Fail", "Warning", "Not_Applicable"), nullable=False)
    failure_reason = Column(String(500))
    rule_id = Column(Integer, ForeignKey("scc_compliance_rule.rule_id"))
    checked_at = Column(DateTime, default=datetime.utcnow)
    requisition = relationship("Requisition", back_populates="checks")
