import uuid
from sqlalchemy import Column, String, Text, Enum as DBEnum, Index, DateTime
from core.db import db # Changed
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

# Define the enum type
setting_type_enum = DBEnum('string', 'boolean', 'number', name='setting_type_enum', create_type=True)

class SystemSetting(db.Model):
    __tablename__ = "system_settings"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    value = Column(String(255), nullable=False)
    type = Column(setting_type_enum, nullable=False)
    category = Column(String(50), nullable=False)
    description = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=func.now(), nullable=False)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now(), nullable=False)

    # Add indexes for frequently queried columns
    __table_args__ = (
        Index('ix_system_settings_name', 'name'),
        Index('ix_system_settings_category', 'category'),
    )

    def __repr__(self):
        return f'<SystemSetting {self.name}>' 