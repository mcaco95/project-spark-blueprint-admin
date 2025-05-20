import logging
from flask import request
from flask_restx import Namespace, Resource, fields

from backend.services.settings import service as settings_service
from backend.services.settings import schemas as settings_schemas
from backend.services.auth.routes import admin_required, error_response_model # Reusing from auth routes

logger = logging.getLogger(__name__)

admin_settings_ns = Namespace('admin/settings', description='Admin System Settings operations')

# Flask-RESTX Models for Admin System Settings
admin_setting_view_model = admin_settings_ns.model('AdminSystemSettingView', {
    'id': fields.String(required=True, description='Setting ID'),
    'name': fields.String(required=True, description='Setting name'),
    'value': fields.Raw(required=True, description='Setting value (actual type depends on \'type\' field)'), # Using Raw for union type
    'type': fields.String(required=True, enum=[e.value for e in settings_schemas.SettingTypeEnum], description='Setting type'),
    'description': fields.String(description='Setting description'),
    'category': fields.String(required=True, description='Setting category'),
    'created_at': fields.DateTime(required=True, description='Creation timestamp'),
    'updated_at': fields.DateTime(required=True, description='Last update timestamp')
})

admin_setting_list_response_model = admin_settings_ns.model('AdminSystemSettingListResponse', {
    'items': fields.List(fields.Nested(admin_setting_view_model)),
    'total': fields.Integer(description='Total number of settings'),
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Number of settings per page')
})

# For create, Pydantic handles the Union type for value better directly.
# We expect a JSON where value's type matches the 'type' field.
admin_setting_create_request_model = admin_settings_ns.model('AdminSystemSettingCreateRequest', {
    'name': fields.String(required=True, description='Setting name'),
    'value': fields.Raw(required=True, description='Setting value'), # Raw to accept any JSON value
    'type': fields.String(required=True, enum=[e.value for e in settings_schemas.SettingTypeEnum], description='Setting type'),
    'description': fields.String(description='Setting description'),
    'category': fields.String(required=True, description='Setting category')
})

admin_setting_update_request_model = admin_settings_ns.model('AdminSystemSettingUpdateRequest', {
    'value': fields.Raw(description='New setting value'), # Raw to accept any JSON value
    'description': fields.String(description='New setting description'),
    'category': fields.String(description='New setting category')
})

@admin_settings_ns.route('')
class AdminSettingList(Resource):
    @admin_settings_ns.doc('list_admin_settings', security='BearerAuth')
    @admin_settings_ns.marshal_with(admin_setting_list_response_model)
    @admin_settings_ns.param('page', 'Page number', type=int, default=1)
    @admin_settings_ns.param('per_page', 'Settings per page', type=int, default=10)
    @admin_settings_ns.param('category', 'Filter by category', type=str)
    @admin_settings_ns.param('sort_by', 'Field to sort by', type=str, default='name')
    @admin_settings_ns.param('sort_order', 'Sort order (asc, desc)', type=str, default='asc')
    @admin_required
    def get(self):
        """List and filter system settings (Admin)"""
        args = request.args
        page = args.get('page', 1, type=int)
        per_page = args.get('per_page', 10, type=int)
        category = args.get('category', type=str)
        sort_by = args.get('sort_by', 'name', type=str)
        sort_order = args.get('sort_order', 'asc', type=str)

        settings_page = settings_service.get_settings_paginated(
            page=page, per_page=per_page, category=category,
            sort_by=sort_by, sort_order=sort_order
        )
        
        # Prepare items with correctly typed values
        items_with_typed_values = []
        for setting_db in settings_page.items:
            setting_dict = settings_schemas.AdminSystemSettingView.from_orm(setting_db).dict()
            # Convert value from string back to its actual type based on 'type' field
            if setting_db.type == settings_schemas.SettingTypeEnum.boolean:
                setting_dict['value'] = setting_db.value.lower() == 'true'
            elif setting_db.type == settings_schemas.SettingTypeEnum.number:
                try:
                    setting_dict['value'] = float(setting_db.value)
                    if setting_dict['value'].is_integer():
                       setting_dict['value'] = int(setting_dict['value']) 
                except ValueError:
                    setting_dict['value'] = setting_db.value # Keep as string if conversion fails
            else: # string or other
                setting_dict['value'] = setting_db.value
            items_with_typed_values.append(setting_dict)

        return {
            'items': items_with_typed_values,
            'total': settings_page.total,
            'page': settings_page.page,
            'per_page': settings_page.per_page
        }

    @admin_settings_ns.doc('create_admin_setting', security='BearerAuth')
    @admin_settings_ns.expect(admin_setting_create_request_model, validate=False)
    @admin_settings_ns.marshal_with(admin_setting_view_model, code=201)
    @admin_settings_ns.response(400, 'Invalid input', error_response_model)
    @admin_settings_ns.response(409, 'Setting already exists', error_response_model)
    @admin_required
    def post(self):
        """Create a new system setting (Admin)"""
        data = admin_settings_ns.payload
        try:
            setting_in = settings_schemas.SystemSettingCreate(**data)
            new_setting = settings_service.create_setting_by_admin(setting_in)
            # Prepare response with correctly typed value
            response_dict = settings_schemas.AdminSystemSettingView.from_orm(new_setting).dict()
            if new_setting.type == settings_schemas.SettingTypeEnum.boolean:
                response_dict['value'] = new_setting.value.lower() == 'true'
            elif new_setting.type == settings_schemas.SettingTypeEnum.number:
                try: 
                    response_dict['value'] = float(new_setting.value)
                    if response_dict['value'].is_integer():
                        response_dict['value'] = int(response_dict['value']) 
                except ValueError: pass # Should have been caught by service
            return response_dict, 201
        except ValueError as ve:
            admin_settings_ns.abort(400, str(ve)) # Handles both duplicate name and invalid value for type
        except Exception as e:
            logger.error(f"Error creating system setting: {e}", exc_info=True)
            admin_settings_ns.abort(500, "An unexpected error occurred.")

@admin_settings_ns.route('/<string:setting_id>') # Can also use /by-name/<string:name>
@admin_settings_ns.response(404, 'Setting not found', error_response_model)
class AdminSettingDetail(Resource):
    @admin_settings_ns.doc('get_admin_setting_detail', security='BearerAuth')
    @admin_settings_ns.marshal_with(admin_setting_view_model)
    @admin_required
    def get(self, setting_id: str):
        """Get a specific system setting's details (Admin)"""
        setting = settings_service.get_setting_by_id(setting_id=setting_id)
        if not setting:
            admin_settings_ns.abort(404, f'System setting with ID {setting_id} not found')
        
        response_dict = settings_schemas.AdminSystemSettingView.from_orm(setting).dict()
        if setting.type == settings_schemas.SettingTypeEnum.boolean:
            response_dict['value'] = setting.value.lower() == 'true'
        elif setting.type == settings_schemas.SettingTypeEnum.number:
            try: 
                response_dict['value'] = float(setting.value)
                if response_dict['value'].is_integer():
                    response_dict['value'] = int(response_dict['value']) 
            except ValueError: pass
        return response_dict

    @admin_settings_ns.doc('update_admin_setting_detail', security='BearerAuth')
    @admin_settings_ns.expect(admin_setting_update_request_model, validate=False)
    @admin_settings_ns.marshal_with(admin_setting_view_model)
    @admin_settings_ns.response(400, 'Invalid input', error_response_model)
    @admin_required
    def put(self, setting_id: str):
        """Update a specific system setting's details (Admin)"""
        setting = settings_service.get_setting_by_id(setting_id=setting_id)
        if not setting:
            admin_settings_ns.abort(404, f'System setting with ID {setting_id} not found')

        data = admin_settings_ns.payload
        try:
            update_data = settings_schemas.SystemSettingUpdate(**data)
            updated_setting = settings_service.update_setting_by_admin(setting_id=setting_id, setting_in=update_data)
            
            response_dict = settings_schemas.AdminSystemSettingView.from_orm(updated_setting).dict()
            if updated_setting.type == settings_schemas.SettingTypeEnum.boolean:
                response_dict['value'] = updated_setting.value.lower() == 'true'
            elif updated_setting.type == settings_schemas.SettingTypeEnum.number:
                try: 
                    response_dict['value'] = float(updated_setting.value)
                    if response_dict['value'].is_integer():
                        response_dict['value'] = int(response_dict['value']) 
                except ValueError: pass # Should have been caught by service
            return response_dict
        except ValueError as ve:
            admin_settings_ns.abort(400, str(ve))
        except Exception as e:
            logger.error(f"Error updating system setting {setting_id}: {e}", exc_info=True)
            admin_settings_ns.abort(500, "An unexpected error occurred.")

    @admin_settings_ns.doc('delete_admin_setting', security='BearerAuth')
    @admin_settings_ns.response(204, 'Setting deleted successfully')
    @admin_required
    def delete(self, setting_id: str):
        """Delete a specific system setting (Admin)"""
        try:
            success = settings_service.delete_setting_by_admin(setting_id=setting_id)
            if not success:
                admin_settings_ns.abort(404, f'System setting with ID {setting_id} not found')
            return '', 204
        except Exception as e:
            logger.error(f"Error deleting system setting {setting_id}: {e}", exc_info=True)
            admin_settings_ns.abort(500, "An unexpected error occurred.") 