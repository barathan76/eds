import os
from sqlalchemy import create_engine, Column, String, Text, DateTime, Integer, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./test.db")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    is_company = Column(Boolean, default=False)
    company_name = Column(String, nullable=True)
    signature_image = Column(Text, nullable=True)  # Base64 encoded image
    created_at = Column(DateTime, default=datetime.utcnow)

class Signature(Base):
    __tablename__ = "signatures"

    sig_id = Column(String, primary_key=True, index=True)
    doc_hash = Column(String, nullable=False)
    signer_email = Column(String, nullable=False)
    signature = Column(Text, nullable=False)
    timestamp = Column(DateTime, nullable=False)
    summary = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

def init_db():
    Base.metadata.create_all(bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
