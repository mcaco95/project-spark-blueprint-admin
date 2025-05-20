import logging
from flask import request, abort
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.exceptions import BadRequest, Unauthorized, Conflict, NotFound
from datetime import datetime

from . import service as auth_service # Changed
from . import schemas as auth_schemas # Changed
from core.db import db # Changed
from core.config import settings # Changed
from .schemas import UserCreate, UserPublic # Changed

# Get a logger instance
logger = logging.getLogger(__name__)

# Define the namespace for auth operations
auth_ns = Namespace('auth', description='Authentication operations')

# Flask-RESTX Models for request/response marshalling (mirrors Pydantic & OpenAPI)
# User model for responses
user_model_restx = auth_ns.model('User', {
    'id': fields.String(required=True, description='User ID'),
    'email': fields.String(required=True, description='User email'),
    'name': fields.String(description='User name'),
    'role': fields.String(required=True, enum=['admin', 'member'], description='User role'),
    'language': fields.String(required=True, enum=['es', 'en'], description='User language'),
    'created_at': fields.DateTime(required=True, description='Creation timestamp')
})

# Login request model
login_request_model = auth_ns.model('LoginRequest', {
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

# Login response model (includes tokens and user)
login_response_model = auth_ns.model('LoginResponse', {
    'access_token': fields.String(required=True, description='Access Token'),
    'refresh_token': fields.String(required=True, description='Refresh Token'),
    'user': fields.Nested(user_model_restx, required=True)
})

# Register request model
register_request_model = auth_ns.model('RegisterRequest', {
    'name': fields.String(required=True, description='User full name'),
    'email': fields.String(required=True, description='User email'),
    'password': fields.String(required=True, description='User password')
})

# Refresh token request model
refresh_token_request_model = auth_ns.model('RefreshTokenRequest', {
    'refresh_token': fields.String(required=True, description='Refresh token')
})

# Refresh token response model
refresh_token_response_model = auth_ns.model('RefreshTokenResponse', {
    'access_token': fields.String(required=True, description='New Access Token')
})

# Error response model
error_response_model = auth_ns.model('ErrorResponse', {
    'error': fields.String(description='Error code'),
    'message': fields.String(description='Error message'),
    'details': fields.Raw(description='Error details') # Using Raw for flexible dict
})

@auth_ns.route('/register')
class UserRegistration(Resource):
    @auth_ns.doc('register_user')
    @auth_ns.expect(register_request_model) 
    @auth_ns.response(201, 'User registered successfully. Returns token and user info.', model=login_response_model)
    @auth_ns.response(400, 'Invalid input')
    @auth_ns.response(409, 'User already exists')
    def post(self):
        """User Registration"""
        data = auth_ns.payload
        # Use the Pydantic schema for initial validation and type conversion
        try:
            validated_data = auth_schemas.RegisterRequest(**data)
        except ValueError as ve: # Catches Pydantic validation errors
            logger.error(f"Registration input validation error: {ve}")
            abort(400, description=f"Input payload validation failed. {str(ve)}")
            return # Ensure we don't proceed

        existing_user = auth_service.get_user_by_email(validated_data.email)
        if existing_user:
            # Changed message= to description=
            abort(409, description=f'User with email {validated_data.email} already exists')

        try:
            user = auth_service.create_user(user_in=validated_data)
            if not user: 
                logger.error("auth_service.create_user returned None unexpectedly")
                # For abort from flask, the message is a positional argument for 500
                abort(500, description="User creation failed due to an unexpected internal issue.")
        
        except Exception as e:
            logger.error(f"Could not register user due to an unexpected error: {e}", exc_info=True)
            # For abort from flask, the message is a positional argument for 500
            abort(500, description="An unexpected error occurred during registration. Please try again later.") 

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        # Create Pydantic model from ORM object
        user_public_data = auth_schemas.UserPublic.from_orm(user)
        
        # Convert Pydantic model to dictionary for the response
        response_user_dict = user_public_data.dict()
        
        # Ensure UUID is stringified if Pydantic's dict() didn't do it (it should for UUID4)
        # This is more of a safeguard or if Pydantic version behaves differently.
        if hasattr(response_user_dict.get('id'), 'hex'): # Check if it's still a UUID object
             response_user_dict['id'] = str(response_user_dict['id'])

        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': response_user_dict # Use the dictionary where ID is ensured to be string
        }, 201

@auth_ns.route('/login')
class UserLogin(Resource):
    @auth_ns.expect(login_request_model, validate=True)
    @auth_ns.marshal_with(login_response_model)
    @auth_ns.response(400, 'Invalid input', model=error_response_model)
    @auth_ns.response(401, 'Invalid credentials', model=error_response_model)
    def post(self):
        """User Login"""
        data = auth_ns.payload
        try:
            validated_data = auth_schemas.LoginRequest(**data)
        except ValueError as ve: # Catch Pydantic validation errors
            logger.error(f"Login input validation error: {ve}")
            abort(400, description=f"Invalid login payload: {str(ve)}") 
            return # Should not be reached if abort works

        user = auth_service.get_user_by_email(validated_data.email)
        if not user or not auth_service.verify_password(validated_data.password, user.password_hash):
            abort(401, description='Invalid email or password')

        # Update last login timestamp
        user.last_login = datetime.utcnow()
        db.session.add(user)
        db.session.commit()

        # Track login activity
        auth_service.track_user_activity(
            user_id=str(user.id),
            activity_type='login',
            description=f'User logged in from {request.remote_addr}'
        )

        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        user_public_data = auth_schemas.UserPublic.from_orm(user)
        response_user_dict = user_public_data.dict()
        if hasattr(response_user_dict.get('id'), 'hex'):
             response_user_dict['id'] = str(response_user_dict['id'])
        
        return {
            'access_token': access_token,
            'refresh_token': refresh_token,
            'user': response_user_dict
        }

@auth_ns.route('/refresh')
class TokenRefresh(Resource):
    @auth_ns.expect(refresh_token_request_model, validate=True)
    @auth_ns.marshal_with(refresh_token_response_model)
    @auth_ns.response(401, 'Invalid refresh token', error_response_model)
    @jwt_required(refresh=True) # Requires a valid refresh token
    def post(self):
        """Refresh Access Token"""
        current_user_identity = get_jwt_identity() # This will now be the user ID string
        # No change needed here if the original identity for refresh token was user.id string
        new_access_token = create_access_token(identity=current_user_identity)
        return {'access_token': new_access_token}

@auth_ns.route('/logout')
class UserLogout(Resource):
    @auth_ns.doc(security='BearerAuth')
    @auth_ns.response(200, 'Successfully logged out')
    @auth_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @jwt_required()
    def post(self):
        """User Logout"""
        current_user_id = get_jwt_identity()
        
        # Track logout activity
        auth_service.track_user_activity(
            user_id=current_user_id,
            activity_type='logout',
            description=f'User logged out from {request.remote_addr}'
        )
        
        return {'message': 'Successfully logged out'}, 200

@auth_ns.route('/me')
class UserMe(Resource):
    @auth_ns.marshal_with(user_model_restx)
    @auth_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @auth_ns.doc(security='BearerAuth') # Indicates this endpoint uses BearerAuth
    @jwt_required() # Requires a valid access token
    def get(self):
        """Get Current User Details"""
        current_user_id_str = get_jwt_identity() # This will be user_id as a string
        # We need to fetch user by ID now, not email
        user = auth_service.get_user_by_id(user_id=current_user_id_str) # Assuming get_user_by_id exists
        if not user:
            # This case should ideally not happen if JWT identity is valid and tied to an existing user
            raise NotFound('User not found') 
        
        # Using Pydantic schema for consistent serialization, then converting to dict
        return auth_schemas.UserPublic.from_orm(user).dict()

@auth_ns.route('/users')
class UserList(Resource):
    @auth_ns.marshal_list_with(user_model_restx)
    @auth_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @auth_ns.doc(security='BearerAuth')
    @jwt_required()
    def get(self):
        """List all users (for project member selection)"""
        users = auth_service.get_all_users()
        return [auth_schemas.UserPublic.from_orm(user).dict() for user in users]

# It's good practice to set up JWT error handlers (e.g. for expired tokens, invalid tokens) globally in app.py or here. 


# ---- Admin User Management Namespace ----
admin_users_ns = Namespace('admin/users', description='Admin User Management operations')

# Flask-RESTX Models for Admin User Management
admin_user_view_model = admin_users_ns.model('AdminUserView', {
    'id': fields.String(required=True, description='User ID'),
    'email': fields.String(required=True, description='User email'),
    'name': fields.String(description='User name'),
    'role': fields.String(required=True, enum=['admin', 'member'], description='User role'),
    'status': fields.String(required=True, enum=['active', 'inactive', 'pending'], description='User status'),
    'language': fields.String(required=True, enum=['es', 'en'], description='User language'),
    'created_at': fields.DateTime(required=True, description='Creation timestamp'),
    'last_login': fields.DateTime(description='Last login timestamp')
})

admin_user_create_request_model = admin_users_ns.model('AdminUserCreateRequest', {
    'email': fields.String(required=True, description='User email'),
    'name': fields.String(required=True, description='User name'),
    'password': fields.String(required=True, description='User password'),
    'role': fields.String(required=True, enum=['admin', 'member'], description='User role'),
    'status': fields.String(required=True, enum=['active', 'inactive', 'pending'], description='User status'),
    'language': fields.String(required=True, enum=['es', 'en'], description='User language', default='en')
})

admin_user_list_response_model = admin_users_ns.model('AdminUserListResponse', {
    'items': fields.List(fields.Nested(admin_user_view_model)),
    'total': fields.Integer(description='Total number of users'),
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Number of users per page')
})

admin_user_update_request_model = admin_users_ns.model('AdminUserUpdateRequest', {
    'name': fields.String(description='User name'),
    'role': fields.String(enum=['admin', 'member'], description='User role'),
    'status': fields.String(enum=['active', 'inactive', 'pending'], description='User status')
})

# Helper function for admin check (to be expanded with actual role check)
def admin_required(fn):
    @jwt_required()
    def wrapper(*args, **kwargs):
        current_user_id = get_jwt_identity()
        user = auth_service.get_user_by_id(user_id=current_user_id)
        # TODO: Replace with actual role check from the user object
        if not user or user.role != auth_schemas.RoleEnum.admin: # Assuming role is accessible like this
            admin_users_ns.abort(403, 'Forbidden: Administrator access required')
        return fn(*args, **kwargs)
    return wrapper

@admin_users_ns.route('')
class AdminUserList(Resource):
    @admin_users_ns.doc('list_admin_users', security='BearerAuth')
    @admin_users_ns.marshal_with(admin_user_list_response_model)
    @admin_users_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @admin_users_ns.response(403, 'Forbidden: Administrator access required', error_response_model)
    @admin_users_ns.param('page', 'Page number', type=int, default=1)
    @admin_users_ns.param('per_page', 'Users per page', type=int, default=10)
    @admin_users_ns.param('status', 'Filter by status', type=str, enum=['active', 'inactive', 'pending'])
    @admin_users_ns.param('role', 'Filter by role', type=str, enum=['admin', 'member'])
    @admin_users_ns.param('sort_by', 'Field to sort by (e.g., email, created_at)', type=str, default='created_at')
    @admin_users_ns.param('sort_order', 'Sort order (asc, desc)', type=str, default='desc')
    @admin_required
    def get(self):
        """List and filter users (Admin)"""
        args = request.args
        page = args.get('page', 1, type=int)
        per_page = args.get('per_page', 10, type=int)
        status = args.get('status', type=str)
        role = args.get('role', type=str)
        sort_by = args.get('sort_by', 'created_at', type=str)
        sort_order = args.get('sort_order', 'desc', type=str)

        # Convert string params to Enums where necessary for service layer
        status_enum = auth_schemas.UserStatusEnum(status) if status else None
        role_enum = auth_schemas.RoleEnum(role) if role else None 

        users_page = auth_service.get_users_paginated(
            page=page, per_page=per_page, 
            status=status_enum, role=role_enum,
            sort_by=sort_by, sort_order=sort_order
        )
        
        return {
            'items': [auth_schemas.AdminUserView.from_orm(user).dict() for user in users_page.items],
            'total': users_page.total,
            'page': users_page.page,
            'per_page': users_page.per_page
        }

    @admin_users_ns.doc('create_admin_user', security='BearerAuth')
    @admin_users_ns.expect(admin_user_create_request_model, validate=True)
    @admin_users_ns.marshal_with(admin_user_view_model, code=201)
    @admin_users_ns.response(400, 'Invalid input', error_response_model)
    @admin_users_ns.response(409, 'User already exists', error_response_model)
    @admin_required
    def post(self):
        """Create a new user (Admin)"""
        data = admin_users_ns.payload
        try:
            # Use RegisterRequest schema for validation
            user_data = auth_schemas.RegisterRequest(**data)
            
            # Check if user already exists
            existing_user = auth_service.get_user_by_email(user_data.email)
            if existing_user:
                admin_users_ns.abort(409, f"User with email {user_data.email} already exists")
            
            # Create the user
            new_user = auth_service.create_user(user_data)
            if not new_user:
                admin_users_ns.abort(500, "Failed to create user")
            
            # Return the created user
            return auth_schemas.AdminUserView.from_orm(new_user).dict(), 201
            
        except ValueError as ve:
            admin_users_ns.abort(400, str(ve))
        except Exception as e:
            logger.error(f"Error creating user: {e}", exc_info=True)
            admin_users_ns.abort(500, "An unexpected error occurred while creating the user.")

@admin_users_ns.route('/<string:user_id>')
@admin_users_ns.response(404, 'User not found', error_response_model)
class AdminUserDetail(Resource):
    @admin_users_ns.doc('get_admin_user_detail', security='BearerAuth')
    @admin_users_ns.marshal_with(admin_user_view_model)
    @admin_users_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @admin_users_ns.response(403, 'Forbidden: Administrator access required', error_response_model)
    @admin_required
    def get(self, user_id: str):
        """Get a specific user's details (Admin)"""
        user = auth_service.get_user_by_id(user_id=user_id)
        if not user:
            admin_users_ns.abort(404, f'User with ID {user_id} not found')
        return auth_schemas.AdminUserView.from_orm(user).dict()

    @admin_users_ns.doc('update_admin_user_detail', security='BearerAuth')
    @admin_users_ns.expect(admin_user_update_request_model, validate=True)
    @admin_users_ns.marshal_with(admin_user_view_model)
    @admin_users_ns.response(400, 'Invalid input', error_response_model)
    @admin_users_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @admin_users_ns.response(403, 'Forbidden: Administrator access required', error_response_model)
    @admin_required
    def put(self, user_id: str):
        """Update a specific user's details (Admin)"""
        user = auth_service.get_user_by_id(user_id=user_id)
        if not user:
            admin_users_ns.abort(404, f'User with ID {user_id} not found')

        data = admin_users_ns.payload
        try:
            update_data = auth_schemas.AdminUserUpdateRequest(**data)
        except ValueError as ve:
            admin_users_ns.abort(400, f'Invalid payload: {ve}')

        updated_user = auth_service.update_user_by_admin(user_id=user_id, user_in=update_data)
        if not updated_user:
             admin_users_ns.abort(500, 'Failed to update user') # Should not happen if user exists
        return auth_schemas.AdminUserView.from_orm(updated_user).dict()

    @admin_users_ns.doc('delete_admin_user', security='BearerAuth')
    @admin_users_ns.response(204, 'User deleted successfully')
    @admin_users_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @admin_users_ns.response(403, 'Forbidden: Administrator access required', error_response_model)
    @admin_users_ns.response(404, 'User not found', error_response_model)
    @admin_required
    def delete(self, user_id: str):
        """Delete a specific user (Admin)"""
        try:
            success = auth_service.delete_user_by_admin(user_id=user_id)
            if not success:
                admin_users_ns.abort(404, f'User with ID {user_id} not found')
            return '', 204
        except Exception as e:
            logger.error(f"Error deleting user {user_id}: {e}", exc_info=True)
            admin_users_ns.abort(500, "An unexpected error occurred while deleting the user.")

# Add new endpoints for role and status updates
role_update_model = admin_users_ns.model('RoleUpdate', {
    'role': fields.String(required=True, enum=['admin', 'member'], description='New role')
})

status_update_model = admin_users_ns.model('StatusUpdate', {
    'status': fields.String(required=True, enum=['active', 'inactive', 'pending'], description='New status')
})

@admin_users_ns.route('/<string:user_id>/role')
@admin_users_ns.response(404, 'User not found', error_response_model)
class AdminUserRole(Resource):
    @admin_users_ns.doc('update_user_role', security='BearerAuth')
    @admin_users_ns.expect(role_update_model, validate=True)
    @admin_users_ns.marshal_with(admin_user_view_model)
    @admin_users_ns.response(400, 'Invalid input', error_response_model)
    @admin_users_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @admin_users_ns.response(403, 'Forbidden: Administrator access required', error_response_model)
    @admin_required
    def put(self, user_id: str):
        """Update a user's role (Admin)"""
        user = auth_service.get_user_by_id(user_id=user_id)
        if not user:
            admin_users_ns.abort(404, f'User with ID {user_id} not found')

        data = admin_users_ns.payload
        try:
            update_data = auth_schemas.AdminUserUpdateRequest(role=data['role'])
            updated_user = auth_service.update_user_by_admin(user_id=user_id, user_in=update_data)
            if not updated_user:
                admin_users_ns.abort(500, 'Failed to update user role')
            return auth_schemas.AdminUserView.from_orm(updated_user).dict()
        except ValueError as ve:
            admin_users_ns.abort(400, f'Invalid role: {ve}')
        except Exception as e:
            logger.error(f"Error updating user role {user_id}: {e}", exc_info=True)
            admin_users_ns.abort(500, "An unexpected error occurred while updating the user role.")

@admin_users_ns.route('/<string:user_id>/status')
@admin_users_ns.response(404, 'User not found', error_response_model)
class AdminUserStatus(Resource):
    @admin_users_ns.doc('update_user_status', security='BearerAuth')
    @admin_users_ns.expect(status_update_model, validate=True)
    @admin_users_ns.marshal_with(admin_user_view_model)
    @admin_users_ns.response(400, 'Invalid input', error_response_model)
    @admin_users_ns.response(401, 'Unauthorized or Invalid Token', error_response_model)
    @admin_users_ns.response(403, 'Forbidden: Administrator access required', error_response_model)
    @admin_required
    def put(self, user_id: str):
        """Update a user's status (Admin)"""
        user = auth_service.get_user_by_id(user_id=user_id)
        if not user:
            admin_users_ns.abort(404, f'User with ID {user_id} not found')

        data = admin_users_ns.payload
        try:
            update_data = auth_schemas.AdminUserUpdateRequest(status=data['status'])
            updated_user = auth_service.update_user_by_admin(user_id=user_id, user_in=update_data)
            if not updated_user:
                admin_users_ns.abort(500, 'Failed to update user status')
            return auth_schemas.AdminUserView.from_orm(updated_user).dict()
        except ValueError as ve:
            admin_users_ns.abort(400, f'Invalid status: {ve}')
        except Exception as e:
            logger.error(f"Error updating user status {user_id}: {e}", exc_info=True)
            admin_users_ns.abort(500, "An unexpected error occurred while updating the user status.")

# ---- Admin Role Management Namespace ----
admin_roles_ns = Namespace('admin/roles', description='Admin Role Management operations')

# Flask-RESTX Models for Admin Role Management
admin_role_view_model = admin_roles_ns.model('AdminRoleView', {
    'id': fields.String(required=True, description='Role ID'),
    'name': fields.String(required=True, description='Role name'),
    'description': fields.String(description='Role description'),
    'permissions': fields.List(fields.String, description='List of permissions'),
    'created_at': fields.DateTime(required=True, description='Creation timestamp'),
    'updated_at': fields.DateTime(required=True, description='Last update timestamp')
})

admin_role_list_response_model = admin_roles_ns.model('AdminRoleListResponse', {
    'items': fields.List(fields.Nested(admin_role_view_model)),
    'total': fields.Integer(description='Total number of roles'),
    'page': fields.Integer(description='Current page number'),
    'per_page': fields.Integer(description='Number of roles per page')
})

admin_role_create_request_model = admin_roles_ns.model('AdminRoleCreateRequest', {
    'name': fields.String(required=True, description='Role name'),
    'description': fields.String(description='Role description'),
    'permissions': fields.List(fields.String, description='List of permissions')
})

admin_role_update_request_model = admin_roles_ns.model('AdminRoleUpdateRequest', {
    'name': fields.String(description='Role name'),
    'description': fields.String(description='Role description'),
    'permissions': fields.List(fields.String, description='List of permissions')
})

@admin_roles_ns.route('')
class AdminRoleList(Resource):
    @admin_roles_ns.doc('list_admin_roles', security='BearerAuth')
    @admin_roles_ns.marshal_with(admin_role_list_response_model)
    @admin_roles_ns.param('page', 'Page number', type=int, default=1)
    @admin_roles_ns.param('per_page', 'Roles per page', type=int, default=10)
    @admin_roles_ns.param('sort_by', 'Field to sort by', type=str, default='name')
    @admin_roles_ns.param('sort_order', 'Sort order (asc, desc)', type=str, default='asc')
    @admin_required # Uses the same admin_required decorator
    def get(self):
        """List and filter roles (Admin)"""
        args = request.args
        page = args.get('page', 1, type=int)
        per_page = args.get('per_page', 10, type=int)
        sort_by = args.get('sort_by', 'name', type=str)
        sort_order = args.get('sort_order', 'asc', type=str)

        roles_page = auth_service.get_roles_paginated(
            page=page, per_page=per_page, 
            sort_by=sort_by, sort_order=sort_order
        )
        
        return {
            'items': [auth_schemas.AdminRoleView.from_orm(role).dict() for role in roles_page.items],
            'total': roles_page.total,
            'page': roles_page.page,
            'per_page': roles_page.per_page
        }

    @admin_roles_ns.doc('create_admin_role', security='BearerAuth')
    @admin_roles_ns.expect(admin_role_create_request_model, validate=True)
    @admin_roles_ns.marshal_with(admin_role_view_model, code=201)
    @admin_roles_ns.response(400, 'Invalid input', error_response_model)
    @admin_roles_ns.response(409, 'Role already exists', error_response_model)
    @admin_required
    def post(self):
        """Create a new role (Admin)"""
        data = admin_roles_ns.payload
        try:
            role_in = auth_schemas.UserRoleCreate(**data) # Reusing UserRoleCreate
            new_role = auth_service.create_role_by_admin(role_in)
            return auth_schemas.AdminRoleView.from_orm(new_role).dict(), 201
        except ValueError as ve: # Catch specific error for existing role name
            admin_roles_ns.abort(409, str(ve))
        except Exception as e:
            logger.error(f"Error creating role: {e}", exc_info=True)
            admin_roles_ns.abort(500, "An unexpected error occurred while creating the role.")


@admin_roles_ns.route('/<string:role_id>')
@admin_roles_ns.response(404, 'Role not found', error_response_model)
class AdminRoleDetail(Resource):
    @admin_roles_ns.doc('get_admin_role_detail', security='BearerAuth')
    @admin_roles_ns.marshal_with(admin_role_view_model)
    @admin_required
    def get(self, role_id: str):
        """Get a specific role's details (Admin)"""
        role = auth_service.get_role_by_id(role_id=role_id)
        if not role:
            admin_roles_ns.abort(404, f'Role with ID {role_id} not found')
        return auth_schemas.AdminRoleView.from_orm(role).dict()

    @admin_roles_ns.doc('update_admin_role_detail', security='BearerAuth')
    @admin_roles_ns.expect(admin_role_update_request_model, validate=True)
    @admin_roles_ns.marshal_with(admin_role_view_model)
    @admin_roles_ns.response(400, 'Invalid input', error_response_model)
    @admin_roles_ns.response(409, 'Role name conflict', error_response_model)
    @admin_required
    def put(self, role_id: str):
        """Update a specific role's details (Admin)"""
        role = auth_service.get_role_by_id(role_id=role_id)
        if not role:
            admin_roles_ns.abort(404, f'Role with ID {role_id} not found')

        data = admin_roles_ns.payload
        try:
            update_data = auth_schemas.UserRoleUpdate(**data) # Reusing UserRoleUpdate
            updated_role = auth_service.update_role_by_admin(role_id=role_id, role_in=update_data)
            return auth_schemas.AdminRoleView.from_orm(updated_role).dict()
        except ValueError as ve: # Catch specific error for name conflict
            admin_roles_ns.abort(409, str(ve))
        except Exception as e:
            logger.error(f"Error updating role {role_id}: {e}", exc_info=True)
            admin_roles_ns.abort(500, "An unexpected error occurred while updating the role.")

    @admin_roles_ns.doc('delete_admin_role', security='BearerAuth')
    @admin_roles_ns.response(204, 'Role deleted successfully')
    @admin_roles_ns.response(400, 'Cannot delete role (e.g., users assigned)', error_response_model)
    @admin_required
    def delete(self, role_id: str):
        """Delete a specific role (Admin)"""
        try:
            success = auth_service.delete_role_by_admin(role_id=role_id)
            if not success:
                admin_roles_ns.abort(404, f'Role with ID {role_id} not found')
            return '', 204
        except ValueError as ve: # Catch specific error (e.g., role in use)
            admin_roles_ns.abort(400, str(ve))
        except Exception as e:
            logger.error(f"Error deleting role {role_id}: {e}", exc_info=True)
            admin_roles_ns.abort(500, "An unexpected error occurred while deleting the role.") 