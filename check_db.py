import sys
sys.path.append(".")
from app.database import SessionLocal
from app.models.job import Job

db = SessionLocal()
total = db.query(Job).count()
by_source = db.query(Job.source, db.query(Job).filter(Job.source == Job.source).count()).all()

from sqlalchemy import func
rows = db.query(Job.source, func.count(Job.id)).group_by(Job.source).all()
for source, count in rows:
    print((source or "recruiter") + ": " + str(count))
print("Total: " + str(total))
db.close()
