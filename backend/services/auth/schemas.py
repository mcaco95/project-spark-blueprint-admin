from pydantic import BaseModel, EmailStr, UUID4, Field
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    language: Optional[str] = 'en' # Literal['en', 'es'] would be stricter
    role: Optional[str] = 'member'  # Literal['admin', 'member']

# Schema for user creation (request)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# Schema for user update (request)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    language: Optional[str] = None # Literal['en', 'es']
    role: Optional[str] = None     # Literal['admin', 'member']

# Schema for representing a user in API responses (public data)
class UserPublic(UserBase):
    id: UUID4
    created_at: datetime
    # updated_at: datetime # Add if you want to expose this

    class Config:
        from_attributes = True

# Schemas for Login
class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    refresh_token: Optional[str] = None # Making refresh token optional in this Pydantic model
    token_type: str = "bearer"

class LoginResponse(Token):
    user: UserPublic

# Schemas for Registration (matches LoginResponse as per OpenAPI)
class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

# Schemas for Token Refresh
class RefreshTokenRequest(BaseModel):
    refresh_token: str

class RefreshTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

# General Error Schema (matches OpenAPI)
class ErrorDetail(BaseModel):
    # Define structure if details have a fixed structure, otherwise dict
    pass 

class ErrorResponse(BaseModel):
    error: str
    message: str
    details: Optional[Dict[str, Any]] = None 

class RoleEnum(str, Enum):
    admin = "admin"
    member = "member"

class LanguageEnum(str, Enum):
    es = "es"
    en = "en"

# Schema for user login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# Schema for token data (e.g., to be included in JWT)
class TokenData(BaseModel):
    email: Optional[str] = None
    # Add other claims you might need, like user_id, role, etc.

# Schema for the token response (what the login endpoint returns)
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    refresh_token: Optional[str] = None # If you implement refresh tokens 