from app import create_app
from core.config import settings

# This is the entry point for WSGI servers like Gunicorn or uWSGI.
# It's also helpful for Flask CLI discovery.
application = create_app(settings)

# If you wanted to run this file directly for development (though run.py is better for that):
if __name__ == "__main__":
    # This is for local development with Flask's built-in server,
    # not for Gunicorn in production.
    # Gunicorn will call the 'application' callable directly.
    application.run(host='0.0.0.0', port=settings.FLASK_RUN_PORT, debug=settings.DEBUG) 