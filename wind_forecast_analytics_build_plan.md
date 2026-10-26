# Wind Forecast Analytics --- Step-by-Step Build Plan

> **Goal:** Build and deploy a small full-stack web application for a UK
> energy utility. It must show Elexon national wind-generation actuals
> and forecasts for January 2026, select forecasts that were available
> at a defined day-ahead decision cutoff, and quantify forecast error.
>
> **Time budget:** Maximum 16 hours. Prioritize correct data and
> analysis over visual polish.
>
> **Working product name:** WindLens (rename if desired).
>
> **Important scope limit:** The supplied datasets contain national wind
> generation actuals and forecasts only. They do **not** contain
> consumer demand, market prices, contracted positions, or other
> generation. The app must not claim to calculate the utility's total
> procurement requirement or make trading recommendations.

------------------------------------------------------------------------

## 0. Define the finished product

The user should be able to:

1.  View national wind generation forecasts and actuals for January
    2026.
2.  Choose a delivery date and inspect its 48 half-hour periods.
3.  See forecast error metrics: MAE, RMSE, and forecast bias.
4.  Understand which forecast publication was selected and why.
5.  Inspect data coverage, missing values, and methodology.
6.  Use the deployed application without installing anything.

### Definition of done

-   [ ] Data is retrieved from the two specified Elexon datasets.
-   [ ] Forecasts are selected using a documented decision-time cutoff.
-   [ ] Actuals and forecasts are matched on delivery time.
-   [ ] Metrics have unit tests and are computed in the backend.
-   [ ] React dashboard works on desktop and mobile.
-   [ ] Frontend and backend run with Docker Compose.
-   [ ] Backend and frontend are deployed and publicly accessible.
-   [ ] Public GitHub repository includes a complete README.
-   [ ] Unlisted demo video is no longer than 10 minutes.
-   [ ] All submission links work in an incognito/private browser.

------------------------------------------------------------------------

# 1. Understand the source data

Use only these sources:

-   **Actual wind generation (FUELHH):**
    https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/FUELHH/stream
-   **Wind generation forecasts (WINDFOR):**
    https://bmrs.elexon.co.uk/api-documentation/endpoint/datasets/WINDFOR/stream

Read the endpoint documentation before coding. Confirm the current
response shape, query parameters, pagination/streaming behavior, time
format, and any API limits. Do not assume the response is one JSON array
or that one request returns the whole month.

## 1.1 Actuals

Keep records where `fuelType == "WIND"`.

Relevant fields:

-   `startTime`: delivery period start time; 30-minute resolution.
-   `generation`: actual wind generation.

## 1.2 Forecasts

Relevant fields:

-   `startTime`: delivery period the forecast applies to.
-   `publishTime`: time the forecast was published.
-   `generation`: forecast wind generation.

A delivery period can have multiple forecast versions, published at
different times. Preserve `publishTime`; do not discard it during
ingestion.

## 1.3 Date range

The target delivery range is January 2026:

-   Inclusive start: `2026-01-01T00:00:00Z`
-   Exclusive end: `2026-02-01T00:00:00Z`

January has 31 days × 48 half-hour periods = **1,488 expected delivery
periods**. This is an expectation for coverage checking, not a reason to
fabricate missing rows. Confirm the timestamp convention in the API
documentation and record actual coverage.

### Critical date-boundary rule

A forecast for a January delivery period may have been published in
December 2025. Do not filter forecast records only by `publishTime` in
January. Retrieve enough publication history to include forecasts
eligible at the chosen cutoff for January deliveries.

------------------------------------------------------------------------

# 2. Choose and document the decision-time rule

The brief says purchasing decisions are made one day before delivery but
does not specify the exact gate-closure time. For the first version, use
a clear **24-hour-ahead rule** and disclose it in the UI and README.

For a delivery period starting at time `T`:

``` text
cutoff = T - 24 hours
eligible forecasts = forecasts with publishTime <= cutoff
selected forecast = eligible forecast with the latest publishTime
```

Use timestamps consistently, preferably in UTC for processing. Display
times in `Europe/London` in the UI if helpful, with an explicit timezone
label.

This is an assumption for the pilot, not a claim that it reproduces the
client's exact market process. If the client later supplies an official
decision timestamp or gate-closure rule, replace the assumption.

### Avoid look-ahead bias

Never select a forecast published after the decision cutoff when
measuring decision-time accuracy. A later forecast may be useful for a
separate "closer to delivery" analysis, but it must not be mixed into
the day-ahead score.

### Duplicate policy

If multiple records have the same delivery time and publication time,
apply a documented deterministic rule after checking the source schema.
Count and report duplicates; do not silently hide data-quality problems.

------------------------------------------------------------------------

# 3. Architecture

Use a small, understandable architecture. No microservices, LLM, vector
database, or message broker is needed.

``` text
                 Elexon BMRS API
                  /           \
             FUELHH           WINDFOR
             actuals          forecasts
                  \           /
               Python ingestion script
                         |
             Validation and normalization
                         |
             Local processed data (Parquet)
                         |
             Forecast selection + analytics
                         |
                    FastAPI REST API
                         |
                 React + TypeScript UI
                         |
                Charts, KPIs, tables, filters
```

## Technology choices

-   **Frontend:** React, TypeScript, Vite.
-   **Styling:** Tailwind CSS or simple CSS modules. Choose one; do not
    spend time changing styling frameworks.
-   **Charts:** Recharts.
-   **Backend:** Python + FastAPI.
-   **Data processing:** Pandas.
-   **Processed prototype data:** Parquet files stored with the project
    or generated by the ingestion script.
-   **Tests:** Pytest for backend logic; add a small number of frontend
    tests if time permits.
-   **Containers:** Docker and Docker Compose.
-   **Deployment:** Vercel for frontend; Render or another
    Python-compatible host for backend.

For this small historical dataset, local Parquet files are enough.
PostgreSQL is optional and should only be introduced if there is a clear
requirement for persistent incremental ingestion or multi-user updates.

------------------------------------------------------------------------

# 4. Repository structure

Create an anonymous public repository name, for example a random string
such as `kjhwr`.

``` text
kjhwr/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AppHeader.tsx
│   │   │   ├── FilterBar.tsx
│   │   │   ├── MetricCard.tsx
│   │   │   ├── GenerationChart.tsx
│   │   │   ├── ErrorChart.tsx
│   │   │   ├── ForecastHistoryTable.tsx
│   │   │   └── DataQualityPanel.tsx
│   │   ├── pages/
│   │   │   └── Dashboard.tsx
│   │   ├── services/
│   │   │   └── api.ts
│   │   ├── types/
│   │   │   └── index.ts
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── package.json
│   ├── vite.config.ts
│   └── Dockerfile
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── config.py
│   │   ├── api/
│   │   │   └── routes.py
│   │   ├── ingestion/
│   │   │   └── elexon_client.py
│   │   ├── services/
│   │   │   ├── data_loader.py
│   │   │   ├── forecast_selection.py
│   │   │   └── metrics.py
│   │   └── schemas/
│   │       └── responses.py
│   ├── tests/
│   │   ├── test_forecast_selection.py
│   │   ├── test_metrics.py
│   │   └── test_api.py
│   ├── requirements.txt
│   └── Dockerfile
├── data/
│   └── README.md
├── scripts/
│   └── ingest_january_2026.py
├── .env.example
├── .gitignore
├── docker-compose.yml
└── README.md
```

Adjust names as implementation evolves, but keep ingestion, analytics,
API, and UI responsibilities separate.

------------------------------------------------------------------------

# 5. Backend: build the data pipeline first

Do not begin with the dashboard. First prove that the source data can be
retrieved and analyzed.

## Step 5.1 --- Create the Python environment

Install Python dependencies in a virtual environment. Suggested
packages:

-   `fastapi`
-   `uvicorn[standard]`
-   `pandas`
-   `pyarrow`
-   `httpx` or `requests`
-   `pytest`

Pin versions in `requirements.txt` once the application works.

## Step 5.2 --- Implement the Elexon client

In `backend/app/ingestion/elexon_client.py`:

1.  Define the two documented endpoint URLs.
2.  Implement requests according to the official API documentation.
3.  Add explicit date/query parameters where supported.
4.  Handle pagination or streamed responses as documented.
5.  Add request timeouts and a small retry policy for transient
    failures.
6.  Check HTTP status codes and return useful error messages.
7.  Keep the raw source fields needed for auditing.
8.  Do not hardcode API credentials; use environment variables only if
    the API requires them.

Avoid making a huge number of unbounded requests. Log the date range,
records retrieved, and failures.

## Step 5.3 --- Implement ingestion and normalization

In `scripts/ingest_january_2026.py`:

1.  Retrieve actuals for January delivery timestamps.
2.  Filter actuals to `fuelType == "WIND"`.
3.  Retrieve forecasts for January delivery timestamps, including
    publication history before January where needed.
4.  Parse `startTime` and `publishTime` as timezone-aware timestamps.
5.  Convert generation values to numeric types.
6.  Reject or flag malformed timestamps and nonnumeric values.
7.  Check for duplicates and missing values.
8.  Save the normalized data to `data/`.
9.  Print a short ingestion report.

Recommended processed files:

``` text
data/actuals.parquet
data/forecasts.parquet
```

If raw source files are small enough and useful for reproducibility, you
may retain them separately. Do not commit secrets or unnecessarily large
dumps.

## Step 5.4 --- Validate coverage

For actuals, report:

-   Total records retrieved.
-   Number of January delivery periods.
-   Unique delivery timestamps.
-   Missing or invalid generation values.
-   Duplicate timestamps.
-   Earliest and latest delivery timestamp.

For forecasts, report:

-   Total forecast versions.
-   Unique delivery timestamps.
-   Unique publication timestamps.
-   Duplicate `(startTime, publishTime)` pairs.
-   Publication-history range.
-   Missing or invalid generation values.

Do not assume the API has complete coverage. Display the observed values
and investigate unexpected gaps.

## Step 5.5 --- Implement as-of forecast selection

In `backend/app/services/forecast_selection.py`:

For each January delivery period:

1.  Calculate `cutoff = startTime - 24 hours`.
2.  Find forecast records for that `startTime` with
    `publishTime <= cutoff`.
3.  Select the record with the latest eligible `publishTime`.
4.  If no eligible forecast exists, mark the forecast as missing. Do not
    substitute a later forecast.
5.  Keep the selected `publishTime` and calculated cutoff in the result.
6.  Apply the documented duplicate policy deterministically.

Then join the selected forecasts to actuals on the exact delivery
timestamp (`startTime`).

The resulting analytical table should contain at least:

``` text
startTime
actual_generation
forecast_generation
publishTime
decision_cutoff
error_mw
absolute_error_mw
squared_error_mw
```

Use clear column names and document the generation unit returned by the
source. Do not label values as MW until the API schema confirms the
unit.

## Step 5.6 --- Implement accuracy metrics

In `backend/app/services/metrics.py`, calculate metrics only for valid
matched forecast/actual pairs.

Let `F` be forecast generation, `A` actual generation, and `N` the
number of valid pairs.

**Mean Absolute Error (MAE):**

``` text
MAE = mean(abs(F - A))
```

**Root Mean Squared Error (RMSE):**

``` text
RMSE = sqrt(mean((F - A) ** 2))
```

**Forecast bias:**

``` text
bias = mean(F - A)
```

Positive bias means forecasts tend to overestimate actual generation;
negative bias means they tend to underestimate it.

Optional: **MAPE** may be included only with careful handling of zero or
near-zero actual values. Report the number of observations excluded from
its denominator. Do not use MAPE as the only metric.

Also calculate daily metrics if time permits. Return the valid sample
count with every metric.

### Metric rules

-   Do not treat missing values as zero.
-   Do not compare records with different delivery timestamps.
-   Use the same valid observation set for the metrics shown together,
    unless clearly documented otherwise.
-   Return `null` or an explicit unavailable state when there are no
    valid pairs.
-   Keep full precision in calculations and round only for display.

## Step 5.7 --- Add backend tests

At minimum, test:

-   The most recent eligible forecast is selected.
-   A forecast published after the cutoff is rejected.
-   A delivery period with no eligible forecast remains missing.
-   Forecasts and actuals are joined by delivery timestamp.
-   MAE, RMSE, and bias match hand-calculated examples.
-   Missing values are excluded rather than treated as zero.
-   Duplicate handling is deterministic.
-   January boundaries include January 1 and exclude February 1.

Use small synthetic datasets in tests. Tests must not depend on the live
Elexon API.

------------------------------------------------------------------------

# 6. Backend: expose a small REST API

Create the FastAPI application in `backend/app/main.py` and routes in
`backend/app/api/routes.py`.

The backend should load the prepared dataset, apply filters, and return
JSON. The frontend should not duplicate the official metric
calculations.

## Required endpoints

### `GET /health`

Returns application health and whether processed data is available.

### `GET /api/summary?month=2026-01`

Return:

-   Date range.
-   MAE, RMSE, and bias.
-   Number of valid matched periods.
-   Expected and observed delivery-period coverage.
-   Missing actual and forecast counts.
-   Decision-cutoff rule.
-   Data refresh timestamp, if available.

### `GET /api/timeseries?date=2026-01-15`

Return one day's half-hour rows, including:

-   `startTime`
-   `actualGeneration`
-   `forecastGeneration`
-   `publishTime`
-   `decisionCutoff`
-   `errorMw`

Return missing forecast values as null, not zero.

### `GET /api/accuracy?start=2026-01-01&end=2026-02-01`

Return aggregate metrics and, if implemented, daily metrics. Document
whether `end` is exclusive.

### `GET /api/forecast-history?delivery_time=...`

Return the forecast versions for the requested delivery period, sorted
by publication timestamp. Include which version was selected at the
cutoff and which versions were published too late.

### `GET /api/data-quality?month=2026-01`

Return coverage, missing values, duplicate counts, invalid records, and
data refresh information.

## API practices

-   Validate query parameters.
-   Use typed response schemas where practical.
-   Return meaningful HTTP errors.
-   Configure CORS for the deployed frontend origin, not every origin in
    production.
-   Do not return raw stack traces to the browser.
-   Add basic logging.
-   Keep the endpoints documented through FastAPI's OpenAPI/Swagger
    interface.

------------------------------------------------------------------------

# 7. Frontend: design the dashboard

The UI should look like a professional energy analytics product, not a
generic admin template.

## Visual direction

-   **Style:** restrained energy-trading analytics dashboard.
-   **Layout:** compact navigation/header, KPI cards, large charts, then
    detail tables.
-   **Color:** dark navy or charcoal text, light neutral background, one
    strong accent color. Use distinct and accessible colors for actual
    and forecast series.
-   **Typography:** clear sans-serif, strong hierarchy, readable
    numbers.
-   **Density:** enough information for an analyst without crowding the
    page.
-   **Responsive:** chart and table should remain usable on smaller
    screens.
-   **Accessibility:** labels for controls, keyboard-accessible
    interactions, sufficient contrast, and do not rely on color alone to
    convey error direction.

Avoid excessive animations, decorative gradients, and fake real-time
indicators. This is a retrospective January 2026 analysis.

## Page layout

### A. Header

Include:

-   Product name: WindLens.
-   Subtitle: `UK Wind Generation | January 2026`.
-   Data source: `Elexon BMRS`.
-   Status badge: `Historical analysis`.
-   Last data refresh timestamp, if known.

Do not show "Live" unless the data is genuinely being refreshed live.

### B. Filter bar

Include:

-   Delivery date selector (within January 2026).
-   Analysis period (fixed to January for this assignment, or a
    start/end filter if implemented).
-   Forecast cutoff policy display: `24 hours before delivery`.
-   Optional view selector: `Overview`, `Accuracy`, `Forecast history`,
    `Data quality`.

Keep the cutoff policy visible; it is a core product assumption.

### C. KPI cards

Show:

1.  **MAE** --- average absolute forecast error.
2.  **RMSE** --- error metric that penalizes large misses.
3.  **Forecast bias** --- systematic over/underprediction.
4.  **Matched periods** --- count of valid actual/forecast pairs.

Each card should include units, a short tooltip or description, and a
loading/error state. Do not hardcode example metrics in the finished
app.

### D. Main chart: forecast vs actual

Use a line chart with:

-   X-axis: delivery time.
-   Y-axis: generation in the source's confirmed unit.
-   Actual generation series.
-   Selected day-ahead forecast series.
-   Tooltip showing delivery time, actual, forecast, error, and forecast
    publication time.
-   Legend and readable tick labels.
-   Empty state if no matched records exist.

For a selected day, expect up to 48 half-hour periods. Make missing
periods visually apparent rather than connecting across gaps as if data
were continuous.

### E. Error chart

Show error over time (`forecast - actual`) with a zero reference line.

-   Positive values mean forecast overprediction.
-   Negative values mean forecast underprediction.

This makes bias and individual misses easier to understand.

### F. Forecast publication history

A table for a selected delivery period:

  ------------------------------------------------------------------------
  Publication time   Forecast generation Eligible at      Selected?
                                         cutoff?          
  ---------------- --------------------- ---------------- ----------------
  Source timestamp          Source value Yes/No           Yes/No

  ------------------------------------------------------------------------

Use real API records only. The selected record must be the latest
eligible version under the documented rule.

### G. Data quality panel

Show:

-   Expected delivery periods: 1,488 for the month.
-   Observed actual delivery periods.
-   Delivery periods with selected forecasts.
-   Matched valid pairs.
-   Missing actuals and forecasts.
-   Duplicate or invalid records.
-   Applied cutoff rule and timezone convention.

Use observed counts from the data pipeline; never fill the panel with
fabricated numbers.

### H. Methodology / limitations note

Include a small "How to read this" panel:

-   Forecasts are selected using a 24-hour-ahead cutoff for this pilot.
-   Accuracy is calculated only for valid matched actual/forecast
    periods.
-   National wind data alone cannot calculate total electricity demand
    or the utility's procurement requirement.
-   January 2026 is a historical evaluation period.

## Frontend implementation order

1.  Create the Vite React TypeScript app.
2.  Add the chart and styling dependencies.
3.  Define TypeScript response types matching the backend.
4.  Create one API client module using an environment-based API URL.
5.  Build the page structure and reusable components.
6.  Connect the summary and time-series endpoints.
7.  Add loading, error, and empty states.
8.  Add forecast-history and data-quality views.
9.  Verify date changes trigger the correct requests.
10. Test at desktop and mobile widths.

Do not put API calls and metric calculations directly inside chart
components. Keep data fetching, presentation, and analytics
responsibilities separate.

------------------------------------------------------------------------

# 8. Docker and local development

Create one Dockerfile for the backend and one for the frontend, plus
`docker-compose.yml` at the repository root.

## Docker Compose should

-   Start the backend.
-   Start the frontend.
-   Mount or copy the prepared data so the backend can read it.
-   Configure the frontend's backend URL appropriately for local
    development.
-   Expose documented local ports.
-   Make startup instructions simple enough to follow from a fresh
    clone.

Example local workflow (adapt commands to the final implementation):

``` bash
# 1. Clone the repository
git clone <public-repository-url>
cd <repository-directory>

# 2. Create environment configuration
cp .env.example .env

# 3. Retrieve and preprocess data (if not already bundled)
python -m venv .venv
# Activate the virtual environment using the command for your OS
pip install -r backend/requirements.txt
python scripts/ingest_january_2026.py

# 4. Run the application
docker compose up --build
```

If ingestion runs inside Docker instead, document that path instead of
requiring duplicate installation steps. Test the README instructions
from a clean checkout.

Do not commit `.env`, API keys, local caches, or virtual environments.

------------------------------------------------------------------------

# 9. Deployment

Use separate deployments to keep the setup easy to explain.

## Frontend --- Vercel

1.  Push the project to the public GitHub repository.
2.  Import the `frontend` directory as the Vercel project root.
3.  Configure the production build command and output directory for
    Vite.
4.  Set the environment variable for the deployed backend URL.
5.  Deploy and verify the frontend URL in a private browser.

## Backend --- Render or equivalent Python host

1.  Connect the same repository.
2.  Set the backend service root directory and Python build/start
    commands.
3.  Ensure processed data is included in the deployment artifact or
    generated reliably during build/deploy.
4.  Set CORS to allow the deployed frontend origin.
5.  Deploy and test `/health` and each required API endpoint.
6.  Verify that the service can load data after a fresh deployment.

### Deployment warning

Do not rely on ephemeral local storage for data that must persist across
restarts. For this historical prototype, packaged processed files are
acceptable. Explain that a production version would use managed storage
and scheduled ingestion.

### End-to-end checks

-   Open the deployed frontend in an incognito/private browser.
-   Check browser console and network requests.
-   Confirm API responses are successful.
-   Change the selected delivery date.
-   Confirm charts and metrics update.
-   Confirm no local `localhost` URL is used in the production frontend.
-   Verify the backend is publicly reachable by the frontend.
-   Check loading and error behavior if the API is unavailable.

------------------------------------------------------------------------

# 10. README contents

The repository README should include:

1.  Product overview and screenshots.
2.  Business problem and intended users.
3.  Features.
4.  Architecture diagram.
5.  Source API links.
6.  Data retrieval and transformation steps.
7.  Forecast cutoff and selection logic.
8.  Metric definitions.
9.  Data-quality and timestamp policies.
10. Known assumptions and limitations.
11. Repository directory structure.
12. Local setup instructions.
13. Docker instructions.
14. Test commands.
15. Deployed frontend URL.
16. Backend API and API documentation URLs.
17. Demo video URL.
18. AI tools disclosure.

### AI disclosure

Be explicit and truthful. For example, adapt this wording to match what
you actually do:

> AI tools were used to assist with implementation planning, code
> generation/debugging, and documentation. The developer reviewed the
> resulting code, validated the data-processing logic, and ran tests.

Only mention tools you actually used. Do not claim tests passed unless
you ran them.

------------------------------------------------------------------------

# 11. The 10-minute video

The video is a required deliverable. Upload it as **unlisted**, then
verify that the link plays in a private browser.

## Part 1 --- Client demo (about 4 minutes 30 seconds)

1.  **Problem (30 sec):** Explain why wind forecast uncertainty matters
    for day-ahead decisions.
2.  **Dashboard (60 sec):** Show KPIs, selected delivery date, and
    actual vs forecast chart.
3.  **Accuracy (60 sec):** Explain MAE, RMSE, and bias in plain
    language.
4.  **Forecast history (60 sec):** Show publication times and
    demonstrate why a later forecast cannot be used for an earlier
    decision.
5.  **Value and limitations (30 sec):** Summarize how the dashboard
    supports analysis and state that it does not calculate total
    procurement requirements.

## Part 2 --- Technical lead review (about 4 minutes 30 seconds)

1.  **Architecture (45 sec):** Elexon → ingestion → validation →
    analytics → FastAPI → React.
2.  **Data logic (75 sec):** Explain `startTime`, `publishTime`, the
    cutoff rule, and matching to actuals.
3.  **Code structure (60 sec):** Walk through ingestion, selection,
    metrics, routes, and UI components.
4.  **Tests and reliability (45 sec):** Show key tests, missing-data
    handling, and duplicate policy.
5.  **Docker and deployment (45 sec):** Show Compose, live app, README,
    and known limitations.

Keep the entire recording under 10 minutes. Aim for roughly 9 minutes 30
seconds. Record a short outline first; avoid long coding sessions on
camera.

------------------------------------------------------------------------

# 12. Submission checklist

## Data and analytics

-   [ ] Correct Elexon datasets and wind filter.
-   [ ] January delivery period boundaries verified.
-   [ ] Forecast publication history includes eligible pre-January
    publications.
-   [ ] Decision cutoff rule documented.
-   [ ] No forecasts published after cutoff used in day-ahead metrics.
-   [ ] Actuals and forecasts matched by delivery timestamp.
-   [ ] MAE, RMSE, and bias validated with unit tests.
-   [ ] Missing and duplicate data reported honestly.
-   [ ] No fabricated or hardcoded results.

## Application

-   [ ] React frontend works.
-   [ ] FastAPI backend works.
-   [ ] Loading, empty, and error states exist.
-   [ ] Charts and filters work.
-   [ ] Methodology and limitations are visible.
-   [ ] Docker Compose works from a clean checkout.
-   [ ] No secrets committed.

## Public deliverables

-   [ ] Anonymous public GitHub repository.
-   [ ] README includes file structure and start instructions.
-   [ ] Deployed frontend link.
-   [ ] Deployed backend/API docs link.
-   [ ] Unlisted YouTube video under 10 minutes.
-   [ ] All links tested in incognito/private browsing.
-   [ ] Submission form completed.

------------------------------------------------------------------------

# 13. Suggested 16-hour schedule

  Work                                          Time budget
  ---------------------------------------- ----------------
  Inspect API schemas and sample records          1.5 hours
  Ingestion and data validation                     2 hours
  Forecast selection, metrics, and tests            2 hours
  FastAPI endpoints                               1.5 hours
  React dashboard and charts                        3 hours
  Docker and deployment                           1.5 hours
  End-to-end testing and fixes                       1 hour
  README and repository cleanup                  45 minutes
  Record and verify video                         1.5 hours
  Final link and submission checks               45 minutes
  **Total**                                  **15.5 hours**

If time is running out, simplify the design before compromising the
data-selection logic, tests, deployment, or video.

## Build order to follow

**API inspection → ingestion → validation → forecast selection →
metrics/tests → FastAPI → React UI → Docker → deployment → README →
video → submission.**

Do not start by polishing the UI. First establish that the data and
analysis are correct.
