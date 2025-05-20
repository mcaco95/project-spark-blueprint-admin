import os
import sys
from pathlib import Path

# Get the absolute path to the backend directory
backend_dir = Path(__file__).parent.absolute()
project_root = backend_dir.parent

# Add both backend and project root to Python path
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))
if str(project_root) not in sys.path:
    sys.path.insert(0, str(project_root))

from flask_migrate import Migrate, init, migrate, upgrade
from app import create_app
from core.config import settings
from core.db import db

# Import all models to ensure they're registered with SQLAlchemy
from services.auth.models import User
from services.projects.models import Project
from services.tasks.models import Task
from services.comments.models import Comment

def init_database():
    """Initialize the database and run migrations"""
    try:
        print("Creating Flask app...")
        app = create_app(settings)
        
        print("Initializing SQLAlchemy...")
        db.init_app(app)
        
        print("Setting up Flask-Migrate...")
        migrate_instance = Migrate(app, db)
        
        with app.app_context():
            print(f"Database URL: {app.config['SQLALCHEMY_DATABASE_URI']}")
            
            # Ensure the database exists
            try:
                db.engine.connect()
                print("Successfully connected to database!")
            except Exception as e:
                print(f"Error connecting to database: {str(e)}")
                raise
            
            # Check if migrations directory exists
            if not os.path.exists(os.path.join(backend_dir, 'migrations')):
                print("Initializing migrations directory...")
                init()
            
            print("Creating migration...")
            try:
                migrate(message='Initial migration')
            except Exception as e:
                print(f"Migration creation error: {str(e)}")
                # If migration already exists, we can continue
                pass
            
            print("Applying migrations...")
            upgrade()
            
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    init_database() 