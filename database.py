from sqlalchemy import create_engine
from sqlalchemy.orm import  sessionmaker, declarative_base

from config import settings

print("DB_HOST =", settings.DB_HOST)
print("DB_PORT =", settings.DB_PORT)
print("DB_NAME =", settings.DB_NAME)
print("DB_USER =", settings.DB_USER)
print("DB_PASSWORD =", repr(settings.DB_PASSWORD))

DATABASE_URL = (f"mysql+pymysql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
print(DATABASE_URL)

engine = create_engine(
    DATABASE_URL,
    echo=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


Base = declarative_base()