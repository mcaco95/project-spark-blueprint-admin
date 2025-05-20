import uuid
from sqlalchemy import Column, Integer, String, Boolean, DateTime, func, Enum as DBEnum, ARRAY, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.db import db # Changed back from relative import
# from app import db # Corrected to import from core.db
# Import Task model and task_assignees_table for relationships
# It's better to use string references for related models if they are in different files
# to avoid circular imports during initialization.
# from backend.services.tasks.models import Task, task_assignees_table

class User(db.Model):
    __tablename__ = "users"
    __table_args__ = {'extend_existing': True}  # Add this line to handle multiple registrations

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=True) # Name can be optional or set during profile completion
    password_hash = Column(String(255), nullable=False)
    
    # Using DBEnum for database-level enum types
    role = Column(DBEnum('admin', 'member', name='role_enum', create_type=True), default='member', nullable=False)
    status = Column(DBEnum('active', 'inactive', 'pending', name='user_status_enum', create_type=True), default='pending', nullable=False)
    language = Column(DBEnum('es', 'en', name='language_enum', create_type=True), default='en', nullable=False)
    
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Add any relationships here later, e.g.:
    # tasks_assigned = db.relationship('Task', backref='assignee', lazy=True)

    # Relationships to Tasks
    # Tasks assigned to this user
    assigned_tasks = relationship(
        "Task", 
        secondary="task_assignees", # Use string name of the table
        back_populates="assignees"
    )
    # Tasks created/owned by this user
    tasks_owned = relationship(
        "Task", 
        foreign_keys="Task.owner_id", # Use string 'ModelName.fieldName'
        back_populates="owner"
    )

    comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

    def __repr__(self):
        return f'<User {self.email}>' 

class UserRole(db.Model):
    __tablename__ = "user_roles"
    __table_args__ = {'extend_existing': True}  # Add this line

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), unique=True, nullable=False)
    description = Column(String(255), nullable=True)
    permissions = Column(ARRAY(String), nullable=False, default=[])

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # users = relationship("User", back_populates="role") # Add if User model has role_id FK and role relationship

    def __repr__(self):
        return f'<UserRole {self.name}>'

# SystemSetting model has been moved to backend.services.settings.models.py

# Make sure all necessary imports from sqlalchemy are present at the top of the file:
# import uuid
# from sqlalchemy import Column, String, DateTime, func, Enum as DBEnum
# from sqlalchemy.dialects.postgresql import UUID
# from sqlalchemy.orm import relationship
# from backend.core.db import db

class UserActivity(db.Model):
    __tablename__ = "user_activities"
    __table_args__ = {'extend_existing': True}  # Add this line

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    activity_type = Column(String(50), nullable=False)  # login, logout, action, etc.
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    user = relationship("User", backref="activities")