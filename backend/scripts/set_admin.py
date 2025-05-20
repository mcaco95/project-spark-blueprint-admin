from core.db import db
from services.auth.models import User
from app import create_app

def set_user_as_admin(email: str):
    app = create_app()
    with app.app_context():
        user = User.query.filter_by(email=email).first()
        if not user:
            print(f"User with email {email} not found!")
            return
        
        user.role = 'admin'
        db.session.add(user)
        db.session.commit()
        print(f"Successfully set user {user.email} as admin!")

if __name__ == "__main__":
    set_user_as_admin("simon@logisticsonesouce.com") 