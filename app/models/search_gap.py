from datetime import datetime, timezone
from sqlalchemy import Column, DateTime, Integer, String
from app.database import Base

class SearchGap(Base):
    __tablename__ = "search_gaps"

    id = Column(Integer, primary_key=True, index=True)
    query = Column(String, nullable=False, index=True)
    result_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    filled = Column(Integer, nullable=False, default=0)
