import os
from pathlib import Path
from typing import List

class Settings:
    PROJECT_NAME: str = "WindLens - Wind Forecast Analytics"
    API_V1_PREFIX: str = "/api"
    
    # Path resolution: find data directory relative to project root or docker container
    BASE_DIR: Path = Path(__file__).resolve().parent.parent.parent
    DATA_DIR: Path = Path(os.getenv("DATA_DIR", str(BASE_DIR / "data")))
    
    # CORS
    CORS_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000").split(",")
        if origin.strip()
    ]
    
    # Elexon BMRS API
    ELEXON_BASE_URL: str = os.getenv("ELEXON_BASE_URL", "https://data.elexon.co.uk/bmrs/api/v1")
    
    # Methodology & Evaluation Scope
    TARGET_MONTH: str = "2026-01"
    EVALUATION_START: str = "2026-01-01T00:00:00Z"
    EVALUATION_END: str = "2026-02-01T00:00:00Z"
    DECISION_CUTOFF_HOURS: int = 24
    
    # Expected half-hour periods in January (31 days * 48 periods)
    EXPECTED_PERIODS_JANUARY: int = 1488

settings = Settings()
