import logging
from datetime import timedelta, datetime
from flask import Flask, jsonify, request
from flask_restx import Api
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from werkzeug.local import LocalProxy
import json

# from flask_sqlalchemy import SQLAlchemy # Removed
from core.db import db # Changed
from core.config import settings # Changed
from services.auth.routes import auth_ns, admin_users_ns, admin_roles_ns # Changed
from services.projects.routes import projects_ns # Changed
from services.tasks.routes import tasks_ns # Changed
from services.comments.routes import comments_ns # Changed
from services.settings.routes import admin_settings_ns # Changed
from services.admin.routes import admin_projects_ns, admin_tasks_ns, admin_analytics_ns # Changed
from services.auth.models import User # Changed
from services.files.routes import files_ns  # Add this import
# from .services.projects.routes import projects_bp # Example for future

# Custom JSON encoder to handle datetime objects
class CustomJSONEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return super().default(obj)

# db = SQLAlchemy() # Removed: db instance is now in core.db

# Global extension instances
# db instance is in core.db
migrate = Migrate() # Added instance
jwt = JWTManager() # Added instance

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask-RESTX API object with OpenAPI info
# The title, version, description will appear in the Swagger UI
api = Api(
    title=settings.PROJECT_NAME,
    version='1.0', # This can be your internal API version or app version
    description='API for Project Management Application',
    doc='/docs', # URL for Swagger UI documentation
)

# Configure Flask-RESTX JSON encoder
@api.representation('application/json')
def output_json(data, code, headers=None):
    if headers:
        headers.update({'Content-Type': 'application/json'})
    else:
        headers = {'Content-Type': 'application/json'}
    
    # Convert datetime objects to ISO format strings
    def convert_datetime(obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        return obj

    def handle_iterables(obj):
        if isinstance(obj, dict):
            return {k: handle_iterables(v) for k, v in obj.items()}
        elif isinstance(obj, (list, tuple)):
            return [handle_iterables(item) for item in obj]
        return convert_datetime(obj)

    # Process the data through our converter
    processed_data = handle_iterables(data)
    
    # Return JSON response
    from flask import make_response, jsonify
    response = make_response(jsonify(processed_data), code)
    if headers is not None:
        response.headers.extend(headers)
    return response

def create_app(config_object=settings):
    app = Flask(__name__)
    
    # Ensure database URL is set
    if not config_object.SQLALCHEMY_DATABASE_URI:
        raise ValueError("Database URL is not configured. Please set DATABASE_URL environment variable.")
    
    # Configure SQLAlchemy
    app.config["SQLALCHEMY_DATABASE_URI"] = config_object.SQLALCHEMY_DATABASE_URI
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    
    # Set custom JSON encoder
    app.json_encoder = CustomJSONEncoder
    # Propagate JWT_SECRET_KEY to Flask config for Flask-JWT-Extended
    app.config["JWT_SECRET_KEY"] = settings.JWT_SECRET_KEY
    # Make sure JWT_ACCESS_TOKEN_EXPIRE_MINUTES and JWT_REFRESH_TOKEN_EXPIRE_DAYS are integers
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(minutes=int(settings.JWT_ACCESS_TOKEN_EXPIRE_MINUTES))
    app.config["JWT_REFRESH_TOKEN_EXPIRES"] = timedelta(days=int(settings.JWT_REFRESH_TOKEN_EXPIRE_DAYS))

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    # Enable CORS for all origins with proper preflight handling
    CORS(app, resources={
        r"/*": {
            "origins": ["http://localhost", "http://5.161.185.159"],
            "methods": ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"],
            "expose_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True,
            "send_wildcard": False
        }
    })

    # Initialize Flask-RESTX Api with the Flask app
    api.init_app(app)

    # Add namespaces to the API
    # All routes from auth_ns will be prefixed with /v1/auth
    api.add_namespace(auth_ns, path=f'{settings.API_V1_STR}/auth')
    api.add_namespace(admin_users_ns, path=f'{settings.API_V1_STR}/admin/users') # Register admin_users namespace
    api.add_namespace(admin_roles_ns, path=f'{settings.API_V1_STR}/admin/roles') # Register admin_roles namespace
    api.add_namespace(admin_settings_ns, path=f'{settings.API_V1_STR}/admin/settings') # Register admin_settings namespace
    api.add_namespace(admin_projects_ns, path=f'{settings.API_V1_STR}/admin/projects')
    api.add_namespace(admin_tasks_ns, path=f'{settings.API_V1_STR}/admin/tasks')
    api.add_namespace(admin_analytics_ns, path=f'{settings.API_V1_STR}/admin/analytics')
    api.add_namespace(projects_ns, path=f'{settings.API_V1_STR}/projects') # Register projects namespace
    api.add_namespace(tasks_ns, path=f'{settings.API_V1_STR}/tasks') # Register tasks namespace
    api.add_namespace(comments_ns, path=f'{settings.API_V1_STR}/comments') # Register comments namespace
    api.add_namespace(files_ns, path=f'{settings.API_V1_STR}/files')  # Add files namespace
    # api.add_namespace(projects_ns, path=f'{settings.API_V1_STR}/projects') # Example for future

    # Register JWT error handlers for consistent JSON responses
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "TOKEN_EXPIRED",
            "message": "The token has expired."
        }), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error): # 'error' is a string explaining the error
        return jsonify({
            "error": "INVALID_TOKEN",
            "message": "Signature verification failed or token is invalid.",
            "details": str(error)
        }), 401 # Or 422 Unprocessable Entity if preferred for invalid format

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({
            "error": "AUTHORIZATION_REQUIRED",
            "message": "Request does not contain an access token.",
            "details": str(error)
        }), 401

    @jwt.needs_fresh_token_loader
    def token_not_fresh_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "FRESH_TOKEN_REQUIRED",
            "message": "The token is not fresh."
        }), 401

    @jwt.revoked_token_loader
    def revoked_token_callback(jwt_header, jwt_payload):
        return jsonify({
            "error": "TOKEN_REVOKED",
            "message": "The token has been revoked."
        }), 401

    # Callback for loading a user from the JWT
    @jwt.user_lookup_loader
    def user_lookup_callback(_jwt_header, jwt_data):
        """
        This function is called whenever a protected endpoint is accessed,
        and a user object is needed. It takes the JWT "sub" claim (the user_id)
        and returns the corresponding User object.
        """
        identity = jwt_data["sub"]
        return User.query.get(identity)

    # Remove the simple default route, as API will serve /docs
    # @app.route('/')
    # def hello():
    #     return "Hello from Project Management Backend!"

    return app 