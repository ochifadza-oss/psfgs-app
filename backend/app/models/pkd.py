from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class KPI(Base):
    __tablename__ = "pkd_kpi"
    kpi_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    financial_year = Column(String(10), nullable=False)
    kpi_code = Column(String(30))
    description = Column(Text)
    unit_of_measure = Column(String(50))
    annual_target = Column(Numeric(18, 4))
    directorate_id = Column(Integer, ForeignKey("core_directorate.directorate_id"))
    idp_objective_id = Column(Integer)
    status = Column(Enum("Active", "Suspended", "Achieved", "Not_Achieved"), default="Active")
    created_at = Column(DateTime, default=datetime.utcnow)
    quarters = relationship("QuarterlyRecord", back_populates="kpi")


class QuarterlyRecord(Base):
    __tablename__ = "pkd_quarterly_record"
    record_id = Column(Integer, primary_key=True, autoincrement=True)
    kpi_id = Column(Integer, ForeignKey("pkd_kpi.kpi_id"), nullable=False)
    quarter = Column(Integer, nullable=False)
    milestone_target = Column(Numeric(18, 4))
    actual_achievement = Column(Numeric(18, 4))
    variance_pct = Column(Numeric(8, 4))
    traffic_light = Column(Enum("Green", "Amber", "Red"), default="Green")
    evidence_path = Column(String(512))
    narrative = Column(Text)
    ai_commentary = Column(Text)
    submitted_by = Column(Integer, ForeignKey("core_user.user_id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    kpi = relationship("KPI", back_populates="quarters")
