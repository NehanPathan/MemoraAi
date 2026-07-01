import logging
from sqlmodel import SQLModel, create_engine, Session
from config import DATABASE_URL, IS_DEVELOPMENT

logger = logging.getLogger(__name__)

# Configure database engine with appropriate pooling
if DATABASE_URL.startswith("sqlite"):
    # SQLite: disable pooling and use check_same_thread=False for development
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        connect_args={"check_same_thread": False},
        poolclass=None,  # No pooling for SQLite
    )
else:
    # PostgreSQL/MySQL: use connection pooling
    engine = create_engine(
        DATABASE_URL,
        echo=False,
        pool_size=10,
        max_overflow=20,
        pool_pre_ping=True,  # Test connections before using
        pool_recycle=3600,  # Recycle connections after 1 hour
    )

logger.info(f"Database engine configured for: {DATABASE_URL.split('@')[-1] if '@' in DATABASE_URL else DATABASE_URL.split('://')[0]}")


def create_tables():
    """Create all database tables."""
    try:
        SQLModel.metadata.create_all(engine)
        logger.info("Database tables created/verified successfully")
    except Exception as exc:
        logger.exception("Failed to create database tables")
        raise


def get_session():
    """Get database session for dependency injection."""
    with Session(engine) as session:
        yield session

