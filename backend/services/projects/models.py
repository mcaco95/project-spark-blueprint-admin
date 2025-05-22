# Project related SQLAlchemy models will go here 

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Date, DateTime, Enum as DBEnum, ForeignKey, Table, func, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from core.db import db
from services.auth.models import User
from services.files.models import File, Folder  # Add import for File and Folder models
# Import Task model
# from backend.services.tasks.models import Task # This will cause circular dependency if Task imports Project too early.
                                               # Relationships can be defined using strings for model names.

# Define an association table for the many-to-many relationship
# between Projects and Users (as members)
project_members_table = Table(
    'project_members',
    db.metadata,
    Column('project_id', UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('role_in_project', DBEnum('viewer', 'editor', 'admin', name='project_role_enum', create_type=True), nullable=False, default='viewer'),
    Column('added_at', DateTime, default=func.now(), nullable=False),
    extend_existing=True
)

class Project(db.Model):
    __tablename__ = "projects"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(String(1000), nullable=True)
    
    status = Column(DBEnum('planning', 'active', 'on-hold', 'completed', name='project_status_enum', create_type=True), default='planning', nullable=False)
    priority = Column(DBEnum('low', 'medium', 'high', name='project_priority_enum', create_type=True), default='medium', nullable=False)
    
    start_date = Column(DateTime, nullable=True) # Can be set later than creation
    end_date = Column(DateTime, nullable=True)
    progress = Column(Integer, nullable=False, default=0)
    
    parent_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=True) # For project hierarchy

    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False) # User who created/owns the project
    created_by_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False)
    updated_by_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=True)

    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True) # For soft deletes

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], backref="owned_projects")
    creator = relationship("User", foreign_keys=[created_by_id], backref="created_projects")
    updater = relationship("User", foreign_keys=[updated_by_id], backref="updated_projects_info") # Avoid backref collision

    parent_project = relationship("Project", remote_side=[id], backref="sub_projects")
    
    members = relationship("User", secondary=project_members_table, backref="member_projects")

    # tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan") # Defined when Task model exists
    # files = relationship("FileMetadata", back_populates="project", cascade="all, delete-orphan") # Defined when FileMetadata model exists
    tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")

    # Comments specific to this project (not belonging to a task within this project)
    comments = relationship(
        "Comment", 
        primaryjoin="and_(Project.id == Comment.project_id, Comment.task_id == None)",
        back_populates="project", 
        cascade="all, delete-orphan"
    )

    # File management relationships
    files = relationship("File", back_populates="project", cascade="all, delete-orphan")
    folders = relationship("Folder", back_populates="project", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<Project {self.name} ({self.id})>" 