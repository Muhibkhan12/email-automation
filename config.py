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
    MS_CLIENT_ID : int
    MS_CLIENT_SECRET : str
    MS_TENANT_ID : int
    MS_REDIRECT_URI : str


    model_config = {
        "env_file" : ".env",
    }

settings = Settings()
