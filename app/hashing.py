import hashlib
from passlib.context import CryptContext

# Password hashing configuration
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


# ==============================
# PASSWORD HASHING
# ==============================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)


# ==============================
# PASSWORD VERIFICATION
# ==============================
def verify_password(
    plain_password: str,
    hashed_password: str
) -> bool:
    return pwd_context.verify(
        plain_password,
        hashed_password
    )


# ==============================
# FILE HASHING (SHA-256)
# ==============================
def generate_file_hash(file_content: bytes) -> str:
    sha256 = hashlib.sha256()
    sha256.update(file_content)
    return sha256.hexdigest()