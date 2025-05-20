import logging
from flask import request, abort
from flask_restx import Namespace, Resource, fields
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.exceptions import BadRequest, Unauthorized, Conflict, NotFound

from backend.services.auth import service as auth_service # Corrected
from backend.services.auth import schemas as auth_schemas # Corrected
from backend.core.db import db # Corrected
from backend.core.config import settings # Corrected
from backend.services.auth.schemas import UserCreate, UserPublic # Ensure UserCreate is imported

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

        print(f"[AUTH LOGIN] User ID before token creation: {user.id}") # Debug print
        print(f"[AUTH LOGIN] User ID type: {type(user.id)}") # Debug print
        
        access_token = create_access_token(identity=str(user.id))
        refresh_token = create_refresh_token(identity=str(user.id))
        
        print(f"[AUTH LOGIN] Created tokens with identity: {str(user.id)}") # Debug print
        
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