# WindLens — UK Wind Generation Forecast Analytics (January 2026)

> An end-to-end full-stack analytics platform built for UK electricity market participants to evaluate day-ahead national wind generation forecast accuracy, quantify decision risk, and audit Elexon BMRS publication histories.

---

## 1. Product Overview & Key Capabilities

Energy utilities and power traders must commit day-ahead power purchases before wholesale gate closure. Forecast uncertainty introduces imbalance exposure and balancing costs.

**WindLens** ingests raw half-hourly outturns and multi-version forecasts directly from the official **Elexon BMRS Insights Solution API**, strictly isolates forecasts available at a documented **24-hour decision cutoff**, and quantifies forecast error metrics without look-ahead bias or fabricated data.

### Key Features
* **Interactive Day-Ahead Analytics Dashboard:** Inspect 48 settlement periods for any day in January 2026 with overlaid actual outturns and selected day-ahead forecasts.
* **Forecast Error Profiles:** Granular error visualization ($F - A$) highlighting systematic overprediction (surplus risk) versus underprediction (deficit risk).
* **Monthly Accuracy Trends:** Daily breakdown of **MAE**, **RMSE**, and **Forecast Bias** across all 31 days in January 2026.
* **Forecast Publication History Inspector:** Full historical audit of all forecast revisions published for any delivery period, tagging versions as *Selected (Day-Ahead)*, *Superseded (Earlier Eligible)*, or *Published After Cutoff (Excluded)*.
* **Data Quality & Coverage Auditor:** Comprehensive transparency report auditing expected (1,488) vs observed outturns, hourly forecast resolution (744 periods), duplicate checks, and timestamp handling.

---

## 2. Business Problem & Intended Users

### The Problem
* UK wind generation is weather-dependent and volatile.
* Multiple forecast versions are published by national system operators leading up to delivery.
* Utilizing forecasts published *after* day-ahead procurement decisions creates **look-ahead bias**, masking true commercial imbalance risks.

### Target Users
* **Power Portfolio Managers:** Evaluating day-ahead wind hedge volumes.
* **Trading Analysts & Risk Teams:** Monitoring forecast error volatility (RMSE) and systematic over/underforecasting bias.
* **Market Compliance Officers:** Auditing data sources and gate closure timestamps against Elexon settlement records.

---

## 3. System Architecture

```text
                     Elexon BMRS Insights API
                      /                    \
     FUELHH Stream                         WINDFOR Stream
     (Actuals, 1,488 rows)                 (Forecasts, 18,104 versions)
                      \                    /
                 Python Ingestion & Validation
                 (scripts/ingest_january_2026.py)
                                 |
                 Normalized Local Storage (Parquet)
                     ├── data/actuals.parquet
                     └── data/forecasts.parquet
                                 |
                 Forecast Selection & Metric Engine
                 (backend/app/services/)
                 • Cutoff Rule: T - 24 hours
                 • Metrics: MAE, RMSE, Bias
                                 |
                 FastAPI High-Performance REST API
                 (backend/app/main.py)
                 • /health, /api/summary, /api/timeseries
                 • /api/accuracy, /api/forecast-history, /api/data-quality
                                 |
                 React + TypeScript + Vite Dashboard
                 (frontend/src/)
                 • Recharts Time-Series & Error Profiles
                 • Publication Auditor & Data Quality Panel
```

---

## 4. Source Data & API Endpoints

All data is sourced directly from the official public Elexon BMRS Insights API:
* **Base URL:** `https://data.elexon.co.uk/bmrs/api/v1`
* **Actual Wind Generation (`FUELHH`):**
  * `GET /datasets/FUELHH/stream?settlementDateFrom=2026-01-01&settlementDateTo=2026-01-31&fuelType=WIND`
  * Resolution: Half-hourly (48 settlement periods / day, 1,488 total periods in January 2026).
  * Filter: `fuelType == "WIND"`. Unit: MW.
* **Wind Generation Forecasts (`WINDFOR`):**
  * `GET /datasets/WINDFOR/stream?publishDateTimeFrom=2025-12-25T00:00:00Z&publishDateTimeTo=2026-02-02T00:00:00Z`
  * Resolution: Hourly (`startTime` on the hour `:00`).
  * Unit: MW.

---

## 5. Decision-Time Cutoff & Forecast Selection Rule

To eliminate look-ahead bias:
For any delivery period starting at timestamp $T$:
$$\text{Cutoff} = T - 24\text{ hours}$$
$$\text{Eligible Forecasts} = \{\text{versions with } \text{publishTime} \le \text{Cutoff}\}$$
$$\text{Selected Day-Ahead Forecast} = \arg\max_{\text{publishTime}} (\text{Eligible Forecasts})$$

### Pre-January Publication History Rule
Deliveries on January 1, 2026 at `00:00 UTC` require forecasts published on or before December 31, 2025 at `00:00 UTC`. The ingestion pipeline retrieves publication history starting December 25, 2025, ensuring 100% eligibility coverage for early January deliveries.

---

## 6. Accuracy Metric Formulations

Metrics are calculated strictly across valid matched forecast/actual pairs:
* **MAE (Mean Absolute Error):**
  $$\text{MAE} = \frac{1}{N} \sum_{i=1}^{N} |F_i - A_i|$$
* **RMSE (Root Mean Squared Error):**
  $$\text{RMSE} = \sqrt{\frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)^2}$$
* **Forecast Bias:**
  $$\text{Bias} = \frac{1}{N} \sum_{i=1}^{N} (F_i - A_i)$$

*Note on Bias Interpretation:* A positive bias ($>0$) indicates systematic overprediction (forecast surplus), while a negative bias ($<0$) indicates underprediction (forecast deficit).

---

## 7. Data Quality & Resolution Standards

1. **Resolution Difference:** Actuals have half-hourly resolution (1,488 periods); WINDFOR forecasts are published hourly (744 periods).
2. **No Data Fabrication:** Intermediate `:30` half-hour periods have no forecast published by Elexon and are preserved as `null`. They are never filled with zero or interpolated arbitrarily.
3. **Audit Results:**
   * Expected Delivery Periods: 1,488
   * Observed Actual Outturns: 1,488 (100.0% coverage)
   * Matched Hourly Forecasts: 744 (100.0% coverage of hourly targets)
   * Duplicates: 0
   * Timezone: UTC standard throughout the processing pipeline.

---

## 8. Known Assumptions & Scope Limitations

* **National Wind Scope Only:** Datasets reflect aggregate GB national wind generation. They do **not** contain regional customer demand, market prices, contracted utility positions, or conventional generation.
* **No Trading Recommendations:** The app does not compute net utility procurement requirements or output commercial trading advice.
* **24-Hour Proxy:** The 24-hour cutoff rule serves as a standard day-ahead proxy and can be replaced if a specific wholesale auction gate closure (e.g. 11:00 or 12:00 day-ahead) is designated.

---

## 9. Repository Structure

```text
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI app entrypoint & lifespan
│   │   ├── config.py                # Configuration & settings
│   │   ├── api/
│   │   │   └── routes.py            # REST endpoints
│   │   ├── ingestion/
│   │   │   └── elexon_client.py     # HTTP client for Elexon BMRS API
│   │   ├── services/
│   │   │   ├── data_loader.py       # Parquet dataset cache
│   │   │   ├── forecast_selection.py# Day-ahead selection & history
│   │   │   └── metrics.py           # MAE, RMSE, Bias algorithms
│   │   └── schemas/
│   │       └── responses.py         # Pydantic response models
│   ├── tests/
│   │   ├── test_forecast_selection.py # Selection & duplicate tests
│   │   ├── test_metrics.py          # Mathematical metric unit tests
│   │   └── test_api.py              # End-to-end API tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppHeader.tsx        # Navigation & branding
│   │   │   ├── FilterBar.tsx        # Date selector & view tabs
│   │   │   ├── MetricCard.tsx       # KPI summary cards
│   │   │   ├── GenerationChart.tsx  # Outturn vs Forecast Recharts view
│   │   │   ├── ErrorChart.tsx       # Error profiles against zero line
│   │   │   ├── ForecastHistoryTable.tsx # Version auditor table
│   │   │   ├── MonthlyAccuracyView.tsx  # 31-day daily accuracy trends
│   │   │   ├── DataQualityPanel.tsx # Coverage & methodology disclosures
│   │   │   └── MethodologyModal.tsx # Technical documentation modal
│   │   ├── pages/
│   │   │   └── Dashboard.tsx        # Main dashboard coordinator
│   │   ├── services/
│   │   │   └── api.ts               # Typed fetch API client
│   │   ├── types/
│   │   │   └── index.ts             # TypeScript interfaces
│   │   ├── App.tsx
│   │   ├── index.css                # Energy-trading design system
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   ├── nginx.conf
│   └── Dockerfile
├── data/
│   ├── actuals.parquet              # 1,488 normalized actual records
│   ├── forecasts.parquet            # 18,104 normalized forecast versions
│   └── README.md
├── scripts/
│   └── ingest_january_2026.py       # Ingestion & validation pipeline
├── .env.example
├── .gitignore
├── pytest.ini
├── docker-compose.yml
└── README.md
```

---

## 10. Local Setup & Running Instructions

### Prerequisites
* Python 3.11+
* Node.js 20+ and npm

### 1. Ingest Data (Already bundled in repository, or re-run anytime):
```bash
python scripts/ingest_january_2026.py
```

### 2. Run Backend
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Run unit and integration tests
python -m pytest

# Start FastAPI development server
uvicorn app.main:app --app-dir backend --host 0.0.0.0 --port 8000 --reload
```
* Backend API: `http://localhost:8000`
* Interactive OpenAPI / Swagger Docs: `http://localhost:8000/docs`

### 3. Run Frontend
```bash
cd frontend
npm install
npm run dev
```
* Dashboard will be live at: `http://localhost:5173`

---

## 11. Running with Docker Compose

To build and run the entire full-stack application with a single command:
```bash
docker compose up --build
```
* Frontend Dashboard: `http://localhost:3000`
* Backend API: `http://localhost:8000`
* API Documentation: `http://localhost:8000/docs`

---

## 12. Deployment Instructions

### Production VPS Multi-App Deployment (Live on AWS EC2)
The application is deployed live on an Ubuntu VPS with a central application gateway:
* **Central Gateway / Portal (Root Domain):** [https://13.51.157.228.sslip.io/](https://13.51.157.228.sslip.io/) (with auto-redirect & service links)
* **WindLens Analytics Application:** [https://13.51.157.228.sslip.io/windlense](https://13.51.157.228.sslip.io/windlense) (alias: `/windlens`)
* **Noted AI Workspace:** [https://13.51.157.228.sslip.io/noted](https://13.51.157.228.sslip.io/noted)
* **Direct IP Fallback:** [http://13.51.157.228](http://13.51.157.228)
* **Live Swagger Interactive Docs:** [https://13.51.157.228.sslip.io/windlense/docs](https://13.51.157.228.sslip.io/windlense/docs)
* **API Health Check:** [https://13.51.157.228.sslip.io/health](https://13.51.157.228.sslip.io/health)

#### VPS Architecture:
* **Reverse Proxy & SSL:** Nginx with Let's Encrypt TLS termination, HTTP-to-HTTPS redirect, and gzip compression.
* **Process Manager:** PM2 managing `windlens-backend` (port 8000) and `noted-backend` (port 8001) in dedicated virtual environments.
* **Frontend Routing:** Root `/` serves the application gateway portal. Subpaths `/windlense/` and `/noted/` serve respective SPAs with client-side routing and immutable asset caching.

### Alternative Cloud Deployments (Vercel & Render)
* **Frontend (Vercel):** Root directory `frontend`, Framework preset `Vite`, `VITE_API_BASE_URL` pointing to backend.
* **Backend (Render / Railway):** Root directory `backend`, start command `uvicorn app.main:app --host 0.0.0.0 --port $PORT`.

---

## 13. Deliverables & Demonstration

* **Live Gateway Hub:** [https://13.51.157.228.sslip.io/](https://13.51.157.228.sslip.io/)
* **Live WindLens Application:** [https://13.51.157.228.sslip.io/windlense](https://13.51.157.228.sslip.io/windlense)
* **Live Noted Workspace:** [https://13.51.157.228.sslip.io/noted](https://13.51.157.228.sslip.io/noted)
* **Live API & Swagger Documentation:** [https://13.51.157.228.sslip.io/windlense/docs](https://13.51.157.228.sslip.io/windlense/docs)
* **Live Health Check:** [https://13.51.157.228.sslip.io/health](https://13.51.157.228.sslip.io/health)

---

## 14. Tooling & AI Assistance Disclosure

In accordance with transparent academic and professional standards:
* **Primary Coding Assistant:** Built using **Antigravity** as the primary coding and pair-programming tool to streamline project scaffolding, API integration, interactive dashboard development, and cloud deployment.
* **Tooling Adaptability:** Also fully comfortable and experienced working with other modern AI-assisted development tools including **Claude Code**, **Cursor**, **Codex / GitHub Copilot**, and agentic terminal workflows.
* **Engineering Verification:** All data pipelines, forecast selection algorithms ($T - 24\text{h}$ day-ahead rule), evaluation metrics (MAE, MSE, RMSE, bias), and system architectures were verified against the live Elexon BMRS API and rigorously validated through an automated 31-test test suite.
