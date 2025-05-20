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

def init_database():
    """Initialize the database and run migrations"""
    try:
        app = create_app(settings)
        
        # Initialize migrations
        migrate_instance = Migrate(app, db)
        
        with app.app_context():
            # Check if migrations directory exists
            if not os.path.exists(os.path.join(backend_dir, 'migrations')):
                print("Initializing migrations directory...")
                init()
            
            print("Creating migration...")
            migrate(message='Initial migration')
            
            print("Applying migrations...")
            upgrade()
            
        print("Database initialization completed successfully!")
        
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        sys.exit(1)

if __name__ == "__main__":
    init_database() 