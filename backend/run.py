# This script is used to run the Flask development server.

from backend.app import create_app
from backend.core.config import settings

app = create_app(settings)

if __name__ == "__main__":
    # Ensure you have created .env_backend with your settings, especially JWT_SECRET_KEY
    # and database credentials.
    # The host 0.0.0.0 makes the server accessible externally (e.g., from your frontend if it's on the same network).
    # Be cautious with debug=True in production environments.
    app.run(host="0.0.0.0", port=5000, debug=True) # debug=True for development