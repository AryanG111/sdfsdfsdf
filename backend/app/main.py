import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.services.data_loader import data_loader
from app.api.routes import router as api_router, get_merged_data
from app.schemas.responses import HealthResponse

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing WindLens Backend...")
    try:
        if data_loader.is_data_available():
            logger.info("Preloading normalized Parquet datasets...")
            get_merged_data()
            logger.info("Analytical dataset ready.")
        else:
            logger.warning("Parquet data not yet available. Run scripts/ingest_january_2026.py first.")
    except Exception as e:
        logger.error(f"Error during data initialization: {e}")
    yield
    logger.info("WindLens Backend shutting down...")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Elexon BMRS Wind Generation Forecast & Actuals Analytics API (January 2026)",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if "*" in settings.CORS_ORIGINS else settings.CORS_ORIGINS + ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health endpoint
@app.get("/health", response_model=HealthResponse, tags=["System"])
def health_check():
    is_avail = data_loader.is_data_available()
    act_count = 0
    fc_count = 0
    if is_avail:
        try:
            df_act = data_loader.get_actuals()
            df_fc = data_loader.get_forecasts()
            act_count = len(df_act)
            fc_count = len(df_fc)
        except Exception:
            pass

    return HealthResponse(
        status="ok",
        version="1.0.0",
        dataAvailable=is_avail,
        actualsCount=act_count,
        forecastsCount=fc_count,
    )

# Include API endpoints under /api
app.include_router(api_router, prefix=settings.API_V1_PREFIX, tags=["Analytics"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
