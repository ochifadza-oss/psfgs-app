from sqlalchemy import Column, Integer, String, DateTime, Enum, Text, ForeignKey
from datetime import datetime
from ..database import Base


class S71Report(Base):
    __tablename__ = "s71_report"
    report_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    period = Column(DateTime, nullable=False)
    status = Column(Enum("Draft", "CFO_Review", "AO_Approval", "Submitted", "Late"), default="Draft")
    initiated_by = Column(Integer, ForeignKey("core_user.user_id"))
    approved_by = Column(Integer, ForeignKey("core_user.user_id"))
    submitted_date = Column(DateTime)
    days_after_month_end = Column(Integer)
    nt_reference = Column(String(50))
    ai_narrative_json = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
