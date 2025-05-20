from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt as jose_jwt # Renamed to avoid conflict with Flask-JWT-Extended's jwt object
from typing import Optional, Dict, Any

from backend.core.db import db # Import db from core.db
from backend.services.auth.models import User # Assuming models.py is in the same directory
from backend.core.config import settings # Corrected
from backend.services.auth import schemas # Corrected

# Password Hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

ALGORITHM = "HS256"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# Token Creation utility (can be used by Flask-JWT-Extended or directly if needed)
# Flask-JWT-Extended handles most of this, but useful for understanding
def create_access_token_custom(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "sub": data.get("email")}) # 'sub' is standard for subject
    encoded_jwt = jose_jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# User Service Functions (CRUD operations and business logic)

def get_user_by_email(email: str) -> Optional[User]:
    return User.query.filter_by(email=email).first()

def get_user_by_id(user_id: str) -> Optional[User]: # Changed from int to str for UUID
    # Assuming user_id is a string representation of a UUID
    # If your User model's ID is directly a UUID type, SQLAlchemy might handle string conversion
    # or you might need to convert it to a UUID object first if the DB driver requires it.
    # For now, let's assume direct string comparison works or is handled by SQLAlchemy.
    return User.query.filter_by(id=user_id).first()

def create_user(user_in: schemas.RegisterRequest) -> User:
    hashed_password = get_password_hash(user_in.password)
    
    # Check if this is the first user
    is_first_user = User.query.count() == 0
    
    db_user = User(
        email=user_in.email,
        name=user_in.name,
        password_hash=hashed_password
    )
    
    if is_first_user:
        db_user.role = 'admin' # Assign admin role to the first user
        
    db.session.add(db_user)
    db.session.commit()
    db.session.refresh(db_user)
    return db_user

# authenticate_user will be used by the login route
# It will typically use Flask-JWT-Extended's capabilities after verifying credentials

# More service functions (get_user_by_id, update_user, etc.) can be added here.

def get_all_users():
    """Return all users in the system."""
    return User.query.all() 