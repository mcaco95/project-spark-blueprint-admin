import os
import sys
import click # Import click for command arguments
from flask.cli import with_appcontext
from flask_migrate import Migrate, upgrade
from flask import current_app

# Add the current directory (backend) to sys.path if not already there,
# to help with module resolution when FLASK_APP points to this file.
# This is often good practice for manage.py or wsgi.py files.
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from backend.core.db import db       # SQLAlchemy instance
from backend.core.config import settings
from backend.app import create_app   # Flask app factory

# Import models for migrations
from backend.services.auth.models import User
from backend.services.projects.models import Project # Import the new Project model
# from backend.services.tasks.models import Task     # Example for future models

# Initialize Flask app
app = create_app(settings)

# Initialize Flask-Migrate
migrate = Migrate(app, db)

# This file (manage.py) is intended to be used as the FLASK_APP target.
# Example: 
# (venv) C:\...\backend> set FLASK_APP=manage.py
# (venv) C:\...\backend> flask db init
# (venv) C:\...\backend> flask db migrate -m "Initial auth models"
# (venv) C:\...\backend> flask db upgrade

@app.cli.command("create-admin")
@click.argument("email")
@click.argument("password")
@with_appcontext
def create_admin(email, password):
    """Create an admin user."""
    from backend.services.auth.service import create_user, get_password_hash
    from backend.services.auth.schemas import RegisterRequest

    # Check if user already exists
    if User.query.filter_by(email=email).first():
        click.echo(f"User {email} already exists")
        return

    # Create admin user
    user_data = RegisterRequest(
        email=email,
        password=password,
        name="Admin User"
    )
    user = create_user(user_data)
    user.role = 'admin'
    db.session.commit()
    click.echo(f"Admin user {email} created successfully")

@app.cli.command("init-db")
@with_appcontext
def init_db():
    """Initialize the database."""
    # Run migrations
    upgrade()
    click.echo("Database initialized successfully")

@app.cli.command("set-user-role")
@click.argument("email")
@click.argument("role")
def set_user_role_command(email: str, role: str):
    """Sets the role for a user identified by their email."""
    user = User.query.filter_by(email=email).first()
    if not user:
        print(f"User with email {email} not found.")
        return

    valid_roles = ['admin', 'member'] # Use literal strings for validation
    if role not in valid_roles:
        print(f"Invalid role: {role}. Valid roles are: {valid_roles}")
        return

    user.role = role
    db.session.commit()
    print(f"Role for user {email} updated to {role}.")

if __name__ == '__main__':
    # This block allows running the Flask development server via `python manage.py`
    # However, for migrations, you'll use `flask db ...` commands.
    # For running the dev server, typically `flask run` is preferred after setting FLASK_APP.
    # For clarity, we can leave this out or make it explicit that it runs the dev server.
    # Example to run dev server: app.run()
    print("To run database migrations, set FLASK_APP=manage.py and use 'flask db <command>'.")
    print("To run the development server, set FLASK_APP=manage.py and use 'flask run'.")
    app.cli() 