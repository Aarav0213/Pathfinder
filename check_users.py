import sys
sys.path.append(".")
from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
users = db.query(User).all()
for u in users:
    print(f"ID: {u.id} | Email: {u.email} | Skills: {u.skills} | Target: {u.target_roles} | Locations: {u.preferred_locations}")
db.close()
