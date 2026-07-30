import sys
sys.path.append(".")
from app.database import SessionLocal
from app.models.job import Job
from datetime import datetime, timezone

db = SessionLocal()

sample_jobs = [
    {"title": "Frontend Engineer Intern", "company": "Google", "location": "Mountain View, CA", "description": "Join the Chrome team to build fast, accessible web experiences used by billions. You will work closely with senior engineers on React-based tooling, performance profiling, and cross-browser compatibility.\n\nResponsibilities:\n- Build and maintain UI components in React and TypeScript\n- Write unit and integration tests\n- Participate in code reviews and design discussions\n\nRequirements:\n- Currently pursuing a BS/MS in Computer Science\n- Proficiency in JavaScript, HTML, CSS\n- Familiarity with React or similar frameworks"},
    {"title": "Backend Engineer Intern", "company": "Amazon", "location": "Seattle, WA", "description": "Work on AWS infrastructure powering millions of cloud workloads. You will design and implement scalable microservices in Java and Python, contributing to services that process billions of requests per day.\n\nResponsibilities:\n- Design RESTful APIs and internal services\n- Write scalable, fault-tolerant backend code\n- Collaborate with product and infrastructure teams\n\nRequirements:\n- Experience with Python or Java\n- Understanding of distributed systems\n- Strong problem-solving skills"},
    {"title": "Full Stack Developer Intern", "company": "Stripe", "location": "Remote", "description": "Help build the financial infrastructure of the internet. You will contribute to Stripe's dashboard and developer tooling, working across React frontends and Node.js backends.\n\nResponsibilities:\n- Build new product features end to end\n- Improve developer-facing APIs and documentation\n- Collaborate with design and data teams\n\nRequirements:\n- Experience with React and Node.js\n- Comfort working in a fast-paced environment\n- Strong written communication skills"},
    {"title": "Machine Learning Intern", "company": "OpenAI", "location": "San Francisco, CA", "description": "Research and implement cutting-edge ML models for language and reasoning tasks. You will run experiments, analyze results, and contribute to published research.\n\nResponsibilities:\n- Train and evaluate large language models\n- Implement novel training techniques\n- Write research reports and documentation\n\nRequirements:\n- Strong background in deep learning\n- Proficiency in Python and PyTorch\n- Research experience preferred"},
    {"title": "iOS Engineer Intern", "company": "Apple", "location": "Cupertino, CA", "description": "Build features for apps used by hundreds of millions of iPhone users worldwide. You will work on performance, animations, and new platform capabilities in Swift.\n\nResponsibilities:\n- Develop and ship features in Swift\n- Optimize app performance and memory usage\n- Work closely with design to implement pixel-perfect UIs\n\nRequirements:\n- Experience with Swift and UIKit or SwiftUI\n- Passion for great user experience\n- Currently enrolled in a CS or related degree"},
    {"title": "Data Engineering Intern", "company": "Meta", "location": "Menlo Park, CA", "description": "Build data pipelines that process petabytes of information powering AI products and ads infrastructure. You will use Spark, Hive, and internal Meta tooling.\n\nResponsibilities:\n- Design and maintain ETL pipelines\n- Monitor data quality and reliability\n- Partner with ML and analytics teams\n\nRequirements:\n- Experience with SQL and Python\n- Familiarity with distributed data processing\n- Strong analytical mindset"},
    {"title": "Cybersecurity Intern", "company": "CrowdStrike", "location": "Austin, TX", "description": "Defend organizations from advanced threats by building detection and response tooling. You will analyze malware, write detection rules, and contribute to the Falcon platform.\n\nResponsibilities:\n- Analyze threat intelligence and malware samples\n- Write YARA and behavioral detection rules\n- Build internal security tooling in Python\n\nRequirements:\n- Interest in offensive and defensive security\n- Experience with Python or C++\n- Familiarity with Linux internals"},
    {"title": "Product Design Intern", "company": "Figma", "location": "New York, NY", "description": "Design intuitive interfaces for collaborative design tools used by millions of designers worldwide. You will own end-to-end design for new features.\n\nResponsibilities:\n- Create wireframes, prototypes, and high-fidelity designs\n- Conduct user research and usability testing\n- Partner with engineering on implementation\n\nRequirements:\n- Strong portfolio demonstrating UX and visual design skills\n- Proficiency in Figma\n- Excellent communication and collaboration skills"},
]

for s in sample_jobs:
    existing = db.query(Job).filter(Job.title == s["title"], Job.company == s["company"]).first()
    if not existing:
        db.add(Job(
            title=s["title"],
            company=s["company"],
            location=s["location"],
            description=s["description"],
            user_id=None,
            posted_at=datetime.now(timezone.utc),
        ))

db.commit()
db.close()
print("Seeded successfully.")
