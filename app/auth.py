from datetime import datetime, timedelta

from jose import jwt, JWTError

from fastapi import Depends, HTTPException
from fastapi.security import (
    HTTPBearer,
    HTTPAuthorizationCredentials
)

SECRET_KEY = "mysecretkey123"

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()


# ==============================
# CREATE ACCESS TOKEN
# ==============================
def create_access_token(data: dict):

    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        SECRET_KEY,
        algorithm=ALGORITHM
    )

    return encoded_jwt


# ==============================
# GET CURRENT USER FROM TOKEN
# ==============================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):

    token = credentials.credentials

    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        email = payload.get("sub")

        if email is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return email

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Token expired or invalid"
        )