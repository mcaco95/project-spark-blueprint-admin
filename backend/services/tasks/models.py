# Placeholder for task models 
import uuid
from sqlalchemy import Column, String, Text, DateTime, ForeignKey, Enum as DBEnum, Table, Integer, Date
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from core.db import db # Changed to relative import

# Association table for Task Assignees (Many-to-Many relationship between Tasks and Users)
task_assignees_table = Table(
    'task_assignees', db.metadata, # Use db.metadata
    Column('task_id', UUID(as_uuid=True), ForeignKey('tasks.id'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey('users.id'), primary_key=True)
)

# Association table for Task Dependencies (Many-to-Many self-referential relationship for Tasks)
task_dependencies_table = Table(
    'task_dependencies', db.metadata, # Use db.metadata
    Column('task_id', UUID(as_uuid=True), ForeignKey('tasks.id'), primary_key=True), # The task that depends on another
    Column('depends_on_task_id', UUID(as_uuid=True), ForeignKey('tasks.id'), primary_key=True), # The task it depends on
    Column('dependency_type', String, nullable=True, default='finish-to-start') # e.g., 'finish-to-start', 'start-to-start'
)

class Task(db.Model): # Inherit from db.Model
    __tablename__ = "tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    
    status = Column(DBEnum('todo', 'in_progress', 'review', 'done', 'completed', name='task_status_enum'), nullable=False, default='todo')
    priority = Column(DBEnum('low', 'medium', 'high', name='task_priority_enum'), nullable=True, default='medium')
    task_type = Column(DBEnum('task', 'meeting', name='task_type_enum'), nullable=False, default='task')

    due_date = Column(Date, nullable=True) # Changed from DateTime to Date. For 'task' type
    
    # Fields for 'meeting' type tasks - can be expanded later if more specific logic is needed
    start_date = Column(DateTime, nullable=True) 
    end_date = Column(DateTime, nullable=True) # Could also be calculated from start_date and duration
    # time is usually part of start_date/end_date as datetime objects
    # duration can be stored as an integer (e.g., minutes)
    duration_minutes = Column(Integer, nullable=True)


    project_id = Column(UUID(as_uuid=True), ForeignKey('projects.id'), nullable=False)
    owner_id = Column(UUID(as_uuid=True), ForeignKey('users.id'), nullable=False) # User who created the task

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    project = relationship("Project", back_populates="tasks")
    owner = relationship("User", foreign_keys=[owner_id]) # Assuming User model has a 'tasks_owned' or similar back_populates if needed

    assignees = relationship(
        "User",
        secondary=task_assignees_table,
        back_populates="assigned_tasks" # Requires 'assigned_tasks' relationship on User model
    )

    # Dependencies: tasks that this task depends on
    dependencies = relationship("Task", secondary=task_dependencies_table, 
                              primaryjoin=id == task_dependencies_table.c.task_id,
                              secondaryjoin=id == task_dependencies_table.c.depends_on_task_id,
                              back_populates="dependents", lazy="selectin")
    # Dependents: tasks that depend on this task
    dependents = relationship("Task", secondary=task_dependencies_table,
                            primaryjoin=id == task_dependencies_table.c.depends_on_task_id,
                            secondaryjoin=id == task_dependencies_table.c.task_id,
                            back_populates="dependencies", lazy="selectin")

    # Comments specific to this task
    comments = relationship(
        "Comment",
        primaryjoin="and_(Task.id == Comment.task_id, Comment.project_id == None)",
        back_populates="task",
        cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<Task(id={self.id}, title={self.title})>"

# You will need to add 'tasks' back_populates to Project model
# and 'assigned_tasks' back_populates to User model.
# Example for Project model:
# tasks = relationship("Task", back_populates="project", cascade="all, delete-orphan")
# Example for User model:
# assigned_tasks = relationship("Task", secondary=task_assignees_table, back_populates="assignees") 