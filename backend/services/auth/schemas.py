from pydantic import BaseModel, EmailStr, UUID4, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum

class UserStatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"
    pending = "pending"

class RoleEnum(str, Enum):
    admin = "admin"
    member = "member"

class LanguageEnum(str, Enum):
    en = "en"
    es = "es"

# Base User Schema
class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    language: LanguageEnum = LanguageEnum.en
    role: RoleEnum = RoleEnum.member
    status: UserStatusEnum = UserStatusEnum.pending

# Schema for user creation (request)
class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

# Schema for user update (request)
class UserUpdate(BaseModel):
    email: Optional[EmailStr] = None
    name: Optional[str] = None
    password: Optional[str] = None
    language: Optional[LanguageEnum] = None
    role: Optional[RoleEnum] = None
    status: Optional[UserStatusEnum] = None

# Schema for representing a user in API responses (public data)
class UserPublic(UserBase):
    id: UUID4
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

# System Setting Schemas have been moved to backend.services.settings.schemas.py

# Schema for user roles
class UserRoleBase(BaseModel):
    name: str
    description: Optional[str] = None
    permissions: List[str] = []

class UserRoleCreate(UserRoleBase):
    pass

class UserRoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permissions: Optional[List[str]] = None

class UserRolePublic(UserRoleBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

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

# ---- Admin User Management Schemas ----

class AdminUserView(UserPublic):
    # Inherits all fields from UserPublic
    # Add any additional admin-specific fields here if needed in the future
    pass

class AdminUserListResponse(BaseModel):
    items: List[AdminUserView]
    total: int
    page: int
    per_page: int
    # pages: int # Calculated as ceil(total / per_page)

class AdminUserUpdateRequest(BaseModel):
    name: Optional[str] = None
    role: Optional[RoleEnum] = None
    status: Optional[UserStatusEnum] = None
    # email: Optional[EmailStr] = None # Deciding if admin can change email - generally risky
    # password: Optional[str] = None # Deciding if admin can change password - needs careful thought 

# ---- Admin Role Management Schemas ----

class AdminRoleView(UserRolePublic):
    # Inherits from UserRolePublic, which includes id, name, description, permissions, created_at, updated_at
    # This should be suitable for viewing roles in the admin panel.
    pass

class AdminRoleListResponse(BaseModel):
    items: List[AdminRoleView]
    total: int
    page: int
    per_page: int

# UserRoleCreate can be used for AdminRoleCreateRequest
# UserRoleUpdate can be used for AdminRoleUpdateRequest 