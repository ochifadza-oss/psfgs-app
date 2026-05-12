from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class IFWItem(Base):
    __tablename__ = "ifw_item"
    item_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    reference_number = Column(String(30))
    ifwe_type = Column(Enum("Irregular", "Fruitless_Wasteful", "Unauthorised"), nullable=False)
    amount = Column(Numeric(18, 2), nullable=False)
    financial_year = Column(String(10))
    description = Column(Text)
    root_cause = Column(Text)
    responsible_official_id = Column(Integer, ForeignKey("core_user.user_id"))
    ai_root_cause_code = Column(String(30))
    status = Column(Enum("Identified", "Under_Investigation", "Condonation_Applied", "Condoned", "Not_Condoned", "Recovery_In_Progress", "Recovered", "Written_Off"), default="Identified")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    responsible_official = relationship("User", foreign_keys=[responsible_official_id])
    condonations = relationship("IFWCondonation", back_populates="item")


class IFWCondonation(Base):
    __tablename__ = "ifw_condonation"
    cond_id = Column(Integer, primary_key=True, autoincrement=True)
    item_id = Column(Integer, ForeignKey("ifw_item.item_id"), nullable=False)
    application_date = Column(DateTime)
    council_resolution_no = Column(String(50))
    nt_submission_date = Column(DateTime)
    nt_reference = Column(String(50))
    outcome = Column(Enum("Pending", "Condoned", "Not_Condoned", "Withdrawn"), default="Pending")
    outcome_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    item = relationship("IFWItem", back_populates="condonations")
