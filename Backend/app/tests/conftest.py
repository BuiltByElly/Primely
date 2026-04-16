import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlmodel import Session, SQLModel

from app.core.database import get_session
from app.main import app


#  Create engine fixture that uses in-memory SQLite
@pytest.fixture(scope="session")
def engine():
    """Create test database"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
    )
    SQLModel.metadata.create_all(engine)
    return engine


# Create session fixture
@pytest.fixture
def session(engine):
    """Provide database session for tests"""
    connection = engine.connect()
    transaction = connection.begin()
    test_session = Session(bind=connection)
    yield test_session

    transaction.rollback()
    connection.close()


# Create client fixture
@pytest.fixture
def client(session):
    """Provide FastAPI test client"""
    app.dependency_overrides[get_session] = lambda: session
    with TestClient(app) as client:
        yield client
    app.dependency_overrides.clear()


# Test data for testing
@pytest.fixture
def test_user_credentials():
    return {"username": "elly", "password": "123456", "email": "e@g.com"}


@pytest.fixture
def test_user(session):
    from uuid import uuid4

    from app.core.security import hash_password
    from app.models.models import Users

    user = Users(
        public_id=uuid4(),
        username="elly",
        password=hash_password("123456"),
        email="e@g.com",
    )
    session.add(user)
    session.commit()
    return user
