from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.models.models import User
from app.schemas.schemas import UserCreate, CitizenRegister, UserLogin, Token, UserOut, UserProfileUpdate
from app.auth.auth import hash_password, verify_password, create_access_token, get_current_user
from typing import List

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/register", response_model=UserOut)
def register(data: UserCreate, db: Session = Depends(get_db)):
    """Internal registration endpoint for officers/admins (admin-only in production)"""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    user = User(
        name=data.name,
        email=data.email,
        password_hash=hash_password(data.password),
        role=data.role
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/register/citizen", response_model=UserOut)
def register_citizen(data: CitizenRegister, db: Session = Depends(get_db)):
    """Public citizen registration endpoint"""
    if db.query(User).filter(User.email == data.email).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists.")
    user = User(
        name=data.name,
        email=data.email,
        mobile=data.mobile,
        password_hash=hash_password(data.password),
        role="CITIZEN",
        state=data.state,
        district=data.district,
        preferred_language=data.preferred_language or "English",
        onboarding_complete=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@router.post("/login", response_model=Token)
def login(data: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == data.email).first()
    if not user or not verify_password(data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=403, detail="Your account has been deactivated. Contact support.")
    token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "uid": user.id
    })
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "mobile": user.mobile,
            "state": user.state,
            "district": user.district,
            "preferred_language": user.preferred_language,
            "onboarding_complete": user.onboarding_complete
        }
    }


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user


@router.put("/me", response_model=UserOut)
def update_profile(
    data: UserProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if data.name:
        current_user.name = data.name
    if data.mobile is not None:
        current_user.mobile = data.mobile
    if data.state is not None:
        current_user.state = data.state
    if data.district is not None:
        current_user.district = data.district
    if data.preferred_language is not None:
        current_user.preferred_language = data.preferred_language
    db.commit()
    db.refresh(current_user)
    return current_user


@router.post("/me/complete-onboarding")
def complete_onboarding(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    current_user.onboarding_complete = True
    db.commit()
    return {"success": True, "message": "Onboarding complete"}


@router.get("/users", response_model=List[UserOut])
def list_users(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role not in ["ADMIN"]:
        raise HTTPException(status_code=403, detail="Admin access only")
    return db.query(User).all()