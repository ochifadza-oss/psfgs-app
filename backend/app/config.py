from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "PSFGS - Public Sector Financial Governance Suite"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True

    # MySQL
    DB_HOST: str = "localhost"
    DB_PORT: int = 3306
    DB_USER: str = "root"
    DB_PASSWORD: str = "mysql#1"
    DB_NAME: str = "psfgs_bcmm"

    # JWT
    SECRET_KEY: str = "psfgs-bcmm-secret-key-change-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    @property
    def DATABASE_URL(self) -> str:
        return f"mysql+pymysql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_HOST}:{self.DB_PORT}/{self.DB_NAME}"

    class Config:
        env_file = ".env"


settings = Settings()
