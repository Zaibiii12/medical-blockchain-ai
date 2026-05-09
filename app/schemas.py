from pydantic import BaseModel, EmailStr


# ==============================
# USER REGISTER SCHEMA
# ==============================
class UserCreate(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    role: str = "patient"


# ==============================
# USER LOGIN SCHEMA
# ==============================
class UserLogin(BaseModel):
    email: EmailStr
    password: str


# ==============================
# TOKEN RESPONSE
# ==============================
class Token(BaseModel):
    access_token: str
    token_type: str