import sys
sys.path.append(".")
from app.database import SessionLocal
from app.models.user import User

db = SessionLocal()
user = db.query(User).filter(User.email == "coolaarav1008@gmail.com").first()
if user:
    user.role = "admin"
    user.is_premium = 1
    db.commit()
    print("Done. Role: " + user.role + " Premium: " + str(user.is_premium))
db.close()
