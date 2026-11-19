# Air Pollution Analysis Using PySpark and Spark SQL

A functional local web application built for college Big Data Analytics (BDA) assessment. The project ingests and analyzes historical Indian air quality data (2015–2020) using Apache Spark (PySpark & Spark SQL), with an interactive React frontend for visual exploration and performance benchmarking.

---

## 1. Project Overview & Architecture

- **Goal**: Analyze multi-year urban pollution metrics across major Indian cities, evaluate particulate matter trends (PM2.5, PM10), compute multi-pollutant correlations, and contrast Spark SQL query execution against single-node Pandas.
- **Methodology Reference**:
  - *"A PySpark-SparkSQL Pipeline for Urban Air Quality Monitoring: 4-Year Trends and WHO Assessment (2021–2024)"*
  - DOI: [https://doi.org/10.51584/IJRIAS.2026.11070068](https://doi.org/10.51584/IJRIAS.2026.11070068)
  - *Academic Scope*: This project adapts the general data engineering and analytics pipeline from the cited research (Ingestion → Cleaning → Feature Engineering → Spark SQL → Visualization → Benchmark). It operates on its own independent Indian Air Quality dataset (2015–2020) and does not reproduce the paper's original empirical dataset.

### Pipeline Flow:
```
[city_day.csv]
      │
      ▼
PySpark DataFrame Reader (Schema Inference)
      │
      ▼
Data Quality & Rational Missing-Value Handling
      │
      ▼
Feature Engineering (Year, Month, YearMonth)
      │
      ▼
Spark In-Memory Temp View ("air_quality_cleaned")
      │
      ├───────────────────────┬────────────────────────┐
      ▼                       ▼                        ▼
Spark SQL Queries      PySpark Correlation       Live Benchmark
(Monthly / Spatial)       (stat.corr())          (Spark vs Pandas)
      │                       │                        │
      └───────────────────────┼────────────────────────┘
                              ▼
                   Flask REST API (:5000)
                              ▼
          React + Vite + Tailwind + Recharts UI (:5173)
```

---

## 2. Directory Structure

```text
air-pollution-analysis/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Trends.jsx
│   │   │   ├── DataQuality.jsx
│   │   │   ├── Performance.jsx
│   │   │   └── Methodology.jsx
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── app.py
│   ├── analysis.py
│   └── requirements.txt
├── data/
│   └── city_day.csv
└── README.md
```

---

## 3. System Requirements & Environment

1. **Operating System**: Windows 10/11 (or macOS / Linux).
2. **Java Runtime**: Java 8, 11, or 17 (Required for Apache Spark).
   - *Verified Local Environment*: OpenJDK 17 (`C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot\`).
   - Check with: `java -version`.
   - Ensure `JAVA_HOME` environment variable points to your JDK directory.
3. **Python**: Python 3.10, 3.11, or 3.12 (PySpark 3.5.x is optimized for Python <= 3.12).
4. **Node.js**: Node 18+ and npm (For Vite frontend).

---

## 4. Step-by-Step Local Execution Instructions

### A. Dataset Setup
The application reads the dataset directly from the local `data/` directory.
- Ensure `city_day.csv` is located at:
  ```
  air-pollution-analysis/data/city_day.csv
  ```
- *Source*: [Kaggle Indian Air Quality Data (2015–2020)](https://www.kaggle.com/datasets/rohanrao/air-quality-data-in-india).
- If missing, the application cleanly displays an on-screen banner detailing the exact folder location.

---

### B. Backend Setup (Flask + PySpark)

Open a terminal in `air-pollution-analysis/backend`:

1. **Create Python Virtual Environment** (using Python 3.11 or 3.12):
   ```bash
   # Using uv:
   uv venv venv --python 3.11

   # Or using standard python:
   python -m venv venv
   ```

2. **Activate Virtual Environment**:
   - **Windows PowerShell**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   - **Windows Command Prompt**:
     ```cmd
     venv\Scripts\activate.bat
     ```
   - **Linux / macOS**:
     ```bash
     source venv/bin/activate
     ```

3. **Install Dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the Flask Backend API**:
   ```bash
   python app.py
   ```
   *The Flask API runs at `http://127.0.0.1:5000` and automatically initializes the PySpark session.*

---

### C. Frontend Setup (React + Vite + Tailwind CSS)

Open a second terminal in `air-pollution-analysis/frontend`:

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start the Frontend Development Server**:
   ```bash
   npm run dev
   ```
   *Open `http://localhost:5173` in your browser.*

---

## 5. Key Assessment Features & Implementation Details

### 1. Dashboard
- Ingests **29,531** raw records across **26 Indian cities**.
- Displays calculated statistics: Total Records, Monitored Cities, Average PM2.5 (µg/m³), Average PM10 (µg/m³), Average AQI, and available Date Range (2015-01-01 to 2020-07-01).

### 2. PySpark & Spark SQL Engine
- Loads CSV using `spark.read.csv(..., header=True, inferSchema=True)`.
- Eliminates duplicate entries via `dropDuplicates()`.
- Feature engineering extracts `Year`, `Month`, and formatted `YearMonth` using Spark SQL functions (`to_date`, `year`, `month`, `date_format`).
- Registers in-memory view `air_quality_cleaned` via `createOrReplaceTempView()`.
- Executes actual Spark SQL queries for monthly particulate trends and spatial city pollution rankings.

### 3. Four Core Visualizations
1. **Line Chart**: Monthly PM2.5 Trend (with interactive City Filter dropdown).
2. **Bar Chart**: Average Pollution by City (with Pollutant Metric selector: PM2.5, PM10, NO2, SO2, CO, O3, AQI).
3. **Line Chart**: Multi-Year Annual Pollution Trend (2015 to 2020).
4. **Heatmap Matrix**: Multi-pollutant Pearson correlation matrix computed via PySpark's `stat.corr()`.

### 4. Data Quality Strategy
- Reports exact null counts and missing percentages for all 16 columns.
- **Documented Strategy**: Avoids naive `dropna()` that discards >75% of data due to trace gases (e.g., Benzene, Xylene). Instead, filters records lacking entity identifiers (City/Date) or lacking all particulate measurements, preserving over 84% of authentic records while using null-safe aggregations in Spark SQL.

### 5. Performance Evaluation (Spark SQL vs. Pandas)
- Simultaneously executes the same group-by aggregation on both PySpark and Pandas.
- Measures wall-clock execution time (`time.perf_counter()`).
- Verifies numerical parity (difference < 0.01).
- **Academic Discussion**: Explains why Spark exhibits JVM initialization and Catalyst query planning overhead on smaller (~30k row) local files, whereas its true architectural benefit lies in horizontal partitioning and fault tolerance across distributed multi-node clusters.
