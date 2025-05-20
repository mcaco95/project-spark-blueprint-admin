from pydantic import BaseModel, UUID4, Field
from typing import Optional, List, Union
from datetime import datetime
from enum import Enum

# This enum should ideally be shared or defined in a common place if used by models too
class SettingTypeEnum(str, Enum):
    string = "string"
    boolean = "boolean"
    number = "number"

class SystemSettingBase(BaseModel):
    name: str = Field(..., description="Unique name for the setting (e.g., 'site_maintenance_mode')")
    value: Union[str, bool, int, float] = Field(..., description="Value of the setting")
    type: SettingTypeEnum = Field(..., description="Data type of the setting")
    description: Optional[str] = Field(None, description="Description of what the setting does")
    category: str = Field("general", description="Category to group the setting (e.g., 'general', 'email', 'security')")

class SystemSettingCreate(SystemSettingBase):
    pass

class SystemSettingUpdate(BaseModel):
    value: Optional[Union[str, bool, int, float]] = Field(None, description="New value for the setting")
    description: Optional[str] = Field(None, description="New description for the setting")
    category: Optional[str] = Field(None, description="New category for the setting")
    # Name and type are generally not updatable to avoid breaking integrations

class SystemSettingPublic(SystemSettingBase):
    id: UUID4
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

# ---- Admin System Settings Schemas ----

class AdminSystemSettingView(SystemSettingPublic):
    # Inherits all fields from SystemSettingPublic
    pass

class AdminSystemSettingListResponse(BaseModel):
    items: List[AdminSystemSettingView]
    total: int
    page: int
    per_page: int 