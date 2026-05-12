from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Budget(Base):
    __tablename__ = "bvm_budget"
    budget_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    financial_year = Column(String(10), nullable=False)
    vote_code = Column(String(20), nullable=False)
    vote_description = Column(String(200))
    directorate_id = Column(Integer, ForeignKey("core_directorate.directorate_id"))
    original_budget = Column(Numeric(18, 2), default=0)
    adjusted_budget = Column(Numeric(18, 2), default=0)
    virement_total = Column(Numeric(18, 2), default=0)
    budget_type = Column(Enum("Operating", "Capital"), default="Operating")
    created_at = Column(DateTime, default=datetime.utcnow)
    directorate = relationship("Directorate", foreign_keys=[directorate_id])
    expenditures = relationship("Expenditure", back_populates="budget")


class Expenditure(Base):
    __tablename__ = "bvm_expenditure"
    exp_id = Column(Integer, primary_key=True, autoincrement=True)
    budget_id = Column(Integer, ForeignKey("bvm_budget.budget_id"), nullable=False)
    period = Column(DateTime, nullable=False)
    actual_spend = Column(Numeric(18, 2), default=0)
    commitment = Column(Numeric(18, 2), default=0)
    projected_yearend = Column(Numeric(18, 2), default=0)
    ytd_variance_pct = Column(Numeric(8, 4), default=0)
    import_batch_id = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    budget = relationship("Budget", back_populates="expenditures")
