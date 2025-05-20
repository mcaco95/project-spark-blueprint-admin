# This file can be used for database-related utilities or to re-export db components.
# For now, we primarily use the db instance from app.py for Flask-SQLAlchemy integration.

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# from ..app import db # Example if you need to access db instance here 