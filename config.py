from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DB_HOST : str
    DB_NAME : str
    DB_PORT : int
    DB_USER : str
    DB_PASSWORD : str
    SECRET_KEY : str
    ALGORITHM : str = "HS256"
    JWT_TOKEN_EXPIRY : int = 30


    model_config = {
        "env_file" : ".env",
    }

settings = Settings()