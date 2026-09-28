"""
Seeds the database with realistic Indian land records and system users.
Uses geographically consistent data across West Bengal, Bihar, Assam, and Maharashtra.
"""
import json
import random
from datetime import datetime, timedelta
from app.models.models import User, Document, ExtractedField, LandRecord, Notification, CorrectionRequest
from app.auth.auth import hash_password
from app.services.document_service import generate_record_id, generate_doc_id

# Realistic Indian land records with consistent geography
SAMPLE_RECORDS = [
    # West Bengal - Darjeeling district
    {
        "owner": "Animesh Chatterjee", "father": "Subhash Chatterjee",
        "village": "Matigara", "mouza": "Matigara", "block": "Siliguri II",
        "district": "Darjeeling", "state": "West Bengal",
        "khata": "1024", "khasra": "45/2", "plot": "P-204", "survey": "SN-2204",
        "area": 2.45, "unit": "Acre", "land_type": "Agricultural",
        "reg_date": "14/06/2019", "mutation": "MUT-WB-DJ-7891", "doc_num": "WB/DJ/2019/00456",
        "lat": 26.7271, "lng": 88.4251, "confidence": 0.961, "lang": "Bengali",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "খাতা সংখ্যা: ১০২৪\nখসরা সংখ্যা: ৪৫/২\nমালিকের নাম: অনিমেষ চট্টোপাধ্যায়\nমৌজা: মাটিগাড়া\nজেলা: দার্জিলিং\nক্ষেত্রফল: ২.৪৫ একর"
    },
    # West Bengal - Darjeeling, Naxalbari
    {
        "owner": "Kamla Devi Rai", "father": "Dhan Bahadur Rai",
        "village": "Naxalbari", "mouza": "Naxalbari", "block": "Naxalbari",
        "district": "Darjeeling", "state": "West Bengal",
        "khata": "2031", "khasra": "67/1", "plot": "P-105", "survey": "SN-3401",
        "area": 1.80, "unit": "Bigha", "land_type": "Agricultural",
        "reg_date": "22/07/2018", "mutation": "MUT-WB-DJ-4561", "doc_num": "WB/DJ/2018/01234",
        "lat": 26.6872, "lng": 88.3097, "confidence": 0.724, "lang": "Bengali",
        "lr_status": "PENDING_REVIEW",
        "doc_status": "REVIEW",
        "ocr_raw": "Khata No: 2031\nKhasra No: 67/1\nOwner: Kamla Devi Rai\nMouza: Naxalbari\nDistrict: Darjeeling\nArea: 1.80 Bigha"
    },
    # West Bengal - Jalpaiguri
    {
        "owner": "Priya Sharma", "father": "Dinesh Sharma",
        "village": "Jalpaiguri Town", "mouza": "Jalpaiguri", "block": "Jalpaiguri",
        "district": "Jalpaiguri", "state": "West Bengal",
        "khata": "5678", "khasra": "89/3", "plot": "P-567", "survey": "SN-4455",
        "area": 3.20, "unit": "Bigha", "land_type": "Agricultural",
        "reg_date": "14/02/2017", "mutation": "MUT-WB-JP-3341", "doc_num": "WB/JP/2017/00234",
        "lat": 26.5374, "lng": 88.7195, "confidence": 0.912, "lang": "Bengali",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "খাতা সংখ্যা: ৫৬৭৮\nখসরা সংখ্যা: ৮৯/৩\nমালিকের নাম: প্রিয়া শর্মা\nমৌজা: জলপাইগুড়ি\nজেলা: জলপাইগুড়ি\nক্ষেত্রফল: ৩.২০ বিঘা"
    },
    # West Bengal - Murshidabad
    {
        "owner": "Abdul Karim Molla", "father": "Mohammad Ali Molla",
        "village": "Berhampore", "mouza": "Berhampore North", "block": "Berhampore",
        "district": "Murshidabad", "state": "West Bengal",
        "khata": "3456", "khasra": "12/4", "plot": "P-312", "survey": "SN-1122",
        "area": 0.75, "unit": "Acre", "land_type": "Residential",
        "reg_date": "08/11/2020", "mutation": "MUT-WB-MU-2011", "doc_num": "WB/MU/2020/00890",
        "lat": 24.1070, "lng": 88.2514, "confidence": 0.642, "lang": "Bengali",
        "lr_status": "NEEDS_CORRECTION",
        "doc_status": "REVIEW",
        "ocr_raw": "খাতা সংখ্যা: ৩৪৫৬\nখসরা সংখ্যা: ১২/৪\nমালিকের নাম: আবদুল করিম মোল্লা\nমৌজা: বহরমপুর উত্তর\nজেলা: মুর্শিদাবাদ\nক্ষেত্রফল: ০.৭৫ একর"
    },
    # Bihar - Patna
    {
        "owner": "Ramesh Kumar Sinha", "father": "Lal Bahadur Sinha",
        "village": "Patna Sahib", "mouza": "Patna East", "block": "Patna Sadar",
        "district": "Patna", "state": "Bihar",
        "khata": "9012", "khasra": "23/5", "plot": "P-901", "survey": "SN-7733",
        "area": 0.50, "unit": "Acre", "land_type": "Residential",
        "reg_date": "03/04/2021", "mutation": "MUT-BR-PA-4562", "doc_num": "BR/PA/2021/00567",
        "lat": 25.6093, "lng": 85.1376, "confidence": 0.556, "lang": "Hindi",
        "lr_status": "PENDING_REVIEW",
        "doc_status": "REVIEW",
        "ocr_raw": "खाता संख्या: 9012\nखसरा संख्या: 23/5\nमालिक का नाम: रमेश कुमार सिन्हा\nमौजा: पटना पूर्व\nजिला: पटना\nक्षेत्रफल: 0.50 एकड़"
    },
    # Bihar - Muzaffarpur
    {
        "owner": "Savitri Devi", "father": "Jagdish Prasad",
        "village": "Muzaffarpur Urban", "mouza": "Muzaffarpur", "block": "Muzaffarpur Sadar",
        "district": "Muzaffarpur", "state": "Bihar",
        "khata": "4210", "khasra": "78/2", "plot": "P-421", "survey": "SN-8821",
        "area": 1.20, "unit": "Bigha", "land_type": "Agricultural",
        "reg_date": "17/09/2019", "mutation": "MUT-BR-MZ-3301", "doc_num": "BR/MZ/2019/00789",
        "lat": 26.1225, "lng": 85.3906, "confidence": 0.883, "lang": "Hindi",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "खाता संख्या: 4210\nखसरा संख्या: 78/2\nमालिक का नाम: सावित्री देवी\nमौजा: मुजफ्फरपुर\nजिला: मुजफ्फरपुर\nक्षेत्रफल: 1.20 बीघा"
    },
    # Assam - Kamrup
    {
        "owner": "Dipak Bora", "father": "Hemanta Bora",
        "village": "Guwahati Rural", "mouza": "Dispur", "block": "Kamrup Sadar",
        "district": "Kamrup", "state": "Assam",
        "khata": "7654", "khasra": "34/1", "plot": "P-765", "survey": "SN-5543",
        "area": 2.00, "unit": "Bigha", "land_type": "Agricultural",
        "reg_date": "25/01/2020", "mutation": "MUT-AS-KP-2201", "doc_num": "AS/KP/2020/00112",
        "lat": 26.1445, "lng": 91.7362, "confidence": 0.931, "lang": "Assamese",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "খতিয়ান নং: ৭৬৫৪\nদাগ নং: ৩৪/১\nমালিকৰ নাম: দীপক বৰা\nমৌজা: দিছপুৰ\nজিলা: কামৰূপ\nক্ষেত্ৰফল: ২.০০ বিঘা"
    },
    # Assam - Dibrugarh
    {
        "owner": "Rina Hazarika", "father": "Narayan Hazarika",
        "village": "Dibrugarh Town", "mouza": "Dibrugarh", "block": "Dibrugarh Sadar",
        "district": "Dibrugarh", "state": "Assam",
        "khata": "3321", "khasra": "56/3", "plot": "P-332", "survey": "SN-6612",
        "area": 0.35, "unit": "Acre", "land_type": "Residential",
        "reg_date": "11/06/2022", "mutation": "MUT-AS-DB-1102", "doc_num": "AS/DB/2022/00345",
        "lat": 27.4728, "lng": 94.9120, "confidence": 0.788, "lang": "Assamese",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "খতিয়ান নং: ৩৩২১\nদাগ নং: ৫৬/৩\nমালিকৰ নাম: ৰিনা হাজৰিকা\nমৌজা: ডিব্ৰুগড়\nজিলা: ডিব্ৰুগড়\nক্ষেত্ৰফল: ০.৩৫ একৰ"
    },
    # Maharashtra - Pune
    {
        "owner": "Suresh Baban Patil", "father": "Baban Vithal Patil",
        "village": "Hadapsar", "mouza": "Haveli", "block": "Pune Sadar",
        "district": "Pune", "state": "Maharashtra",
        "khata": "8901", "khasra": "112/6", "plot": "P-890", "survey": "SN-9981",
        "area": 1.50, "unit": "Acre", "land_type": "Agricultural",
        "reg_date": "30/06/2018", "mutation": "MUT-MH-PN-8901", "doc_num": "MH/PN/2018/00678",
        "lat": 18.5204, "lng": 73.8567, "confidence": 0.876, "lang": "Marathi",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "खाते क्रमांक: 8901\nसर्वे क्रमांक: 112/6\nमालकाचे नाव: सुरेश बाबन पाटील\nगाव: हडपसर\nजिल्हा: पुणे\nक्षेत्रफळ: 1.50 एकर"
    },
    # Maharashtra - Nashik
    {
        "owner": "Lata Dnyanoba Jadhav", "father": "Dnyanoba Mahadeo Jadhav",
        "village": "Nashik Rural", "mouza": "Nashik", "block": "Nashik Sadar",
        "district": "Nashik", "state": "Maharashtra",
        "khata": "6543", "khasra": "78/4", "plot": "P-654", "survey": "SN-7765",
        "area": 4.20, "unit": "Acre", "land_type": "Agricultural",
        "reg_date": "09/03/2016", "mutation": "MUT-MH-NK-6541", "doc_num": "MH/NK/2016/00234",
        "lat": 19.9975, "lng": 73.7898, "confidence": 0.934, "lang": "Marathi",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "खाते क्रमांक: 6543\nसर्वे क्रमांक: 78/4\nमालकाचे नाव: लता ज्ञानोबा जाधव\nगाव: नाशिक ग्रामीण\nजिल्हा: नाशिक\nक्षेत्रफळ: 4.20 एकर"
    },
    # West Bengal - North 24 Parganas
    {
        "owner": "Tapan Kumar Ghosh", "father": "Sunil Kumar Ghosh",
        "village": "Barasat", "mouza": "Barasat", "block": "Barasat II",
        "district": "North 24 Parganas", "state": "West Bengal",
        "khata": "1890", "khasra": "99/2", "plot": "P-189", "survey": "SN-1891",
        "area": 0.25, "unit": "Acre", "land_type": "Residential",
        "reg_date": "12/10/2021", "mutation": "MUT-WB-N24-1890", "doc_num": "WB/N24/2021/00890",
        "lat": 22.7236, "lng": 88.4785, "confidence": 0.692, "lang": "Bengali",
        "lr_status": "NEEDS_CORRECTION",
        "doc_status": "REVIEW",
        "ocr_raw": "খাতা সংখ্যা: ১৮৯০\nখসরা সংখ্যা: ৯৯/২\nমালিকের নাম: তাপন কুমার ঘোষ\nমৌজা: বারাসাত\nজেলা: উত্তর ২৪ পরগনা\nক্ষেত্রফল: ০.২৫ একর"
    },
    # Assam - Jorhat
    {
        "owner": "Binod Chandra Bhuyan", "father": "Ranjit Bhuyan",
        "village": "Jorhat Town", "mouza": "Jorhat", "block": "Jorhat Sadar",
        "district": "Jorhat", "state": "Assam",
        "khata": "4567", "khasra": "23/7", "plot": "P-456", "survey": "SN-4568",
        "area": 0.80, "unit": "Bigha", "land_type": "Commercial",
        "reg_date": "19/05/2023", "mutation": "MUT-AS-JR-4561", "doc_num": "AS/JR/2023/00789",
        "lat": 26.7465, "lng": 94.2026, "confidence": 0.847, "lang": "Assamese",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "খতিয়ান নং: ৪৫৬৭\nদাগ নং: ২৩/৭\nমালিকৰ নাম: বিনোদ চন্দ্ৰ ভূঞা\nমৌজা: যোৰহাট\nজিলা: যোৰহাট\nক্ষেত্ৰফল: ০.৮০ বিঘা"
    },
    # Bihar - Gaya
    {
        "owner": "Manoj Kumar Paswan", "father": "Ram Narayan Paswan",
        "village": "Gaya Sadar", "mouza": "Gaya Urban", "block": "Gaya Sadar",
        "district": "Gaya", "state": "Bihar",
        "khata": "6780", "khasra": "45/8", "plot": "P-678", "survey": "SN-6781",
        "area": 0.30, "unit": "Acre", "land_type": "Residential",
        "reg_date": "07/12/2022", "mutation": "MUT-BR-GY-6780", "doc_num": "BR/GY/2022/00345",
        "lat": 24.7955, "lng": 85.0002, "confidence": 0.611, "lang": "Hindi",
        "lr_status": "PROCESSING",
        "doc_status": "VALIDATION",
        "ocr_raw": "खाता संख्या: 6780\nखसरा संख्या: 45/8\nमालिक का नाम: मनोज कुमार पासवान\nमौजा: गया शहरी\nजिला: गया\nक्षेत्रफल: 0.30 एकड़"
    },
    # Maharashtra - Nagpur
    {
        "owner": "Vilas Narayan Kulkarni", "father": "Narayan Govind Kulkarni",
        "village": "Nagpur Rural", "mouza": "Nagpur Sadar", "block": "Nagpur Sadar",
        "district": "Nagpur", "state": "Maharashtra",
        "khata": "2345", "khasra": "67/5", "plot": "P-234", "survey": "SN-2346",
        "area": 5.80, "unit": "Acre", "land_type": "Agricultural",
        "reg_date": "28/08/2015", "mutation": "MUT-MH-NG-2345", "doc_num": "MH/NG/2015/00567",
        "lat": 21.1458, "lng": 79.0882, "confidence": 0.953, "lang": "Marathi",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "खाते क्रमांक: 2345\nसर्वे क्रमांक: 67/5\nमालकाचे नाव: विलास नारायण कुलकर्णी\nगाव: नागपूर ग्रामीण\nजिल्हा: नागपूर\nक्षेत्रफळ: 5.80 एकर"
    },
    # West Bengal - Kolkata (urban)
    {
        "owner": "Sourav Bandyopadhyay", "father": "Dilip Bandyopadhyay",
        "village": "Tollygunge", "mouza": "Kolkata Municipal", "block": "Kolkata Ward 90",
        "district": "Kolkata", "state": "West Bengal",
        "khata": "7123", "khasra": "N/A", "plot": "P-712", "survey": "SN-7124",
        "area": 0.08, "unit": "Acre", "land_type": "Residential",
        "reg_date": "01/03/2024", "mutation": "MUT-WB-KL-7123", "doc_num": "WB/KL/2024/00123",
        "lat": 22.4954, "lng": 88.3533, "confidence": 0.968, "lang": "Bengali",
        "lr_status": "VERIFIED",
        "doc_status": "COMPLETED",
        "ocr_raw": "খাতা সংখ্যা: ৭১২৩\nপ্লট সংখ্যা: পি-৭১২\nমালিকের নাম: সৌরভ বন্দ্যোপাধ্যায়\nমৌজা: কলকাতা মিউনিসিপাল\nজেলা: কলকাতা\nক্ষেত্রফল: ০.০৮ একর"
    },
]


def seed_database(db):
    """Seed realistic data if database is empty"""
    existing_users = db.query(User).count()
    if existing_users > 0:
        return

    print("Seeding database with realistic Indian land records...")

    # Create system staff users
    admin = User(
        name="Rajiv Menon", email="admin@dlr.gov.in",
        password_hash=hash_password("Admin@2026"), role="ADMIN", is_active=True,
        state="West Bengal", district="Darjeeling", preferred_language="English",
        onboarding_complete=True
    )
    officer = User(
        name="Suresh Thapa", email="officer@dlr.gov.in",
        password_hash=hash_password("Officer@2026"), role="OFFICER", is_active=True,
        state="West Bengal", district="Darjeeling", preferred_language="Hindi",
        onboarding_complete=True
    )
    reviewer = User(
        name="Meena Rao", email="reviewer@dlr.gov.in",
        password_hash=hash_password("Reviewer@2026"), role="REVIEWER", is_active=True,
        state="Maharashtra", district="Pune", preferred_language="Marathi",
        onboarding_complete=True
    )

    # Demo citizen users
    citizen1 = User(
        name="Animesh Chatterjee", email="animesh@citizen.in",
        password_hash=hash_password("Citizen@2026"), role="CITIZEN", is_active=True,
        mobile="9876543210", state="West Bengal", district="Darjeeling",
        preferred_language="Bengali", onboarding_complete=True
    )
    citizen2 = User(
        name="Ramesh Kumar Sinha", email="ramesh@citizen.in",
        password_hash=hash_password("Citizen@2026"), role="CITIZEN", is_active=True,
        mobile="9123456789", state="Bihar", district="Patna",
        preferred_language="Hindi", onboarding_complete=False
    )

    for u in [admin, officer, reviewer, citizen1, citizen2]:
        db.add(u)
    db.commit()

    admin = db.query(User).filter(User.email == "admin@dlr.gov.in").first()
    officer = db.query(User).filter(User.email == "officer@dlr.gov.in").first()
    citizen1 = db.query(User).filter(User.email == "animesh@citizen.in").first()
    citizen2 = db.query(User).filter(User.email == "ramesh@citizen.in").first()

    # Assign citizens to their matching records
    citizen_map = {
        "Animesh Chatterjee": citizen1.id,
        "Ramesh Kumar Sinha": citizen2.id,
    }

    for i, rec in enumerate(SAMPLE_RECORDS):
        doc_id = f"LR-2026-{10100 + i:04d}"
        days_ago = random.randint(5, 120)
        upload_time = datetime.utcnow() - timedelta(days=days_ago)
        doc_status = rec["doc_status"]
        lr_status = rec["lr_status"]

        # Vary processing times realistically
        proc_minutes = random.randint(1, 8)
        processed_time = upload_time + timedelta(minutes=proc_minutes) if doc_status not in ["UPLOADED", "PREPROCESSING"] else None

        # Build OCR-derived confidence components
        base_conf = rec["confidence"]
        ocr_conf = round(min(1.0, base_conf + random.uniform(-0.04, 0.06)), 3)
        extr_conf = round(min(1.0, base_conf + random.uniform(-0.06, 0.04)), 3)
        val_conf = round(min(1.0, base_conf + random.uniform(-0.02, 0.05)), 3)
        overall_conf = round((ocr_conf + extr_conf + val_conf) / 3, 3)

        uploader_id = citizen_map.get(rec["owner"], admin.id)

        doc = Document(
            doc_id=doc_id,
            filename=f"record_{doc_id}.pdf",
            file_path=f"uploads/demo_{i+1}.pdf",
            processed_path=f"processed/demo_{i+1}_processed.pdf",
            status=doc_status,
            language=rec["lang"],
            uploaded_by=uploader_id,
            uploaded_at=upload_time,
            processed_at=processed_time,
            overall_confidence=overall_conf,
            ocr_confidence=ocr_conf,
            extraction_confidence=extr_conf,
            validation_confidence=val_conf,
            page_count=random.randint(1, 4),
            file_size=random.randint(180000, 3500000),
            ocr_raw_text=rec.get("ocr_raw", ""),
            is_demo=True,
            citizen_upload=(uploader_id != admin.id)
        )
        db.add(doc)
        db.flush()

        # Create extracted fields with realistic, varied confidence
        field_data = [
            ("owner_name", rec["owner"], _vary(base_conf, +0.02, +0.04)),
            ("father_name", rec["father"], _vary(base_conf, -0.01, +0.03)),
            ("khata_number", rec["khata"], _vary(base_conf, +0.02, +0.05)),
            ("khasra_number", rec["khasra"], _vary(base_conf, -0.08, +0.02)),  # often lower
            ("village", rec["village"], _vary(base_conf, -0.02, +0.03)),
            ("mouza", rec["mouza"], _vary(base_conf, -0.03, +0.03)),
            ("block", rec["block"], _vary(base_conf, -0.04, +0.02)),
            ("district", rec["district"], _vary(base_conf, +0.01, +0.05)),
            ("state", rec["state"], _vary(base_conf, +0.02, +0.06)),
            ("plot_number", rec["plot"], _vary(base_conf, -0.02, +0.02)),
            ("survey_number", rec["survey"], _vary(base_conf, -0.05, +0.01)),
            ("area", str(rec["area"]), _vary(base_conf, -0.06, +0.04)),  # often ambiguous
            ("unit", rec["unit"], 0.995),
            ("land_type", rec["land_type"], _vary(base_conf, -0.01, +0.04)),
            ("registration_date", rec["reg_date"], _vary(base_conf, -0.03, +0.04)),
            ("mutation_number", rec["mutation"], _vary(base_conf, -0.04, +0.02)),
            ("document_number", rec["doc_num"], _vary(base_conf, -0.02, +0.03)),
        ]

        for fname, fval, fconf in field_data:
            fconf = round(max(0.0, min(1.0, fconf)), 3)
            if fconf >= 0.80:
                fstatus = "VALID"
            elif fconf >= 0.65:
                fstatus = "NEEDS_REVIEW"
            elif fconf >= 0.50:
                fstatus = "WARNING"
            else:
                fstatus = "INVALID"

            ef = ExtractedField(
                document_id=doc.id,
                field_name=fname,
                field_value=fval,
                confidence=fconf,
                status=fstatus,
                extraction_method="tesseract-ocr" if base_conf > 0.75 else "regex-fallback"
            )
            db.add(ef)

        # Create land record
        citizen_id = citizen_map.get(rec["owner"], None)
        lr = LandRecord(
            record_id=generate_record_id(),
            document_id=doc.id,
            citizen_id=citizen_id,
            owner_name=rec["owner"],
            father_name=rec["father"],
            khata_number=rec["khata"],
            khasra_number=rec["khasra"],
            survey_number=rec["survey"],
            plot_number=rec["plot"],
            village=rec["village"],
            mouza=rec["mouza"],
            block=rec["block"],
            district=rec["district"],
            state=rec["state"],
            area=rec["area"],
            unit=rec["unit"],
            land_type=rec["land_type"],
            registration_date=rec["reg_date"],
            mutation_number=rec["mutation"],
            document_number=rec["doc_num"],
            geo_lat=rec["lat"],
            geo_lng=rec["lng"],
            status=lr_status
        )
        db.add(lr)

    db.flush()

    # Add user-specific notifications
    admin_user = db.query(User).filter(User.email == "admin@dlr.gov.in").first()
    officer_user = db.query(User).filter(User.email == "officer@dlr.gov.in").first()
    animesh = db.query(User).filter(User.email == "animesh@citizen.in").first()
    ramesh = db.query(User).filter(User.email == "ramesh@citizen.in").first()

    notifications = [
        # Admin notifications
        Notification(user_id=admin_user.id, title="Platform Initialized",
                     message="Digital Land Records platform is operational. 15 records seeded.",
                     type="SUCCESS"),
        Notification(user_id=admin_user.id, title="Review Queue Alert",
                     message="4 documents are pending human verification. Khasra confidence below threshold.",
                     type="WARNING"),
        Notification(user_id=admin_user.id, title="Processing Complete",
                     message="Batch of 10 land records processed. Avg confidence: 82.4%.",
                     type="INFO"),

        # Officer notifications
        Notification(user_id=officer_user.id, title="New Documents in Queue",
                     message="3 documents require officer verification. Oldest is 2 days old.",
                     type="WARNING", doc_id="LR-2026-10101"),
        Notification(user_id=officer_user.id, title="Correction Request Received",
                     message="Citizen Animesh Chatterjee submitted a correction request for record LR-2026-10100.",
                     type="INFO"),

        # Citizen Animesh notifications
        Notification(user_id=animesh.id, title="Document Processed",
                     message="Your land document LR-2026-10100 has been processed successfully. Overall confidence: 96.1%.",
                     type="SUCCESS", doc_id="LR-2026-10100"),
        Notification(user_id=animesh.id, title="Record Verified",
                     message="Your land record for Plot P-204, Matigara has been verified by the land officer.",
                     type="SUCCESS"),

        # Citizen Ramesh notifications
        Notification(user_id=ramesh.id, title="Document Under Review",
                     message="Your document LR-2026-10104 is under review. Some fields have low confidence and require manual verification.",
                     type="WARNING", doc_id="LR-2026-10104"),
        Notification(user_id=ramesh.id, title="Action Required",
                     message="Please provide additional documents for your Patna land record. Contact your local land office.",
                     type="INFO"),
    ]
    for n in notifications:
        db.add(n)

    db.commit()
    print(f"Seeded {len(SAMPLE_RECORDS)} land records across West Bengal, Bihar, Assam, and Maharashtra.")
    print("Demo accounts: admin@dlr.gov.in / Officer: officer@dlr.gov.in / Citizen: animesh@citizen.in (all pw: *@2026)")


def _vary(base: float, low: float, high: float) -> float:
    """Apply a random variation to a confidence value."""
    return round(min(1.0, max(0.0, base + random.uniform(low, high))), 3)