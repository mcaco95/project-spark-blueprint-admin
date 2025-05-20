from pydantic import BaseModel, UUID4
from typing import Optional, List
from datetime import datetime

from backend.services.auth.schemas import UserPublic

class CommentBase(BaseModel):
    text_content: str
    project_id: Optional[UUID4] = None
    task_id: Optional[UUID4] = None
    parent_comment_id: Optional[UUID4] = None

class CommentCreate(CommentBase):
    pass # author_id will be set by the service from the authenticated user

class CommentUpdate(BaseModel):
    text_content: Optional[str] = None

# ForwardRef or re-ordering might be needed if CommentOutputPublic is used within itself directly
# For replies, Pydantic v2 handles self-referencing models more gracefully.
class CommentOutputPublic(CommentBase):
    id: UUID4
    author: UserPublic
    created_at: datetime
    updated_at: datetime
    replies: List['CommentOutputPublic'] = [] # For threaded replies

    class Config:
        from_attributes = True # Replaces orm_mode = True

# This is needed if you are using Pydantic v1 style for older Pydantic versions with ForwardRef
# If using Pydantic v2, it usually resolves self-references automatically.
# CommentOutputPublic.model_rebuild() # For Pydantic v2, replaces update_forward_refs() 