import os
import sys
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from urllib.parse import urlparse
from backend.config import settings
from backend.models import Base, AdminUser
from backend.auth import get_password_hash

DATABASE_URL = settings.DATABASE_URL
engine = None
SessionLocal = None

def get_engine_and_initialize():
    global engine, SessionLocal
    
    # Try PostgreSQL first if configured
    is_postgres = DATABASE_URL.startswith("postgresql")
    
    if is_postgres:
        try:
            # Parse the DB URL to extract database name and default postgres url
            parsed = urlparse(DATABASE_URL)
            db_name = parsed.path.lstrip("/")
            
            # Reconstruct URL to connect to default database 'postgres' to check/create the target database
            # Format: postgresql://user:password@host:port/postgres
            netloc = parsed.netloc
            scheme = parsed.scheme
            default_db_url = f"{scheme}://{netloc}/postgres"
            
            # Check and create database
            temp_engine = create_engine(default_db_url, isolation_level="AUTOCOMMIT")
            with temp_engine.connect() as conn:
                # Check if target database exists
                result = conn.execute(
                    f"SELECT 1 FROM pg_database WHERE datname='{db_name}'"
                ).fetchone()
                if not result:
                    print(f"[Database] Target database '{db_name}' not found. Creating it...", flush=True)
                    conn.execute(f"CREATE DATABASE {db_name}")
            temp_engine.dispose()
            
            # Now create engine for actual target database
            print(f"[Database] Connecting to PostgreSQL at {parsed.hostname}:{parsed.port or 5432}...", flush=True)
            engine = create_engine(DATABASE_URL)
            # Test connection
            with engine.connect() as conn:
                pass
            
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
            print("[Database] PostgreSQL connection established successfully.", flush=True)
            
        except Exception as e:
            print(f"[Database Warning] PostgreSQL connection failed: {e}", file=sys.stderr, flush=True)
            print("[Database] Falling back to SQLite for local development...", flush=True)
            sqlite_url = "sqlite:///./automation_db.db"
            engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
            SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    else:
        # SQLite or other databases
        print(f"[Database] Connecting to database: {DATABASE_URL}", flush=True)
        connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
        engine = create_engine(DATABASE_URL, connect_args=connect_args)
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

    # Initialize tables
    Base.metadata.create_all(bind=engine)
    
    # Seed default admin user if not exists
    db = SessionLocal()
    try:
        admin_exists = db.query(AdminUser).filter(AdminUser.username == settings.DEFAULT_ADMIN_USERNAME).first()
        if not admin_exists:
            print(f"[Database] Seeding default admin user: {settings.DEFAULT_ADMIN_USERNAME}", flush=True)
            hashed_pw = get_password_hash(settings.DEFAULT_ADMIN_PASSWORD)
            new_admin = AdminUser(
                username=settings.DEFAULT_ADMIN_USERNAME,
                password_hash=hashed_pw
            )
            db.add(new_admin)
            db.commit()
    except Exception as e:
        print(f"[Database Error] Seeding admin failed: {e}", file=sys.stderr, flush=True)
        db.rollback()
    finally:
        db.close()

# Initialize on import so engine is configured
get_engine_and_initialize()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
