from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DB_HOST: str
    DB_NAME: str
    DB_PORT: int
    DB_USER: str
    DB_PASSWORD: str
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    JWT_TOKEN_EXPIRY: int = 7
    MS_CLIENT_ID: str
    MS_CLIENT_SECRET: str
    MS_TENANT_ID: str
    MS_REDIRECT_URI: str

    OTP_CLIENT_ID: str = ""
    OTP_CLIENT_SECRET: str = ""
    OTP_TENANT_ID: str = ""
    OTP_SENDER_EMAIL: str = ""

    FRONTEND_URL: str = "http://localhost:5173"

    GOOGLE_CLIENT_ID : str = ""
    GOOGLE_CLIENT_SECRET : str = ""
    GOOGLE_REDIRECT_URI : str = ""

    model_config = {
        "env_file": ".env",
        "extra": "ignore",
    }


settings = Settings()