from sqlalchemy import Column, String, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime

from core.db import db # Changed back from relative import
# from backend.services.auth.models import User # User is not directly used here, relationship uses string
# from backend.services.projects.models import Project # Project is not directly used here, relationship uses string
# from backend.services.tasks.models import Task # Task is not directly used here, relationship uses string

class Comment(db.Model): # Changed: Inherit from db.Model
    __tablename__ = "comments"
    __table_args__ = {'extend_existing': True}

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    text_content = Column(Text, nullable=False)
    
    author_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    task_id = Column(UUID(as_uuid=True), ForeignKey("tasks.id"), nullable=True)
    
    parent_comment_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=True) # For threading

    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    author = relationship("User", back_populates="comments")
    
    # Relationship to Project (a comment belongs to one project, a project can have many comments)
    project = relationship("Project", back_populates="comments")
    
    # Relationship to Task (a comment belongs to one task, a task can have many comments)
    task = relationship("Task", back_populates="comments")
    
    # Self-referential relationship for threaded replies
    parent_comment = relationship("Comment", remote_side=[id], back_populates="replies")
    replies = relationship("Comment", back_populates="parent_comment", cascade="all, delete-orphan")

    # Add to User model:
    # comments = relationship("Comment", back_populates="author", cascade="all, delete-orphan")

    # Add to Project model:
    # comments = relationship("Comment", back_populates="project", cascade="all, delete-orphan", 
    #                         primaryjoin="and_(Project.id == Comment.project_id, Comment.task_id == None, Comment.parent_comment_id == None)")


    # Add to Task model:
    # comments = relationship("Comment", back_populates="task", cascade="all, delete-orphan",
    #                         primaryjoin="and_(Task.id == Comment.task_id, Comment.project_id == None, Comment.parent_comment_id == None)")


    def __repr__(self):
        return f"<Comment(id={self.id}, author_id={self.author_id}, project_id={self.project_id}, task_id={self.task_id})>" 