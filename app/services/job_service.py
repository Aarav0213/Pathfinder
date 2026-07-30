from datetime import datetime, timedelta, timezone
from app.models.job import Job
from app.models.search_gap import SearchGap
from app.schemas import JobCreate, JobUpdate

def fuzzy_terms(text):
    if not text:
        return []
    terms = text.lower().split()
    expanded = set(terms)
    synonyms = {
        "frontend": ["front-end", "front end", "ui", "react", "vue", "angular"],
        "backend": ["back-end", "back end", "server", "api", "django", "fastapi", "node"],
        "fullstack": ["full-stack", "full stack", "frontend", "backend"],
        "ml": ["machine learning", "deep learning", "ai", "artificial intelligence"],
        "data": ["analytics", "analysis", "scientist", "engineer"],
        "intern": ["internship", "co-op", "coop", "entry level", "entry-level", "junior"],
        "swe": ["software engineer", "software developer", "sde"],
        "dev": ["developer", "engineer"],
    }
    for term in terms:
        if term in synonyms:
            expanded.update(synonyms[term])
    return list(expanded)

def log_search_gap(db, query: str, result_count: int, page_size: int):
    if not query:
        return
    if result_count < page_size:
        existing = db.query(SearchGap).filter(
            SearchGap.query == query,
            SearchGap.filled == 0
        ).first()
        if not existing:
            db.add(SearchGap(query=query, result_count=result_count))
            db.commit()

class JobService:
    def get_jobs(self, db, limit=50, offset=0, keyword=None, company=None, location=None, sort="newest", date_range=None, remote_only=False, employment_type=None, current_user=None):
        from sqlalchemy import or_
        query = db.query(Job)

        if keyword:
            terms = fuzzy_terms(keyword)
            conditions = []
            for term in terms:
                conditions.append(Job.title.ilike(f"%{term}%"))
                conditions.append(Job.description.ilike(f"%{term}%"))
                conditions.append(Job.company.ilike(f"%{term}%"))
                if Job.ai_tags is not None:
                    conditions.append(Job.ai_tags.ilike(f"%{term}%"))
            query = query.filter(or_(*conditions))

        if company:
            terms = fuzzy_terms(company)
            conditions = [Job.company.ilike(f"%{t}%") for t in terms]
            query = query.filter(or_(*conditions))

        if location:
            terms = fuzzy_terms(location)
            conditions = [Job.location.ilike(f"%{t}%") for t in terms]
            query = query.filter(or_(*conditions))

        if employment_type:
            query = query.filter(Job.employment_type.ilike("%" + employment_type + "%"))

        if remote_only:
            query = query.filter(Job.location.ilike("%remote%"))

        if date_range:
            now = datetime.now(timezone.utc)
            cutoffs = {"today": timedelta(days=1), "week": timedelta(weeks=1), "month": timedelta(days=30)}
            cutoff = now - cutoffs[date_range] if date_range in cutoffs else None
            if cutoff:
                query = query.filter(Job.posted_at >= cutoff)

        if sort == "newest":
            query = query.order_by(Job.posted_at.desc())
        elif sort == "oldest":
            query = query.order_by(Job.posted_at.asc())

        results = query.offset(offset).limit(limit).all()

        search_query = " ".join(filter(None, [keyword, company, location]))
        if search_query:
            log_search_gap(db, search_query, len(results), limit)

        return results

    def get_jobs_by_user(self, db, user_id, limit=50, offset=0):
        return db.query(Job).filter(Job.user_id == user_id).order_by(Job.created_at.desc()).offset(offset).limit(limit).all()

    def get_job(self, db, job_id):
        return db.query(Job).filter(Job.id == job_id).first()

    def create_job(self, db, job_data: JobCreate, current_user):
        job = Job(
            title=job_data.title,
            company=job_data.company,
            location=job_data.location,
            description=job_data.description,
            user_id=current_user.id,
        )
        db.add(job)
        db.commit()
        db.refresh(job)
        return job

    def update_job(self, db, job, job_data: JobUpdate):
        job.title = job_data.title
        job.company = job_data.company
        job.location = job_data.location
        job.description = job_data.description
        db.commit()
        db.refresh(job)
        return job

    def delete_job(self, db, job):
        db.delete(job)
        db.commit()
        return job




