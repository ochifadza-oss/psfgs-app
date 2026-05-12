from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey
from datetime import datetime
from ..database import Base


class MetricSnapshot(Base):
    __tablename__ = "erp_metric_snapshot"
    snapshot_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    metric_source = Column(String(10))
    metric_key = Column(String(60))
    metric_value = Column(Numeric(18, 4))
    metric_text = Column(String(200))
    alert_level = Column(Enum("Normal", "Watch", "Warning", "Critical"), default="Normal")
    period = Column(DateTime)
    captured_at = Column(DateTime, default=datetime.utcnow)
