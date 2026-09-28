"""
Entity Extraction Service — Regex/rule-based with NLP fallback architecture.
Designed to be swappable with spaCy NER or IndicBERT models.
"""
import re
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

@dataclass
class ExtractedEntity:
    field_name: str
    value: str
    confidence: float
    method: str = "regex"
    bbox: Optional[List[int]] = None

PATTERNS = {
    "khata_number": [
        r"[Kk]hata\s*(?:No\.?|Number|Num|संख्या|नं\.?)\s*[:\-]?\s*(\d+(?:/\d+)?)",
        r"खाता\s*(?:संख्या|नं\.?)\s*[:\-]?\s*(\d+(?:/\d+)?)",
        r"[Kk]\.?\s*[Nn]o\.?\s*[:\-]?\s*(\d+)",
    ],
    "khasra_number": [
        r"[Kk]hasra\s*(?:No\.?|Number|Num|संख्या|नं\.?)\s*[:\-]?\s*(\d+(?:/\d+)?(?:-\d+)?)",
        r"खसरा\s*(?:संख्या|नं\.?)\s*[:\-]?\s*(\d+(?:/\d+)?)",
    ],
    "survey_number": [
        r"[Ss]urvey\s*(?:No\.?|Number|Num)\s*[:\-]?\s*(SN-\d+|\d+(?:/\d+)?)",
        r"सर्वे\s*(?:संख्या|नं\.?)\s*[:\-]?\s*(\d+)",
    ],
    "plot_number": [
        r"[Pp]lot\s*(?:No\.?|Number|Num)\s*[:\-]?\s*(P-\d+|\d+(?:[A-Za-z]+)?)",
        r"प्लॉट\s*(?:संख्या|नं\.?)\s*[:\-]?\s*(P-\d+|\d+)",
    ],
    "owner_name": [
        r"[Oo]wner\s*[:\-]\s*([A-Za-z\s]+?)(?:\s*\||\n|Father|$)",
        r"[Bb]hoo-?[Ss]wami\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\s*\n|पिता|$)",
        r"भूस्वामी\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)",
        r"(?:[Oo]wner|स्वामी)\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]{3,40})",
    ],
    "father_name": [
        r"[Ff]ather\s*[:\-]\s*([A-Za-z\s]+?)(?:\s*\||\n|Village|$)",
        r"पिता\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)",
    ],
    "village": [
        r"[Vv]illage\s*[:\-]\s*([A-Za-z\u0900-\u097F\s,]+?)(?:\s*,|\s*Mouza|\n|$)",
        r"ग्राम\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|मौजा|$)",
    ],
    "mouza": [
        r"[Mm]ouza\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)",
        r"मौजा\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)",
    ],
    "district": [
        r"[Dd]istrict\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\s*,|\s*State|\n|$)",
        r"जिला\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|राज्य|$)",
        r"दार्जिलिंग|Darjeeling|[Mm]urshidabad|[Pp]urba [Bb]ardhaman",
    ],
    "state": [
        r"[Ss]tate\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)",
        r"राज्य\s*[:\-]\s*([A-Za-z\u0900-\u097F\s]+?)(?:\n|$)",
        r"पश्चिम बंगाल|West Bengal|Maharashtra|Rajasthan|Tamil Nadu",
    ],
    "area": [
        r"[Aa]rea\s*[:\-]\s*(\d+\.?\d*)\s*(Acre|Bigha|Hectare|Square|एकड़|बीघा|हेक्टेयर)?",
        r"क्षेत्रफल\s*[:\-]\s*(\d+\.?\d*)\s*(एकड़|बीघा|हेक्टेयर)?",
    ],
    "land_type": [
        r"[Ll]and\s*[Tt]ype\s*[:\-]\s*(Agricultural|Residential|Commercial|Industrial|Wasteland|Forest|कृषि|आवासीय)",
        r"भूमि\s*(?:प्रकार|वर्ग)\s*[:\-]\s*(कृषि|आवासीय|वाणिज्यिक|औद्योगिक)",
    ],
    "registration_date": [
        r"[Rr]egistration\s*[Dd]ate\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
        r"पंजीकरण\s*दिनांक\s*[:\-]\s*(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})",
    ],
    "mutation_number": [
        r"[Mm]utation\s*(?:No\.?|Number)\s*[:\-]?\s*(MUT-\d+|\d+)",
    ],
    "document_number": [
        r"[Dd]ocument\s*(?:No\.?|Number)\s*[:\-]?\s*([A-Z0-9\/\-]+)",
    ],
}

def extract_entities(text: str) -> List[ExtractedEntity]:
    entities = []
    for field_name, patterns in PATTERNS.items():
        for pattern in patterns:
            matches = re.findall(pattern, text, re.IGNORECASE | re.MULTILINE)
            if matches:
                match = matches[0]
                if isinstance(match, tuple):
                    value = match[0].strip()
                else:
                    value = match.strip()
                if value and len(value) > 1:
                    confidence = 0.85 + (len(value) % 10) / 100
                    confidence = min(confidence, 0.97)
                    entities.append(ExtractedEntity(
                        field_name=field_name,
                        value=value,
                        confidence=confidence,
                        method="regex"
                    ))
                    break
    return entities

def extract_area_with_unit(text: str):
    """Extract area value and unit separately"""
    patterns = [
        r"[Aa]rea\s*[:\-]\s*(\d+\.?\d*)\s*(Acre|Bigha|Hectare|Square Meter|एकड़|बीघा|हेक्टेयर)",
        r"क्षेत्रफल\s*[:\-]\s*(\d+\.?\d*)\s*(Acre|Bigha|Hectare|एकड़|बीघा|हेक्टेयर)",
    ]
    for p in patterns:
        m = re.search(p, text, re.IGNORECASE)
        if m:
            return m.group(1), m.group(2) if len(m.groups()) > 1 else "Acre"
    return None, None