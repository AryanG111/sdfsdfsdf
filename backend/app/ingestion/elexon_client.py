import logging
import time
from typing import Any, Dict, List, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)

class ElexonClient:
    """
    Client for retrieving UK electricity market actuals and forecasts
    from the Elexon BMRS Insights API.
    """

    def __init__(self, base_url: Optional[str] = None, timeout: float = 60.0, max_retries: int = 3):
        self.base_url = (base_url or settings.ELEXON_BASE_URL).rstrip("/")
        self.timeout = timeout
        self.max_retries = max_retries

    def _get_with_retry(self, endpoint: str, params: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        """
        Executes a GET request against the Elexon BMRS API with retry logic and error handling.
        """
        url = f"{self.base_url}{endpoint}"
        last_error = None

        for attempt in range(1, self.max_retries + 1):
            try:
                logger.info(f"Fetching from {url} with params={params} (attempt {attempt}/{self.max_retries})")
                with httpx.Client(timeout=self.timeout) as client:
                    response = client.get(url, params=params)

                if response.status_code == 200:
                    data = response.json()
                    if isinstance(data, list):
                        return data
                    elif isinstance(data, dict) and "data" in data:
                        return data["data"]
                    else:
                        raise ValueError(f"Unexpected response structure from {url}: {type(data)}")

                elif response.status_code == 429:
                    wait_time = attempt * 2
                    logger.warning(f"Rate limited (429) on {url}. Backing off for {wait_time}s...")
                    time.sleep(wait_time)
                else:
                    response.raise_for_status()

            except (httpx.RequestError, httpx.HTTPStatusError) as exc:
                last_error = exc
                logger.warning(f"Request failed (attempt {attempt}/{self.max_retries}): {exc}")
                if attempt < self.max_retries:
                    time.sleep(attempt * 1.5)

        raise RuntimeError(f"Failed to fetch data from {url} after {self.max_retries} attempts: {last_error}")

    def fetch_fuelhh_actuals(
        self,
        settlement_date_from: str,
        settlement_date_to: str,
        fuel_type: str = "WIND",
    ) -> List[Dict[str, Any]]:
        """
        Retrieves half-hourly generation outturn by fuel type (FUELHH stream).
        Dates must be in yyyy-MM-dd format.
        """
        params = {
            "settlementDateFrom": settlement_date_from,
            "settlementDateTo": settlement_date_to,
            "fuelType": fuel_type,
        }
        endpoint = "/datasets/FUELHH/stream"
        return self._get_with_retry(endpoint, params=params)

    def fetch_windfor_forecasts(
        self,
        publish_datetime_from: str,
        publish_datetime_to: str,
    ) -> List[Dict[str, Any]]:
        """
        Retrieves wind generation forecasts (WINDFOR stream).
        Dates must be ISO-8601 UTC date-times (e.g. 2025-12-25T00:00:00Z).
        """
        params = {
            "publishDateTimeFrom": publish_datetime_from,
            "publishDateTimeTo": publish_datetime_to,
        }
        endpoint = "/datasets/WINDFOR/stream"
        return self._get_with_retry(endpoint, params=params)
