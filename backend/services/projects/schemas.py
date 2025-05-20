# Project related Pydantic schemas will go here 

from pydantic import BaseModel, UUID4, Field, EmailStr, ConfigDict, computed_field
from typing import Optional, List
from datetime import datetime, date
from enum import Enum

# Enum for Project Status (aligned with frontend)
class ProjectStatusEnum(str, Enum):
    planning = "planning"
    active = "active"
    on_hold = "on-hold" # Value was 'on-hold' in frontend type, model uses 'on_hold', schema used 'on-hold'. Keep 'on-hold'
    completed = "completed"
    # removed 'cancelled' to align with frontend target

# Enum for Project Priority (mirroring model)
class ProjectPriorityEnum(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"

# Enum for Role in Project (mirroring model)
class ProjectRoleEnum(str, Enum):
    editor = "editor"
    viewer = "viewer"

# --- Schemas for User information (subset for project context) ---
class UserSimplePublic(BaseModel):
    id: UUID4
    name: Optional[str] = None
    email: EmailStr

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

# --- Schemas for Project Members ---
class ProjectMemberBase(BaseModel):
    user_id: UUID4
    role_in_project: ProjectRoleEnum = ProjectRoleEnum.viewer

class ProjectMemberCreate(ProjectMemberBase):
    pass

class ProjectMemberPublic(ProjectMemberBase):
    user: UserSimplePublic # Details of the member
    added_at: datetime

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

# --- Schemas for Projects ---
class ProjectBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    status: ProjectStatusEnum = ProjectStatusEnum.planning
    priority: ProjectPriorityEnum = ProjectPriorityEnum.medium
    start_date: Optional[date] = None
    end_date: Optional[date] = None # ORM model has 'end_date', Pydantic field is 'end_date'
    parent_id: Optional[UUID4] = None
    progress: Optional[int] = Field(0, ge=0, le=100)

    model_config = ConfigDict(use_enum_values=True) # Removed populate_by_name as it's not needed if field names match ORM for population

class ProjectCreate(ProjectBase):
    # owner_id will be set from the current authenticated user in the service layer
    team_member_ids: Optional[List[UUID4]] = None

class ProjectUpdate(BaseModel): 
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None 
    status: Optional[ProjectStatusEnum] = None
    priority: Optional[ProjectPriorityEnum] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None # Input can be 'end_date'. If API must accept 'due_date', this needs alias="due_date"
    parent_id: Optional[UUID4] = Field(default=None) 
    progress: Optional[int] = Field(None, ge=0, le=100)
    team_member_ids: Optional[List[UUID4]] = None
    
    model_config = ConfigDict(use_enum_values=True) # If input for update can be 'due_date', add populate_by_name=True and alias on end_date

class ProjectPublic(ProjectBase):
    id: UUID4
    owner_id: UUID4
    owner: UserSimplePublic # Information about the project owner
    created_at: datetime
    updated_at: Optional[datetime] = None
    progress: int = Field(..., ge=0, le=100) 
    
    # This field will be populated from p_db.members (SQLAlchemy relationship) by from_attributes=True
    # project_output_model in routes.py asks for 'members'
    members: List[UserSimplePublic] = Field(default_factory=list)

    model_config = ConfigDict(use_enum_values=True, from_attributes=True)

    @computed_field # For project_output_model in routes.py which expects 'due_date'
    @property
    def due_date(self) -> Optional[date]:
        return self.end_date

    @computed_field
    @property
    def createdBy(self) -> str:
        return self.owner.name if self.owner and self.owner.name else "Unknown User"

# Schema for a simplified project output, typically for nesting
class ProjectSimpleOutput(BaseModel):
    id: UUID4
    name: str
    model_config = ConfigDict(from_attributes=True)

# Schemas for API requests/responses if they differ significantly
class AddProjectMemberRequest(BaseModel):
    user_id: UUID4
    role_in_project: ProjectRoleEnum = ProjectRoleEnum.viewer 