from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, Text, JSON, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class Entity(Base):
    __tablename__ = "core_entity"
    entity_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_name = Column(String(200), nullable=False)
    logo_path = Column(String(255))
    abbreviation = Column(String(20))
    demarcation_code = Column(String(10))
    physical_address = Column(Text)
    postal_address = Column(Text)
    phone = Column(String(30))
    fax = Column(String(30))
    email = Column(String(150))
    website = Column(String(200))
    municipal_manager = Column(String(100))
    cfo_name = Column(String(100))
    mayor_name = Column(String(100))
    speaker_name = Column(String(100))
    entity_type = Column(Enum("Metropolitan", "District", "Local", "Provincial", "National"), nullable=False)
    legislation_type = Column(Enum("MFMA", "PFMA"), default="MFMA")
    province = Column(String(50))
    financial_year_end = Column(Integer, default=6)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Directorate(Base):
    __tablename__ = "core_directorate"
    directorate_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(20))
    head_official = Column(String(100))
    is_active = Column(Boolean, default=True)


class User(Base):
    __tablename__ = "core_user"
    user_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    email = Column(String(150), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(100), nullable=False)
    role = Column(Enum("System_Admin", "Accounting_Officer", "CFO", "Director", "Manager", "Officer", "Auditor", "Viewer"), default="Officer")
    directorate_id = Column(Integer, ForeignKey("core_directorate.directorate_id"))
    two_fa_enabled = Column(Boolean, default=False)
    last_login = Column(DateTime)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    directorate = relationship("Directorate", foreign_keys=[directorate_id])


class AuditLog(Base):
    __tablename__ = "core_audit_log"
    log_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, nullable=False)
    user_id = Column(Integer)
    application = Column(String(10), nullable=False)
    table_name = Column(String(60), nullable=False)
    record_id = Column(Integer)
    action = Column(Enum("INSERT", "UPDATE", "DELETE"), nullable=False)
    before_json = Column(JSON)
    after_json = Column(JSON)
    ip_address = Column(String(45))
    logged_at = Column(DateTime, default=datetime.utcnow)


class Notification(Base):
    __tablename__ = "core_notification"
    notif_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    recipient_id = Column(Integer, ForeignKey("core_user.user_id"), nullable=False)
    application = Column(String(10), nullable=False)
    notif_type = Column(Enum("INFO", "WARNING", "ACTION_REQUIRED", "ESCALATION", "DEADLINE"), nullable=False)
    subject = Column(String(200), nullable=False)
    body = Column(Text)
    channel = Column(Enum("EMAIL", "IN_APP", "BOTH"), default="IN_APP")
    sent_at = Column(DateTime, default=datetime.utcnow)
    read_at = Column(DateTime)
