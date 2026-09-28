import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import LandRecord
from app.auth.auth import get_current_user

router = APIRouter(prefix="/gis", tags=["GIS"])

@router.get("/geojson")
def get_geojson(db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    """Return GeoJSON FeatureCollection of all land records with geometry"""
    records = db.query(LandRecord).filter(LandRecord.geo_lat.isnot(None)).all()
    features = []
    for r in records:
        # Generate polygon around the centroid for demo
        import random
        lat, lng = r.geo_lat, r.geo_lng
        offset = 0.003 + (abs(hash(r.record_id or str(r.id))) % 5) * 0.001
        coords = [
            [lng - offset, lat - offset],
            [lng + offset, lat - offset],
            [lng + offset, lat + offset],
            [lng - offset, lat + offset],
            [lng - offset, lat - offset],
        ]
        features.append({
            "type": "Feature",
            "properties": {
                "record_id": r.record_id,
                "plot_number": r.plot_number,
                "owner_name": r.owner_name,
                "khata_number": r.khata_number,
                "khasra_number": r.khasra_number,
                "area": r.area,
                "unit": r.unit,
                "land_type": r.land_type,
                "village": r.village,
                "district": r.district,
                "status": r.status,
            },
            "geometry": {
                "type": "Polygon",
                "coordinates": [coords]
            }
        })
    return {"type": "FeatureCollection", "features": features}

@router.get("/record/{record_id}")
def get_record_location(record_id: str, db: Session = Depends(get_db), current_user=Depends(get_current_user)):
    rec = db.query(LandRecord).filter(LandRecord.record_id == record_id).first()
    if not rec:
        raise HTTPException(404, "Record not found")
    return {
        "record_id": rec.record_id,
        "lat": rec.geo_lat,
        "lng": rec.geo_lng,
        "plot_number": rec.plot_number,
        "owner_name": rec.owner_name,
        "area": rec.area,
        "unit": rec.unit,
        "land_type": rec.land_type,
        "village": rec.village,
        "district": rec.district,
    }