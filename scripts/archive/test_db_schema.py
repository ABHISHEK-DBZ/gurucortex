import sys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))

import sqlite3
from app.services.database import SCHEMA_SQL

conn = sqlite3.connect("data/conversations.db")
conn.executescript(SCHEMA_SQL)
cur = conn.cursor()
cur.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = sorted([r[0] for r in cur.fetchall()])
print("Tables in database:", len(tables))
for t in tables:
    print(" -", t)
conn.close()
