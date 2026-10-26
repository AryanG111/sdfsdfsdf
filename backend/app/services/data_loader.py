import logging
from pathlib import Path
from typing import Optional, Tuple
import pandas as pd
from app.config import settings

logger = logging.getLogger(__name__)

class DataLoader:
    """
    Singleton-style service for loading and caching normalized Parquet data.
    """
    def __init__(self, data_dir: Optional[Path] = None):
        self.data_dir = data_dir or settings.DATA_DIR
        self._df_actuals: Optional[pd.DataFrame] = None
        self._df_forecasts: Optional[pd.DataFrame] = None

    def is_data_available(self) -> bool:
        actuals_file = self.data_dir / "actuals.parquet"
        forecasts_file = self.data_dir / "forecasts.parquet"
        return actuals_file.exists() and forecasts_file.exists()

    def load_data(self, force_reload: bool = False) -> Tuple[pd.DataFrame, pd.DataFrame]:
        if not force_reload and self._df_actuals is not None and self._df_forecasts is not None:
            return self._df_actuals, self._df_forecasts

        actuals_file = self.data_dir / "actuals.parquet"
        forecasts_file = self.data_dir / "forecasts.parquet"

        if not actuals_file.exists() or not forecasts_file.exists():
            raise FileNotFoundError(
                f"Data files not found in {self.data_dir}. Expected 'actuals.parquet' and 'forecasts.parquet'."
            )

        logger.info(f"Loading data from {self.data_dir}...")
        df_act = pd.read_parquet(actuals_file)
        df_for = pd.read_parquet(forecasts_file)

        # Ensure UTC datetime types
        df_act["startTime"] = pd.to_datetime(df_act["startTime"], utc=True)
        df_act["publishTime"] = pd.to_datetime(df_act["publishTime"], utc=True)

        df_for["startTime"] = pd.to_datetime(df_for["startTime"], utc=True)
        df_for["publishTime"] = pd.to_datetime(df_for["publishTime"], utc=True)

        self._df_actuals = df_act
        self._df_forecasts = df_for

        logger.info(f"Successfully loaded {len(df_act)} actuals and {len(df_for)} forecasts.")
        return self._df_actuals, self._df_forecasts

    def get_actuals(self) -> pd.DataFrame:
        if self._df_actuals is None:
            self.load_data()
        return self._df_actuals

    def get_forecasts(self) -> pd.DataFrame:
        if self._df_forecasts is None:
            self.load_data()
        return self._df_forecasts

# Shared instance
data_loader = DataLoader()
