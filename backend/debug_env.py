import sys
import os
from services.db_service import init_db, SessionLocal, Signature, engine
from sqlalchemy import text

print(f"Python executable: {sys.executable}")
print(f"CWD: {os.getcwd()}")

try:
    import numpy
    print("numpy imported successfully")
except ImportError as e:
    print(f"numpy import failed: {e}")

try:
    import sumy
    print("sumy imported successfully")
except ImportError as e:
    print(f"sumy import failed: {e}")

try:
    import nltk
    print("nltk imported successfully")
    try:
        nltk.data.find('tokenizers/punkt')
        print("punkt found")
    except LookupError:
        print("punkt NOT found")
except ImportError as e:
    print(f"nltk import failed: {e}")

print("Initializing DB...")
init_db()
print("DB Initialized.")

db = SessionLocal()
try:
    # Check columns
    result = db.execute(text("PRAGMA table_info(signatures)"))
    columns = [row[1] for row in result]
    print(f"Columns in signatures table: {columns}")
    if 'summary' in columns:
        print("SUCCESS: summary column exists.")
    else:
        print("FAILURE: summary column MISSING.")
except Exception as e:
    print(f"DB Check failed: {e}")
finally:
    db.close()
