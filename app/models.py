from sqlalchemy import Column, Integer, String
from app.database import Base


# ==============================
# USER TABLE
# ==============================
class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, default="patient")


# ==============================
# MEDICAL RECORD TABLE
# ==============================
class MedicalRecord(Base):
    __tablename__ = "medical_records"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)
    owner_email = Column(String, nullable=False)