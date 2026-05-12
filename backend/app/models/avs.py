from sqlalchemy import Column, Integer, String, DateTime, Enum, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime
from ..database import Base


class AssetCategory(Base):
    __tablename__ = "avs_asset_category"
    category_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    category_name = Column(String(100), nullable=False)
    grap_class = Column(String(50))
    useful_life_default = Column(Integer)
    depreciation_method = Column(Enum("Straight_Line", "Diminishing_Balance", "Units_of_Production"), default="Straight_Line")


class Location(Base):
    __tablename__ = "avs_location"
    location_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    location_name = Column(String(200), nullable=False)
    building = Column(String(100))
    floor_room = Column(String(50))
    gps_lat = Column(Numeric(10, 7))
    gps_lng = Column(Numeric(10, 7))


class Asset(Base):
    __tablename__ = "avs_asset"
    asset_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    asset_number = Column(String(30))
    barcode = Column(String(60))
    description = Column(String(255), nullable=False)
    category_id = Column(Integer, ForeignKey("avs_asset_category.category_id"))
    acquisition_date = Column(DateTime)
    cost = Column(Numeric(18, 2), default=0)
    useful_life_months = Column(Integer)
    residual_value = Column(Numeric(18, 2), default=0)
    location_id = Column(Integer, ForeignKey("avs_location.location_id"))
    condition = Column(Enum("New", "Good", "Fair", "Poor", "Unserviceable", "Disposed"), default="Good")
    responsible_official = Column(Integer, ForeignKey("core_user.user_id"))
    status = Column(Enum("Active", "Disposed", "Transferred", "Missing", "Ghost"), default="Active")
    ai_condition_score = Column(Integer)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    category = relationship("AssetCategory", foreign_keys=[category_id])
    location = relationship("Location", foreign_keys=[location_id])


class Depreciation(Base):
    __tablename__ = "avs_depreciation"
    record_id = Column(Integer, primary_key=True, autoincrement=True)
    asset_id = Column(Integer, ForeignKey("avs_asset.asset_id"), nullable=False)
    period = Column(DateTime, nullable=False)
    opening_carrying_value = Column(Numeric(18, 2))
    depreciation_charge = Column(Numeric(18, 2))
    impairment = Column(Numeric(18, 2), default=0)
    closing_carrying_value = Column(Numeric(18, 2))
    journal_reference = Column(String(50))


class VerificationSession(Base):
    __tablename__ = "avs_verification_session"
    session_id = Column(Integer, primary_key=True, autoincrement=True)
    entity_id = Column(Integer, ForeignKey("core_entity.entity_id"), nullable=False)
    session_name = Column(String(100), nullable=False)
    conducted_by = Column(Integer, ForeignKey("core_user.user_id"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    status = Column(Enum("Planned", "In_Progress", "Completed", "Cancelled"), default="Planned")
    assets_verified = Column(Integer, default=0)
    assets_not_found = Column(Integer, default=0)
    ghost_assets_found = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
