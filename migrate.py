import sqlite3
conn = sqlite3.connect("C:/Users/coola/intern/database.db")
cursor = conn.cursor()

def add_column(table, column, col_type):
    existing = [row[1] for row in cursor.execute(f"PRAGMA table_info({table})").fetchall()]
    if column not in existing:
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {column} {col_type}")
        print(f"Added {table}.{column}")

add_column("jobs", "apply_url", "TEXT")
add_column("jobs", "source", "TEXT")
add_column("jobs", "ai_tags", "TEXT")
add_column("jobs", "dedup_hash", "TEXT")
add_column("jobs", "employment_type", "TEXT")
add_column("users", "is_premium", "INTEGER NOT NULL DEFAULT 0")
add_column("users", "resume_text", "TEXT")
add_column("users", "skills", "TEXT")
add_column("users", "target_roles", "TEXT")
add_column("users", "preferred_locations", "TEXT")
add_column("users", "graduation_year", "INTEGER")
add_column("users", "stripe_customer_id", "TEXT")

for table, sql in [
    ("saved_jobs", """CREATE TABLE IF NOT EXISTS saved_jobs (
        id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
        job_id INTEGER NOT NULL REFERENCES jobs(id), created_at DATETIME NOT NULL,
        UNIQUE(user_id, job_id))"""),
    ("watchlists", """CREATE TABLE IF NOT EXISTS watchlists (
        id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
        company TEXT NOT NULL, created_at DATETIME NOT NULL)"""),
    ("search_gaps", """CREATE TABLE IF NOT EXISTS search_gaps (
        id INTEGER PRIMARY KEY, query TEXT NOT NULL,
        result_count INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME NOT NULL, filled INTEGER NOT NULL DEFAULT 0)"""),
    ("notifications", """CREATE TABLE IF NOT EXISTS notifications (
        id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id),
        title TEXT NOT NULL, message TEXT NOT NULL,
        read INTEGER NOT NULL DEFAULT 0, created_at DATETIME NOT NULL)"""),
]:
    exists = cursor.execute(f"SELECT name FROM sqlite_master WHERE type='table' AND name='{table}'").fetchone()
    if not exists:
        cursor.execute(sql)
        print(f"Created table {table}")

conn.commit()
conn.close()
print("Migration complete.")


