from sqlmodel import Session, SQLModel, create_engine

from app.core.config import settings

# Creating engine
engine = create_engine(settings.DATABASE_URL, echo=True)


# intializing database and session dependency
def init_db():
    SQLModel.metadata.create_all(engine)


def get_session():
    with Session(engine) as session:
        yield session
