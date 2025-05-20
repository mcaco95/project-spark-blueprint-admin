from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt as jose_jwt # Renamed to avoid conflict with Flask-JWT-Extended's jwt object
from typing import Optional, Dict, Any, List

from backend.core.db import db # Import db from core.db
from backend.services.auth.models import User, UserRole, UserActivity # Assuming models.py is in the same directory
from backend.core.config import settings # Corrected
from backend.services.auth import schemas # Corrected
from sqlalchemy import asc, desc, func # Add this import for sorting and func
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import select, delete as sqlalchemy_delete
from uuid import UUID
from backend.core.pagination import PaginatedResponse

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

def track_user_activity(user_id: str, activity_type: str, description: Optional[str] = None) -> None:
    """Helper function to track user activities."""
    activity = UserActivity(
        user_id=user_id,
        activity_type=activity_type,
        description=description
    )
    db.session.add(activity)
    db.session.commit()

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

    # Track user creation
    track_user_activity(
        user_id=str(db_user.id),
        activity_type='user_created',
        description=f'User account created for {db_user.email}'
    )

    return db_user

# authenticate_user will be used by the login route
# It will typically use Flask-JWT-Extended's capabilities after verifying credentials

# More service functions (get_user_by_id, update_user, etc.) can be added here.

def get_all_users():
    """Return all users in the system."""
    return User.query.all()

# Define a simple pagination object for return type clarity
class PagedUserResponse:
    def __init__(self, items: List[User], total: int, page: int, per_page: int):
        self.items = items
        self.total = total
        self.page = page
        self.per_page = per_page
        # self.pages = (total + per_page - 1) // per_page # Calculate total pages

def get_users_paginated(
    page: int, 
    per_page: int, 
    status: Optional[schemas.UserStatusEnum],
    role: Optional[schemas.RoleEnum],
    sort_by: str,
    sort_order: str
) -> PagedUserResponse:
    query = User.query

    if status:
        query = query.filter(User.status == status)
    if role:
        query = query.filter(User.role == role)

    # Ensure sort_by is a valid column on the User model to prevent arbitrary code execution
    allowed_sort_fields = ['email', 'name', 'created_at', 'last_login', 'status', 'role']
    if sort_by not in allowed_sort_fields:
        sort_by = 'created_at' # Default sort field if invalid
    
    sort_column = getattr(User, sort_by)

    if sort_order.lower() == 'asc':
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column)) # Default to descending

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return PagedUserResponse(
        items=pagination.items,
        total=pagination.total,
        page=pagination.page,
        per_page=pagination.per_page
    )

def update_user_by_admin(user_id: str, user_in: schemas.AdminUserUpdateRequest) -> Optional[User]:
    user = get_user_by_id(user_id)
    if not user:
        return None

    changes = []
    if user_in.name is not None and user_in.name != user.name:
        changes.append(f'name updated to {user_in.name}')
        user.name = user_in.name
    if user_in.role is not None and user_in.role != user.role:
        changes.append(f'role updated to {user_in.role}')
        user.role = user_in.role
    if user_in.status is not None and user_in.status != user.status:
        changes.append(f'status updated to {user_in.status}')
        user.status = user_in.status
    
    if changes:
        db.session.add(user)
        db.session.commit()
        db.session.refresh(user)

        # Track user update
        track_user_activity(
            user_id=user_id,
            activity_type='user_updated',
            description=f'User profile updated: {", ".join(changes)}'
        )

    return user

# ---- Role Management Service Functions ----

class PagedRoleResponse:
    def __init__(self, items: List[UserRole], total: int, page: int, per_page: int):
        self.items = items
        self.total = total
        self.page = page
        self.per_page = per_page

def get_roles_paginated(
    page: int, 
    per_page: int, 
    sort_by: str,
    sort_order: str
) -> PagedRoleResponse:
    query = UserRole.query

    allowed_sort_fields = ['name', 'created_at', 'updated_at'] # Add other fields if needed
    if sort_by not in allowed_sort_fields:
        sort_by = 'name' 
    
    sort_column = getattr(UserRole, sort_by)

    if sort_order.lower() == 'asc':
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return PagedRoleResponse(
        items=pagination.items,
        total=pagination.total,
        page=pagination.page,
        per_page=pagination.per_page
    )

def create_role_by_admin(role_in: schemas.UserRoleCreate) -> UserRole:
    # Check if role with the same name already exists
    existing_role = UserRole.query.filter_by(name=role_in.name).first()
    if existing_role:
        # Consider raising an exception here that can be caught by the route handler
        # For now, returning None, but route should handle this as a 409 Conflict
        raise ValueError(f"Role with name '{role_in.name}' already exists.") # Or handle differently

    db_role = UserRole(
        name=role_in.name,
        description=role_in.description,
        permissions=role_in.permissions if role_in.permissions is not None else []
    )
    db.session.add(db_role)
    db.session.commit()
    db.session.refresh(db_role)
    return db_role

def get_role_by_id(role_id: str) -> Optional[UserRole]:
    return UserRole.query.filter_by(id=role_id).first()

def update_role_by_admin(role_id: str, role_in: schemas.UserRoleUpdate) -> Optional[UserRole]:
    role = get_role_by_id(role_id)
    if not role:
        return None

    if role_in.name is not None:
        # Check if new name conflicts with another existing role
        if role_in.name != role.name: # Only check if name is actually changing
            existing_role_with_new_name = UserRole.query.filter_by(name=role_in.name).first()
            if existing_role_with_new_name:
                raise ValueError(f"Another role with name '{role_in.name}' already exists.")
        role.name = role_in.name
        
    if role_in.description is not None:
        role.description = role_in.description
    if role_in.permissions is not None:
        role.permissions = role_in.permissions
    
    db.session.add(role)
    db.session.commit()
    db.session.refresh(role)
    return role

def delete_role_by_admin(role_id: str) -> bool:
    role = get_role_by_id(role_id)
    if not role:
        return False
    
    # Consideration: What to do with users who have this role?
    # Option 1: Prevent deletion if users are assigned (check User.role == role.name or a FK)
    # Option 2: Set user roles to a default role or NULL (if allowed)
    # Option 3: Delete users (dangerous)
    # For now, we'll just delete the role. This needs to be decided based on app logic.
    # Example check (if User model has a 'role_name' string field linked to UserRole.name):
    # if User.query.filter_by(role_name=role.name).first():
    #     raise ValueError("Cannot delete role: users are still assigned to this role.")

    db.session.delete(role)
    db.session.commit()
    return True 

def delete_user_by_admin(user_id: str) -> bool:
    """Delete a user from the system (Admin only)."""
    user = get_user_by_id(user_id)
    if not user:
        return False
    
    # Track user deletion before actually deleting
    track_user_activity(
        user_id=user_id,
        activity_type='user_deleted',
        description=f'User account deleted: {user.email}'
    )
    
    db.session.delete(user)
    db.session.commit()
    return True 

def get_user_activity(days: int = 30) -> PaginatedResponse[dict]:
    """Gets user activity data for the specified number of days."""
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)

    # Get daily activity counts
    activity_data = db.session.query(
        func.date(UserActivity.created_at).label('date'),
        func.count(UserActivity.id).label('count')
    ).filter(
        UserActivity.created_at >= start_date,
        UserActivity.created_at <= end_date
    ).group_by(
        func.date(UserActivity.created_at)
    ).order_by(
        func.date(UserActivity.created_at).desc()
    ).all()

    # Convert to list of dicts
    items = [
        {'date': str(date), 'count': count}
        for date, count in activity_data
    ]

    return PaginatedResponse[dict](
        items=items,
        total=len(items),
        page=1,
        per_page=len(items)
    ) 