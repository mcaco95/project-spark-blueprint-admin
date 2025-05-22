# SQLAlchemy models for Files, Folders, Permissions, etc. will go here 

import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Enum as DBEnum, Table, Text, Index, Boolean, and_
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship, foreign, remote
from sqlalchemy.sql import func
from core.db import db
from services.auth.models import User  # Add User model import

# Association table for folder permissions (Many-to-Many between Folders and Users)
folder_permissions_table = Table(
    'folder_permissions',
    db.metadata,
    Column('folder_id', UUID(as_uuid=True), ForeignKey('folders.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_level', DBEnum('view', 'edit', 'delete', 'admin', name='folder_permission_enum', create_type=True), nullable=False, default='view'),
    Column('inherit', Boolean, default=True, nullable=False),  # Whether permissions apply to subfolders
    Column('granted_by_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    Column('granted_at', DateTime, default=func.now(), nullable=False),
    extend_existing=True
)

# Association table for file permissions (Many-to-Many between Files and Users)
file_permissions_table = Table(
    'file_permissions',
    db.metadata,
    Column('file_id', UUID(as_uuid=True), ForeignKey('files.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), primary_key=True),
    Column('permission_level', DBEnum('view', 'edit', 'delete', 'admin', name='file_permission_enum', create_type=True), nullable=False, default='view'),
    Column('granted_by_id', UUID(as_uuid=True), ForeignKey('users.id', ondelete='SET NULL'), nullable=True),
    Column('granted_at', DateTime, default=func.now(), nullable=False),
    extend_existing=True
)

class Folder(db.Model):
    __tablename__ = "folders"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    parent_id = Column(UUID(as_uuid=True), ForeignKey('folders.id', ondelete='CASCADE'), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # For soft deletes

    # Relationships
    parent = relationship("Folder", remote_side=[id], back_populates="subfolders")
    subfolders = relationship("Folder", back_populates="parent", cascade="all, delete-orphan")
    files = relationship("File", back_populates="folder", cascade="all, delete-orphan")
    
    project = relationship("Project", back_populates="folders")
    owner = relationship("User", foreign_keys=[owner_id], backref="owned_folders")
    
    # Many-to-Many relationship with users through permissions
    users_with_access = relationship(
        "User",
        secondary=folder_permissions_table,
        backref="accessible_folders",
        primaryjoin=(id == folder_permissions_table.c.folder_id),
        secondaryjoin=and_(
            folder_permissions_table.c.user_id == remote(foreign(User.id)),
            folder_permissions_table.c.user_id != folder_permissions_table.c.granted_by_id
        ),
        viewonly=True
    )

    def __repr__(self):
        return f"<Folder(id={self.id}, name={self.name})>"

class File(db.Model):
    __tablename__ = "files"
    __table_args__ = (
        Index('ix_files_name', 'name'),  # Index for faster name searches
        {'extend_existing': True}
    )

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    # File metadata
    mime_type = Column(String(127), nullable=False)
    size = Column(Integer, nullable=False)  # Size in bytes
    storage_path = Column(String(512), nullable=False)  # Path in local storage (will be S3 key later)
    
    folder_id = Column(UUID(as_uuid=True), ForeignKey('folders.id', ondelete='CASCADE'), nullable=True)
    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id', ondelete='CASCADE'), nullable=True)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)
    deleted_at = Column(DateTime, nullable=True)  # For soft deletes
    
    # File usage statistics
    access_count = Column(Integer, default=0, nullable=False)
    last_accessed_at = Column(DateTime, nullable=True)

    # Relationships
    folder = relationship("Folder", back_populates="files")
    project = relationship("Project", back_populates="files")
    owner = relationship("User", foreign_keys=[owner_id], backref="owned_files")
    
    # Many-to-Many relationship with users through permissions
    users_with_access = relationship(
        "User",
        secondary=file_permissions_table,
        backref="accessible_files",
        primaryjoin=(id == file_permissions_table.c.file_id),
        secondaryjoin=and_(
            file_permissions_table.c.user_id == remote(foreign(User.id)),
            file_permissions_table.c.user_id != file_permissions_table.c.granted_by_id
        ),
        viewonly=True
    )

    def __repr__(self):
        return f"<File(id={self.id}, name={self.name})>"

class FileActivity(db.Model):
    __tablename__ = "file_activities"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    file_id = Column(UUID(as_uuid=True), ForeignKey('files.id', ondelete='CASCADE'), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey('users.id', ondelete='CASCADE'), nullable=False)
    
    activity_type = Column(
        DBEnum(
            'create', 'view', 'download', 'edit', 'delete', 
            'rename', 'move', 'share', 'permission_change',
            name='file_activity_type_enum',
            create_type=True
        ),
        nullable=False
    )
    
    details = Column(Text, nullable=True)  # Additional activity details in JSON format
    created_at = Column(DateTime, default=func.now(), nullable=False)

    # Relationships
    file = relationship("File", backref="activities")
    user = relationship("User", backref="file_activities")

    def __repr__(self):
        return f"<FileActivity(id={self.id}, file_id={self.file_id}, type={self.activity_type})>" 