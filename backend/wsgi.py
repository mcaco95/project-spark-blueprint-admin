from backend.app import create_app
from backend.core.config import settings

# This is the entry point for WSGI servers like Gunicorn or uWSGI.
# It's also helpful for Flask CLI discovery.
application = create_app(settings)

# If you wanted to run this file directly for development (though run.py is better for that):
# if __name__ == "__main__":
#     application.run(host="0.0.0.0", port=5000, debug=True) 