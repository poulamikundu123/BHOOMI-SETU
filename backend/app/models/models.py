from sqlalchemy import Column, Integer, String, Float, Text, DateTime, Boolean, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database.database import Base
import enum

class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OFFICER = "OFFICER"
    REVIEWER = "REVIEWER"
    CITIZEN = "CITIZEN"
    VIEWER = "VIEWER"  # kept for backwards compatibility

class DocumentStatus(str, enum.Enum):
    UPLOADED = "UPLOADED"
    PREPROCESSING = "PREPROCESSING"
    LAYOUT_DETECTION = "LAYOUT_DETECTION"
    OCR = "OCR"
    NLP = "NLP"
    VALIDATION = "VALIDATION"
    REVIEW = "REVIEW"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"

class FieldStatus(str, enum.Enum):
    VALID = "VALID"
    WARNING = "WARNING"
    INVALID = "INVALID"
    NEEDS_REVIEW = "NEEDS_REVIEW"

class CorrectionStatus(str, enum.Enum):
    SUBMITTED = "SUBMITTED"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    NEEDS_MORE_INFORMATION = "NEEDS_MORE_INFORMATION"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, index=True, nullable=False)
    mobile = Column(String(20), nullable=True)
    password_hash = Column(String(500), nullable=False)
    role = Column(String(20), default="CITIZEN")
    state = Column(String(200), nullable=True)
    district = Column(String(200), nullable=True)
    preferred_language = Column(String(50), nullable=True)
    aadhaar_last4 = Column(String(4), nullable=True)
    is_active = Column(Boolean, default=True)
    onboarding_complete = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    documents = relationship("Document", back_populates="uploader")
    reviews = relationship("Review", back_populates="reviewer")
    notifications = relationship("Notification", back_populates="user")
    correction_requests = relationship("CorrectionRequest", back_populates="citizen", foreign_keys="CorrectionRequest.citizen_id")

class Document(Base):
    __tablename__ = "documents"
    id = Column(Integer, primary_key=True, index=True)
    doc_id = Column(String(50), unique=True, index=True)
    filename = Column(String(500))
    file_path = Column(String(1000))
    processed_path = Column(String(1000), nullable=True)
    status = Column(String(30), default="UPLOADED")
    language = Column(String(100), nullable=True)
    uploaded_by = Column(Integer, ForeignKey("users.id"))
    uploaded_at = Column(DateTime, server_default=func.now())
    processed_at = Column(DateTime, nullable=True)
    overall_confidence = Column(Float, nullable=True)
    ocr_confidence = Column(Float, nullable=True)
    extraction_confidence = Column(Float, nullable=True)
    validation_confidence = Column(Float, nullable=True)
    page_count = Column(Integer, default=1)
    file_size = Column(Integer, nullable=True)
    ocr_raw_text = Column(Text, nullable=True)
    processing_notes = Column(Text, nullable=True)
    is_demo = Column(Boolean, default=False)
    citizen_upload = Column(Boolean, default=False)  # uploaded by a citizen
    uploader = relationship("User", back_populates="documents")
    fields = relationship("ExtractedField", back_populates="document", cascade="all, delete-orphan")
    validations = relationship("ValidationResult", back_populates="document", cascade="all, delete-orphan")
    reviews = relationship("Review", back_populates="document", cascade="all, delete-orphan")
    land_record = relationship("LandRecord", back_populates="document", uselist=False)

class ExtractedField(Base):
    __tablename__ = "extracted_fields"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    field_name = Column(String(100))
    field_value = Column(Text, nullable=True)
    confidence = Column(Float, default=0.0)
    status = Column(String(20), default="VALID")
    source_bbox = Column(String(200), nullable=True)
    extraction_method = Column(String(50), default="regex")
    is_corrected = Column(Boolean, default=False)
    document = relationship("Document", back_populates="fields")

class ValidationResult(Base):
    __tablename__ = "validation_results"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    field_name = Column(String(100))
    rule = Column(String(200))
    status = Column(String(20))
    message = Column(Text)
    created_at = Column(DateTime, server_default=func.now())
    document = relationship("Document", back_populates="validations")

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    field_name = Column(String(100))
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    action = Column(String(20), default="CORRECTED")
    reason = Column(Text, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())
    document = relationship("Document", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

class LandRecord(Base):
    __tablename__ = "land_records"
    id = Column(Integer, primary_key=True, index=True)
    record_id = Column(String(50), unique=True, index=True)
    document_id = Column(Integer, ForeignKey("documents.id"), nullable=True)
    citizen_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # owner citizen
    owner_name = Column(String(500))
    father_name = Column(String(500), nullable=True)
    khata_number = Column(String(100), nullable=True, index=True)
    khasra_number = Column(String(100), nullable=True, index=True)
    survey_number = Column(String(100), nullable=True)
    plot_number = Column(String(100), nullable=True, index=True)
    village = Column(String(200), nullable=True, index=True)
    mouza = Column(String(200), nullable=True)
    block = Column(String(200), nullable=True)
    district = Column(String(200), nullable=True, index=True)
    state = Column(String(200), nullable=True)
    area = Column(Float, nullable=True)
    unit = Column(String(50), nullable=True)
    land_type = Column(String(100), nullable=True)
    registration_date = Column(String(50), nullable=True)
    mutation_number = Column(String(100), nullable=True)
    document_number = Column(String(100), nullable=True)
    geo_lat = Column(Float, nullable=True)
    geo_lng = Column(Float, nullable=True)
    geometry_json = Column(Text, nullable=True)
    status = Column(String(30), default="PENDING_REVIEW")
    created_at = Column(DateTime, server_default=func.now())
    document = relationship("Document", back_populates="land_record")
    citizen = relationship("User", foreign_keys=[citizen_id])
    correction_requests = relationship("CorrectionRequest", back_populates="land_record")

class Notification(Base):
    __tablename__ = "notifications"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String(200))
    message = Column(Text)
    type = Column(String(30), default="INFO")
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    doc_id = Column(String(50), nullable=True)
    user = relationship("User", back_populates="notifications")

class CorrectionRequest(Base):
    __tablename__ = "correction_requests"
    id = Column(Integer, primary_key=True, index=True)
    land_record_id = Column(Integer, ForeignKey("land_records.id"))
    citizen_id = Column(Integer, ForeignKey("users.id"))
    field_name = Column(String(100))
    current_value = Column(Text, nullable=True)
    proposed_value = Column(Text)
    reason = Column(Text, nullable=True)
    supporting_document = Column(String(500), nullable=True)
    status = Column(String(30), default="SUBMITTED")
    created_at = Column(DateTime, server_default=func.now())
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
    review_notes = Column(Text, nullable=True)
    land_record = relationship("LandRecord", back_populates="correction_requests")
    citizen = relationship("User", foreign_keys=[citizen_id], back_populates="correction_requests")
    reviewer = relationship("User", foreign_keys=[reviewed_by])