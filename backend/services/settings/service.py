from typing import Optional, List
from sqlalchemy import asc, desc

from backend.core.db import db
from backend.services.settings.models import SystemSetting # Import the model from its new location
from backend.services.settings import schemas # Import schemas from its new location

class PagedSettingsResponse:
    def __init__(self, items: List[SystemSetting], total: int, page: int, per_page: int):
        self.items = items
        self.total = total
        self.page = page
        self.per_page = per_page

def get_settings_paginated(
    page: int, 
    per_page: int, 
    category: Optional[str],
    sort_by: str,
    sort_order: str
) -> PagedSettingsResponse:
    query = SystemSetting.query

    if category:
        query = query.filter(SystemSetting.category == category)

    allowed_sort_fields = ['name', 'category', 'created_at', 'updated_at']
    if sort_by not in allowed_sort_fields:
        sort_by = 'name' 
    
    sort_column = getattr(SystemSetting, sort_by)

    if sort_order.lower() == 'asc':
        query = query.order_by(asc(sort_column))
    else:
        query = query.order_by(desc(sort_column))

    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return PagedSettingsResponse(
        items=pagination.items,
        total=pagination.total,
        page=pagination.page,
        per_page=pagination.per_page
    )

def get_setting_by_id(setting_id: str) -> Optional[SystemSetting]:
    return SystemSetting.query.filter_by(id=setting_id).first()

def get_setting_by_name(name: str) -> Optional[SystemSetting]:
    return SystemSetting.query.filter_by(name=name).first()

def create_setting_by_admin(setting_in: schemas.SystemSettingCreate) -> SystemSetting:
    existing_setting = get_setting_by_name(setting_in.name)
    if existing_setting:
        raise ValueError(f"System setting with name '{setting_in.name}' already exists.")

    # Basic type validation/conversion for value based on type
    value_to_store = str(setting_in.value) # Store as string by default
    if setting_in.type == schemas.SettingTypeEnum.boolean:
        value_to_store = str(bool(setting_in.value)).lower() # 'true' or 'false'
    elif setting_in.type == schemas.SettingTypeEnum.number:
        try:
            float(setting_in.value) # Check if it can be a number
            value_to_store = str(setting_in.value)
        except ValueError:
            raise ValueError("Invalid value for number type setting.")

    db_setting = SystemSetting(
        name=setting_in.name,
        value=value_to_store,
        type=setting_in.type,
        description=setting_in.description,
        category=setting_in.category
    )
    db.session.add(db_setting)
    db.session.commit()
    db.session.refresh(db_setting)
    return db_setting

def update_setting_by_admin(setting_id: str, setting_in: schemas.SystemSettingUpdate) -> Optional[SystemSetting]:
    setting = get_setting_by_id(setting_id)
    if not setting:
        return None

    if setting_in.value is not None:
        value_to_store = str(setting_in.value)
        if setting.type == schemas.SettingTypeEnum.boolean:
            value_to_store = str(bool(setting_in.value)).lower()
        elif setting.type == schemas.SettingTypeEnum.number:
            try:
                float(setting_in.value) # Check if it can be a number
                value_to_store = str(setting_in.value)
            except ValueError:
                raise ValueError("Invalid value for number type setting.")
        setting.value = value_to_store
        
    if setting_in.description is not None:
        setting.description = setting_in.description
    if setting_in.category is not None:
        setting.category = setting_in.category
    
    db.session.add(setting)
    db.session.commit()
    db.session.refresh(setting)
    return setting

def delete_setting_by_admin(setting_id: str) -> bool:
    setting = get_setting_by_id(setting_id)
    if not setting:
        return False
    
    # Add any pre-delete checks if necessary (e.g., if setting is critical)
    
    db.session.delete(setting)
    db.session.commit()
    return True 