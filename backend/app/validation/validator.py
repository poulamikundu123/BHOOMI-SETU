"""
Validation Engine — validates extracted land record fields.
"""
import re
from typing import List, Dict, Any
from dataclasses import dataclass

@dataclass
class ValidationResult:
    field: str
    value: str
    status: str  # VALID | WARNING | INVALID | NEEDS_REVIEW
    confidence: float
    message: str
    rule: str

KNOWN_DISTRICTS = {
    "West Bengal": ["Darjeeling", "Kolkata", "Murshidabad", "Purba Bardhaman", "Nadia", "Hooghly",
                    "Howrah", "Jalpaiguri", "Cooch Behar", "Siliguri", "Paschim Bardhaman"],
    "Maharashtra": ["Mumbai", "Pune", "Nagpur", "Nashik", "Aurangabad", "Solapur"],
    "Rajasthan": ["Jaipur", "Jodhpur", "Udaipur", "Kota", "Ajmer", "Bikaner"],
    "Tamil Nadu": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
}

VALID_LAND_TYPES = ["Agricultural", "Residential", "Commercial", "Industrial",
                    "Wasteland", "Forest", "Mixed", "Plantation", "Grazing"]

VALID_UNITS = ["Acre", "Bigha", "Hectare", "Square Meter", "Square Feet", "Guntha",
               "एकड़", "बीघा", "हेक्टेयर"]

def validate_khata_number(value: str) -> ValidationResult:
    if not value:
        return ValidationResult("khata_number", value, "INVALID", 0.0, "Khata number is missing", "required_field")
    if re.match(r"^\d{1,6}(?:/\d+)?$", value.strip()):
        return ValidationResult("khata_number", value, "VALID", 0.97, "Valid khata number format", "format_check")
    return ValidationResult("khata_number", value, "WARNING", 0.65, "Non-standard khata number format", "format_check")

def validate_khasra_number(value: str) -> ValidationResult:
    if not value:
        return ValidationResult("khasra_number", value, "NEEDS_REVIEW", 0.3, "Khasra number is missing", "required_field")
    if re.match(r"^\d{1,6}(?:/\d+)?(?:-\d+)?$", value.strip()):
        return ValidationResult("khasra_number", value, "VALID", 0.96, "Valid khasra number format", "format_check")
    return ValidationResult("khasra_number", value, "WARNING", 0.60, "Non-standard khasra number format", "format_check")

def validate_area(value: str) -> ValidationResult:
    if not value:
        return ValidationResult("area", value, "NEEDS_REVIEW", 0.3, "Area is missing", "required_field")
    try:
        num = float(value.strip())
        if num <= 0:
            return ValidationResult("area", value, "INVALID", 0.1, "Area must be positive", "range_check")
        if num > 10000:
            return ValidationResult("area", value, "WARNING", 0.55, "Unusually large area value", "range_check")
        return ValidationResult("area", value, "VALID", 0.94, f"Valid area: {num}", "range_check")
    except:
        return ValidationResult("area", value, "INVALID", 0.2, "Area must be numeric", "type_check")

def validate_owner_name(value: str) -> ValidationResult:
    if not value:
        return ValidationResult("owner_name", value, "INVALID", 0.0, "Owner name is required", "required_field")
    if len(value.strip()) < 3:
        return ValidationResult("owner_name", value, "WARNING", 0.55, "Owner name seems too short", "length_check")
    if re.match(r"^[A-Za-z\u0900-\u097F\u0980-\u09FF\s\.]+$", value.strip()):
        return ValidationResult("owner_name", value, "VALID", 0.92, "Valid owner name", "format_check")
    return ValidationResult("owner_name", value, "WARNING", 0.70, "Owner name contains unusual characters", "format_check")

def validate_registration_date(value: str) -> ValidationResult:
    if not value:
        return ValidationResult("registration_date", value, "NEEDS_REVIEW", 0.4, "Registration date missing", "required_field")
    if re.match(r"^\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}$", value.strip()):
        return ValidationResult("registration_date", value, "VALID", 0.95, "Valid date format", "date_check")
    return ValidationResult("registration_date", value, "WARNING", 0.60, "Non-standard date format", "date_check")

def validate_land_type(value: str) -> ValidationResult:
    if not value:
        return ValidationResult("land_type", value, "NEEDS_REVIEW", 0.5, "Land type not specified", "enum_check")
    if any(lt.lower() in value.lower() for lt in VALID_LAND_TYPES):
        return ValidationResult("land_type", value, "VALID", 0.96, "Recognized land type", "enum_check")
    return ValidationResult("land_type", value, "WARNING", 0.65, "Unrecognized land type", "enum_check")

def validate_village(value: str) -> ValidationResult:
    if not value:
        return ValidationResult("village", value, "NEEDS_REVIEW", 0.4, "Village name missing", "required_field")
    if len(value.strip()) >= 3:
        return ValidationResult("village", value, "VALID", 0.88, "Village name present", "presence_check")
    return ValidationResult("village", value, "WARNING", 0.60, "Village name too short", "length_check")

def validate_district_state(district: str, state: str) -> ValidationResult:
    if not district or not state:
        return ValidationResult("district", district, "NEEDS_REVIEW", 0.5, "District/state data incomplete", "cross_field")
    state_districts = KNOWN_DISTRICTS.get(state, [])
    if not state_districts:
        return ValidationResult("district", district, "WARNING", 0.70, f"State '{state}' not in reference data", "cross_field")
    if any(d.lower() in district.lower() or district.lower() in d.lower() for d in state_districts):
        return ValidationResult("district", district, "VALID", 0.95, f"District '{district}' valid for {state}", "cross_field")
    return ValidationResult("district", district, "WARNING", 0.60, f"District '{district}' not found for {state}", "cross_field")

VALIDATORS = {
    "khata_number": validate_khata_number,
    "khasra_number": validate_khasra_number,
    "area": validate_area,
    "owner_name": validate_owner_name,
    "registration_date": validate_registration_date,
    "land_type": validate_land_type,
    "village": validate_village,
}

def validate_all_fields(fields: Dict[str, str]) -> List[ValidationResult]:
    results = []
    for field_name, value in fields.items():
        if field_name in VALIDATORS:
            results.append(VALIDATORS[field_name](value or ""))
    # Cross-field validation
    if "district" in fields and "state" in fields:
        results.append(validate_district_state(fields.get("district", ""), fields.get("state", "")))
    return results

def compute_document_confidence(field_confidences: List[float]) -> float:
    if not field_confidences:
        return 0.5
    return round(sum(field_confidences) / len(field_confidences), 3)

def get_confidence_tier(confidence: float) -> str:
    if confidence >= 0.90:
        return "AUTO_VERIFIED"
    elif confidence >= 0.70:
        return "REVIEW_RECOMMENDED"
    else:
        return "HUMAN_REQUIRED"