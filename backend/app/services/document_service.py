"""
Core Document Processing Service — orchestrates the full pipeline.
"""
import os
import uuid
import json
import time
import random
from datetime import datetime
from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app.models.models import Document, ExtractedField, ValidationResult as VRModel, LandRecord, Notification
from app.config import settings

def generate_doc_id() -> str:
    return f"LR-{datetime.now().year}-{random.randint(10000, 99999)}"

def generate_record_id() -> str:
    return f"REC-{datetime.now().year}-{uuid.uuid4().hex[:6].upper()}"

def create_notification(db: Session, title: str, message: str, notif_type: str = "INFO",
                        user_id: int = None, doc_id: str = None):
    notif = Notification(title=title, message=message, type=notif_type, user_id=user_id, doc_id=doc_id)
    db.add(notif)
    db.commit()

def process_document_pipeline(doc_id_int: int, db: Session):
    """Full async-compatible processing pipeline"""
    doc = db.query(Document).filter(Document.id == doc_id_int).first()
    if not doc:
        return

    try:
        # Step 1: Preprocessing
        doc.status = "PREPROCESSING"
        db.commit()
        time.sleep(0.3)

        from app.preprocessing.preprocess import preprocess_document
        pre_result = preprocess_document(doc.file_path)

        if pre_result.success and pre_result.output_path != doc.file_path:
            doc.processed_path = pre_result.output_path

        # Step 2: Layout Detection
        doc.status = "LAYOUT_DETECTION"
        db.commit()
        time.sleep(0.2)

        # Step 3: OCR
        doc.status = "OCR"
        db.commit()
        time.sleep(0.3)

        from app.ocr.ocr_service import ocr_provider
        image_path = doc.processed_path or doc.file_path
        ocr_result = ocr_provider.extract_text(image_path)
        doc.ocr_raw_text = ocr_result.text
        doc.language = ocr_result.language
        db.commit()

        # Step 4: Entity Extraction / NLP
        doc.status = "NLP"
        db.commit()
        time.sleep(0.2)

        from app.nlp.entity_extractor import extract_entities
        entities = extract_entities(ocr_result.text)

        # Store extracted fields
        db.query(ExtractedField).filter(ExtractedField.document_id == doc.id).delete()
        field_values = {}
        field_confidences = []
        for ent in entities:
            ef = ExtractedField(
                document_id=doc.id,
                field_name=ent.field_name,
                field_value=ent.value,
                confidence=ent.confidence,
                status="VALID",
                extraction_method=ent.method
            )
            db.add(ef)
            field_values[ent.field_name] = ent.value
            field_confidences.append(ent.confidence)
        db.commit()

        # Step 5: Validation
        doc.status = "VALIDATION"
        db.commit()
        time.sleep(0.2)

        from app.validation.validator import validate_all_fields, compute_document_confidence, get_confidence_tier
        val_results = validate_all_fields(field_values)

        field_conf_map = {ent.field_name: ent.confidence for ent in entities}
        db.query(VRModel).filter(VRModel.document_id == doc.id).delete()
        for vr in val_results:
            vrm = VRModel(
                document_id=doc.id,
                field_name=vr.field,
                rule=vr.rule,
                status=vr.status,
                message=vr.message
            )
            db.add(vrm)
            # Update field status and confidence
            ef = db.query(ExtractedField).filter(
                ExtractedField.document_id == doc.id,
                ExtractedField.field_name == vr.field
            ).first()
            if ef:
                ef.status = vr.status
                ef.confidence = vr.confidence
            field_conf_map[vr.field] = vr.confidence
        db.commit()

        # Confidence scoring with post-validation confidences
        overall = compute_document_confidence(list(field_conf_map.values()))
        doc.overall_confidence = overall
        tier = get_confidence_tier(overall)

        if tier == "HUMAN_REQUIRED" or tier == "REVIEW_RECOMMENDED":
            doc.status = "REVIEW"
            create_notification(db, "Document Requires Review",
                f"Document {doc.doc_id} has confidence {overall:.0%} and requires human verification.",
                "WARNING", doc_id=doc.doc_id)
        else:
            doc.status = "COMPLETED"
            _create_land_record(doc, entities, db)
            create_notification(db, "Document Processed Successfully",
                f"Document {doc.doc_id} processed with {overall:.0%} confidence and auto-verified.",
                "SUCCESS", doc_id=doc.doc_id)

        doc.processed_at = datetime.utcnow()
        db.commit()

    except Exception as e:
        try:
            db.rollback()
        except Exception:
            pass
        try:
            doc = db.query(Document).filter(Document.id == doc_id_int).first()
            if doc:
                doc.status = "FAILED"
                doc.processing_notes = str(e)
                create_notification(db, "Processing Failed",
                    f"Document {doc.doc_id} processing failed: {str(e)[:100]}",
                    "ERROR", doc_id=doc.doc_id)
                db.commit()
        except Exception:
            pass

def _create_land_record(doc: Document, entities, db: Session):
    """Create or update LandRecord from extracted entities"""
    existing = db.query(LandRecord).filter(LandRecord.document_id == doc.id).first()
    if existing:
        return

    field_map = {e.field_name: e.value for e in entities}
    raw_area = field_map.get("area") or field_map.get("plot_area")
    area_val = None
    if raw_area is not None:
        import re
        m = re.search(r"(\d+(?:\.\d+)?)", str(raw_area))
        if m:
            try:
                area_val = float(m.group(1))
            except ValueError:
                area_val = None

    record = LandRecord(
        record_id=generate_record_id(),
        document_id=doc.id,
        citizen_id=doc.uploaded_by if doc.citizen_upload else None,
        owner_name=field_map.get("owner_name", "Unknown"),
        father_name=field_map.get("father_name"),
        khata_number=field_map.get("khata_number"),
        khasra_number=field_map.get("khasra_number"),
        survey_number=field_map.get("survey_number"),
        plot_number=field_map.get("plot_number"),
        village=field_map.get("village"),
        mouza=field_map.get("mouza"),
        block=field_map.get("block"),
        district=field_map.get("district"),
        state=field_map.get("state"),
        area=area_val,
        unit=field_map.get("unit", "Acre"),
        land_type=field_map.get("land_type"),
        registration_date=field_map.get("registration_date"),
        mutation_number=field_map.get("mutation_number"),
        document_number=field_map.get("document_number"),
        geo_lat=26.7 + random.uniform(-0.5, 0.5),
        geo_lng=88.4 + random.uniform(-0.5, 0.5),
        status="VERIFIED"
    )
    db.add(record)
    db.commit()