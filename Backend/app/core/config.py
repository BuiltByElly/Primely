from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str
    DUMMY_PASSWORD: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    REFRESH_TOKEN_EXPIRE_DAYS: int
    ENV: str

    @property
    def is_prod(self):
        """
        Check if the environment is in production
        """
        return self.ENV == "production"

    class Config:
        env_file = ".env"


settings = Settings()
