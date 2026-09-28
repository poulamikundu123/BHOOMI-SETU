from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# Auth
class UserCreate(BaseModel):
    name: str
    email: str
    password: str
    role: str = "VIEWER"

class CitizenRegister(BaseModel):
    name: str
    email: str
    mobile: Optional[str] = None
    password: str
    state: Optional[str] = None
    district: Optional[str] = None
    preferred_language: Optional[str] = "English"

class UserLogin(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class UserOut(BaseModel):
    id: int
    name: str
    email: str
    mobile: Optional[str] = None
    role: str
    state: Optional[str] = None
    district: Optional[str] = None
    preferred_language: Optional[str] = None
    is_active: bool
    onboarding_complete: bool = False
    created_at: datetime
    class Config:
        from_attributes = True

class UserProfileUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    state: Optional[str] = None
    district: Optional[str] = None
    preferred_language: Optional[str] = None

# Documents
class DocumentOut(BaseModel):
    id: int
    doc_id: str
    filename: str
    status: str
    language: Optional[str]
    overall_confidence: Optional[float]
    ocr_confidence: Optional[float] = None
    extraction_confidence: Optional[float] = None
    validation_confidence: Optional[float] = None
    page_count: int
    file_size: Optional[int]
    uploaded_at: datetime
    processed_at: Optional[datetime]
    is_demo: bool
    citizen_upload: bool = False
    class Config:
        from_attributes = True

class ExtractedFieldOut(BaseModel):
    id: int
    field_name: str
    field_value: Optional[str]
    confidence: float
    status: str
    extraction_method: str
    is_corrected: bool
    class Config:
        from_attributes = True

class ValidationResultOut(BaseModel):
    id: int
    field_name: str
    rule: str
    status: str
    message: str
    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    field_name: str
    new_value: str
    reason: Optional[str] = None

class ReviewOut(BaseModel):
    id: int
    field_name: str
    old_value: Optional[str]
    new_value: Optional[str]
    action: str
    reason: Optional[str]
    timestamp: datetime
    class Config:
        from_attributes = True

class LandRecordOut(BaseModel):
    id: int
    record_id: str
    owner_name: str
    father_name: Optional[str]
    khata_number: Optional[str]
    khasra_number: Optional[str]
    survey_number: Optional[str]
    plot_number: Optional[str]
    village: Optional[str]
    mouza: Optional[str]
    block: Optional[str] = None
    district: Optional[str]
    state: Optional[str]
    area: Optional[float]
    unit: Optional[str]
    land_type: Optional[str]
    registration_date: Optional[str]
    mutation_number: Optional[str]
    document_number: Optional[str]
    geo_lat: Optional[float]
    geo_lng: Optional[float]
    geometry_json: Optional[str]
    status: str
    citizen_id: Optional[int] = None
    created_at: datetime
    class Config:
        from_attributes = True

class NotificationOut(BaseModel):
    id: int
    user_id: Optional[int]
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime
    doc_id: Optional[str]
    class Config:
        from_attributes = True

class CorrectionRequestCreate(BaseModel):
    land_record_id: int
    field_name: str
    current_value: Optional[str] = None
    proposed_value: str
    reason: Optional[str] = None

class CorrectionRequestOut(BaseModel):
    id: int
    land_record_id: int
    citizen_id: int
    field_name: str
    current_value: Optional[str]
    proposed_value: str
    reason: Optional[str]
    status: str
    created_at: datetime
    reviewed_at: Optional[datetime]
    review_notes: Optional[str]
    class Config:
        from_attributes = True