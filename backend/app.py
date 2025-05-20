import logging
from datetime import timedelta, datetime
from flask import Flask, jsonify
from flask_restx import Api
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from werkzeug.local import LocalProxy
import json

# from flask_sqlalchemy import SQLAlchemy # Removed
from backend.core.db import db # Added
from backend.core.config import settings
from backend.services.auth.routes import auth_ns, admin_users_ns, admin_roles_ns # Import the auth, admin_users, and admin_roles namespaces
from backend.services.projects.routes import projects_ns # Import the projects namespace
from backend.services.tasks.routes import tasks_ns # Import the tasks namespace
from backend.services.comments.routes import comments_ns # Import the comments namespace
from backend.services.settings.routes import admin_settings_ns # Import the admin_settings namespace
from backend.services.admin.routes import admin_projects_ns, admin_tasks_ns, admin_analytics_ns # Import admin namespaces
from backend.services.auth.models import User # Added: Import User model
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
    doc='/docs' # URL for Swagger UI documentation
)


def create_app(config_object=settings):
    app = Flask(__name__)
    app.config.from_object(config_object)
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
            "origins": ["http://localhost:8080", "http://localhost:5000"],  # Add both frontend URLs
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
            "supports_credentials": True
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