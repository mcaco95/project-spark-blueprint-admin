import os
import sys

# Add the parent directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

from flask_migrate import upgrade
from backend.app import create_app
from backend.core.config import settings

def run_migrations():
    """Run database migrations"""
    app = create_app(settings)
    with app.app_context():
        upgrade()

if __name__ == "__main__":
    run_migrations() 