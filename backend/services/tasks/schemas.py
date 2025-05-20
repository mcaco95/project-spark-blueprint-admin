from pydantic import BaseModel, UUID4, Field, ConfigDict
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Assuming UserSimplePublic is available from auth schemas
# from backend.services.auth.schemas import UserSimplePublic
# For now, defining a placeholder to avoid immediate import error if auth.schemas is not ready or different.
# Replace with actual import later.
class UserSimplePublic(BaseModel):
    id: UUID4
    name: Optional[str] = None
    email: str # Changed from EmailStr for simplicity, adjust if EmailStr is preferred

    model_config = ConfigDict(from_attributes=True)

# Minimal Project representation for nesting in Task
class ProjectSimpleOutput(BaseModel):
    id: UUID4
    name: str

    model_config = ConfigDict(from_attributes=True)

# Enums for Task fields
class TaskStatusEnum(str, Enum):
    todo = "todo"
    in_progress = "in_progress"
    review = "review"
    done = "done"
    completed = "completed"

class TaskPriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

class TaskTypeEnum(str, Enum):
    task = "task"
    meeting = "meeting"

class DependencyTypeEnum(str, Enum):
    finish_to_start = "finish-to-start"
    start_to_start = "start-to-start"
    finish_to_finish = "finish-to-finish"
    start_to_finish = "start-to-finish"

# Base Task Schema (common fields)
class TaskBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: TaskStatusEnum = TaskStatusEnum.todo
    priority: Optional[TaskPriorityEnum] = TaskPriorityEnum.medium
    task_type: TaskTypeEnum = TaskTypeEnum.task
    due_date: Optional[date] = None # For task_type = 'task'
    start_date: Optional[datetime] = None # For task_type = 'meeting'
    end_date: Optional[datetime] = None # For task_type = 'meeting'
    duration_minutes: Optional[int] = None # For task_type = 'meeting'

    model_config = ConfigDict(use_enum_values=True, from_attributes=True, populate_by_name=True)

# Schema for Creating a Task
class TaskCreate(TaskBase):
    project_id: UUID4 # Project under which this task is created
    assignee_ids: Optional[List[UUID4]] = []
    # For dependencies, client sends list of task IDs this new task depends on.
    # The dependency_type applies to all these initial dependencies for simplicity,
    # or could be a list of objects if more granular control is needed per dependency.
    depends_on_task_ids: Optional[List[UUID4]] = []
    dependency_type_for_new: Optional[DependencyTypeEnum] = DependencyTypeEnum.finish_to_start

# Schema for Updating a Task (all fields optional)
class TaskUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[TaskPriorityEnum] = None
    task_type: Optional[TaskTypeEnum] = None
    due_date: Optional[date] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    duration_minutes: Optional[int] = None
    project_id: Optional[UUID4] = None # To move task between projects, if allowed
    assignee_ids: Optional[List[UUID4]] = None # To update assignees, replace current list
    depends_on_task_ids: Optional[List[UUID4]] = None # To update dependencies, replace current list
    dependency_type_for_new: Optional[DependencyTypeEnum] = None

    model_config = ConfigDict(use_enum_values=True, from_attributes=True, populate_by_name=True)

# Minimal Task representation (e.g., for dependency lists)
class TaskSimpleOutput(BaseModel):
    id: UUID4
    title: str
    status: TaskStatusEnum

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

# Schema for Task Dependency Link (for output)
class TaskDependencyLinkPublic(BaseModel):
    depends_on_task: TaskSimpleOutput
    dependency_type: DependencyTypeEnum

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)


# Full Task Schema for API Responses (Output)
class TaskPublic(TaskBase):
    id: UUID4
    owner_id: UUID4
    project_id: UUID4
    created_at: datetime
    updated_at: Optional[datetime] = None

    owner: UserSimplePublic
    project: ProjectSimpleOutput # Nested project info
    assignees: List[UserSimplePublic] = []
    
    # How to represent dependencies in output? 
    # The model has 'dependencies' (list of Tasks it depends on) and 'dependents' (list of Tasks that depend on it)
    # For simplicity, let's show tasks it depends on.
    # dependencies_info: List[TaskDependencyLinkPublic] = [] # This would require custom resolution in service
    dependencies: List[TaskSimpleOutput] = [] # Simpler, directly from ORM if configured correctly
    # dependents: List[TaskSimpleOutput] = []

    model_config = ConfigDict(use_enum_values=True, from_attributes=True, populate_by_name=True) 