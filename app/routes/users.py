from fastapi import (
    APIRouter,
    Depends,
    HTTPException
)

from sqlalchemy.orm import Session

from app.database import SessionLocal

from app import models, schemas

from app.hashing import (
    hash_password,
    verify_password
)

from app.auth import create_access_token

router = APIRouter()


# ==============================
# DATABASE SESSION
# ==============================
def get_db():

    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ==============================
# REGISTER USER
# ==============================
@router.post("/register")
def register_user(
    user: schemas.UserCreate,
    db: Session = Depends(get_db)
):

    existing_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if existing_user:

        raise HTTPException(
            status_code=400,
            detail="User already exists"
        )

    new_user = models.User(
        full_name=user.full_name,
        email=user.email,
        password=hash_password(user.password),
        role=user.role
    )

    db.add(new_user)

    db.commit()

    db.refresh(new_user)

    return {
        "message": "User registered successfully"
    }


# ==============================
# LOGIN USER
# ==============================
@router.post("/login")
def login_user(
    user: schemas.UserLogin,
    db: Session = Depends(get_db)
):

    db_user = db.query(models.User).filter(
        models.User.email == user.email
    ).first()

    if not db_user:

        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    if not verify_password(
        user.password,
        db_user.password
    ):

        raise HTTPException(
            status_code=400,
            detail="Incorrect password"
        )

    access_token = create_access_token(
        data={"sub": db_user.email}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }