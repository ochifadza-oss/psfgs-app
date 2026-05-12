from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Text, JSON, ForeignKey, Numeric
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class AuditYear(Base):
    __tablename__ = "aft_audit_year"
    year_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    financial_year = Column(String(10), nullable=False)
    ag_letter_uploaded = Column(Boolean, default=False)
    ag_letter_path = Column(String(512))
    ai_extraction_status = Column(Enum("Not_Started", "Processing", "Completed", "Failed"), default="Not_Started")
    total_findings = Column(Integer, default=0)
    closed_findings = Column(Integer, default=0)
    audit_opinion = Column(Enum("Clean", "Unqualified_With_Findings", "Qualified", "Adverse", "Disclaimer"))
    created_at = Column(DateTime, default=datetime.utcnow)
    findings = relationship("Finding", back_populates="audit_year")


class Finding(Base):
    __tablename__ = "aft_finding"
    finding_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    audit_year_id = Column(Integer, ForeignKey("aft_audit_year.year_id"), nullable=False)
    ag_ref_number = Column(String(30))
    description = Column(Text, nullable=False)
    finding_type = Column(Enum("Material_Irregularity", "Significant", "Other", "Compliance", "Performance"), nullable=False)
    severity = Column(Enum("Critical", "High", "Medium", "Low"), nullable=False)
    root_cause = Column(Text)
    financial_impact = Column(Numeric(18, 2), default=0)
    directorate_id = Column(Integer, ForeignKey("core_directorate.directorate_id"))
    status = Column(Enum("New", "Assigned", "In_Progress", "Evidence_Submitted", "Under_Review", "Closed", "Overdue"), default="New")
    is_repeat = Column(Boolean, default=False)
    repeat_years_count = Column(Integer, default=0)
    ai_classification = Column(JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    audit_year = relationship("AuditYear", back_populates="findings")
    directorate = relationship("Directorate", foreign_keys=[directorate_id])
    assignments = relationship("Assignment", back_populates="finding")
    evidences = relationship("Evidence", back_populates="finding")


class Assignment(Base):
    __tablename__ = "aft_assignment"
    assignment_id = Column(Integer, primary_key=True, autoincrement=True)
    finding_id = Column(Integer, ForeignKey("aft_finding.finding_id"), nullable=False)
    assignee_id = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    assigned_by = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    due_date = Column(DateTime, nullable=False)
    escalation_level = Column(Integer, default=0)
    escalated_to = Column(Integer, ForeignKey("core_user.user_id"))
    status = Column(Enum("Active", "Completed", "Escalated", "Reassigned"), default="Active")
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    finding = relationship("Finding", back_populates="assignments")
    assignee = relationship("User", foreign_keys=[assignee_id])


class Evidence(Base):
    __tablename__ = "aft_evidence"
    evidence_id = Column(Integer, primary_key=True, autoincrement=True)
    finding_id = Column(Integer, ForeignKey("aft_finding.finding_id"), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(512))
    file_size_kb = Column(Integer)
    uploaded_by = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    upload_date = Column(DateTime, default=datetime.utcnow)
    status = Column(Enum("Uploaded", "Accepted", "Rejected"), default="Uploaded")
    reviewed_by = Column(Integer, ForeignKey("core_user.user_id"))
    reviewer_notes = Column(Text)
    finding = relationship("Finding", back_populates="evidences")


class Response(Base):
    __tablename__ = "aft_response"
    response_id = Column(Integer, primary_key=True, autoincrement=True)
    finding_id = Column(Integer, ForeignKey("aft_finding.finding_id"), nullable=False)
    response_text = Column(Text, nullable=False)
    drafted_by = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    is_ai_generated = Column(Boolean, default=False)
    approved_by = Column(Integer, ForeignKey("core_user.user_id"))
    approved_at = Column(DateTime)
    version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
