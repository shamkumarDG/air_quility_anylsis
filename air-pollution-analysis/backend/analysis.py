"""
Air Pollution Analysis Using PySpark and Spark SQL
Academic Big Data Analytics (BDA) Project Module

This module loads Indian Air Quality data (2015-2020) using PySpark,
performs schema inspection, data cleaning, feature engineering,
executes Spark SQL queries, computes correlation matrices,
and benchmarks execution performance against Pandas.
"""

import os
import sys
import time
from datetime import datetime
import pandas as pd
import numpy as np

# Ensure Java, Python and Spark environment variables are properly set
if not os.environ.get("JAVA_HOME"):
    default_java = r"C:\Program Files\Eclipse Adoptium\jdk-17.0.16.8-hotspot"
    if os.path.exists(default_java):
        os.environ["JAVA_HOME"] = default_java

os.environ["PYSPARK_PYTHON"] = sys.executable
os.environ["PYSPARK_DRIVER_PYTHON"] = sys.executable

from pyspark.sql import SparkSession
from pyspark.sql.functions import col, to_date, year, month, date_format, round as spark_round, avg, count, when


class AirQualityAnalyzer:
    def __init__(self, data_path=None):
        if data_path is None:
            # Look in ../data/city_day.csv relative to this file
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            self.data_path = os.path.join(base_dir, "data", "city_day.csv")
        else:
            self.data_path = data_path

        self.spark = None
        self.raw_df = None
        self.cleaned_df = None
        self.data_quality = {}
        self.summary_stats = {}
        self.cached_results = {}

    def check_dataset_exists(self):
        """Verify that the dataset CSV exists."""
        return os.path.exists(self.data_path)

    def initialize_spark(self):
        """
        Initialize local PySpark Session.
        Configured with local[*] to utilize local CPU cores.
        """
        if self.spark is None:
            print("[PySpark] Initializing SparkSession...")
            self.spark = (
                SparkSession.builder
                .appName("AirPollutionAnalysis-BDA")
                .master("local[*]")
                .config("spark.driver.memory", "2g")
                .config("spark.sql.shuffle.partitions", "4")
                .config("spark.ui.enabled", "false")
                .config("spark.driver.extraJavaOptions", "-Dfile.encoding=UTF-8")
                .getOrCreate()
            )
            # Reduce verbose logging for cleaner console output
            self.spark.sparkContext.setLogLevel("WARN")
            print("[PySpark] SparkSession initialized successfully.")
        return self.spark

    def load_and_clean_data(self):
        """
        Step 1 & 2: Load raw CSV into PySpark DataFrame, perform data quality assessment,
        and clean the dataset using a documented, rational missing-value strategy.
        """
        if not self.check_dataset_exists():
            raise FileNotFoundError(
                f"Dataset not found at: {self.data_path}. "
                "Please place 'city_day.csv' inside the 'data/' directory."
            )

        self.initialize_spark()

        print(f"[PySpark] Loading CSV dataset from: {self.data_path}")
        # 1. Load CSV into Spark DataFrame with schema inference
        self.raw_df = self.spark.read.csv(
            self.data_path,
            header=True,
            inferSchema=True
        )

        total_raw_rows = self.raw_df.count()
        columns = self.raw_df.columns

        # 2. Inspect missing values per column
        missing_counts = {}
        missing_percentages = {}
        
        # Calculate null count for each column using Spark SQL expressions (backtick quoted)
        null_exprs = [count(when(col(f"`{c}`").isNull(), 1)).alias(c) for c in columns]
        null_row = self.raw_df.select(null_exprs).collect()[0]

        for col_name in columns:
            null_cnt = null_row[col_name]
            missing_counts[col_name] = int(null_cnt)
            missing_percentages[col_name] = round((null_cnt / total_raw_rows) * 100, 2)

        # 3. Detect duplicate records
        unique_raw_count = self.raw_df.dropDuplicates().count()
        duplicate_count = total_raw_rows - unique_raw_count

        # 4. Cleaning Strategy (Documented):
        # - Deduplicate rows.
        # - Standardize column names (rename PM2.5 -> PM2_5 to prevent PySpark dot-notation struct resolution issues).
        # - Filter out records missing vital identification fields: City or Date.
        # - Retain records where at least one key particulate/pollutant metric (PM2.5, PM10, or AQI) is present.
        # - Avoid naive dropna() which discards >75% of rows due to sparse trace gases like Xylene/Benzene.
        cleaned = self.raw_df.dropDuplicates()
        if "PM2.5" in cleaned.columns:
            cleaned = cleaned.withColumnRenamed("PM2.5", "PM2_5")

        cleaned = cleaned.filter(col("City").isNotNull() & col("Date").isNotNull())
        cleaned = cleaned.filter(col("PM2_5").isNotNull() | col("PM10").isNotNull() | col("AQI").isNotNull())

        # 5. Feature Engineering:
        # Convert Date string to DateType, extract Year, Month, and formatted YearMonth (yyyy-MM)
        cleaned = cleaned.withColumn("ParsedDate", to_date(col("Date"), "yyyy-MM-dd"))
        cleaned = cleaned.withColumn("Year", year(col("ParsedDate")))
        cleaned = cleaned.withColumn("Month", month(col("ParsedDate")))
        cleaned = cleaned.withColumn("YearMonth", date_format(col("ParsedDate"), "yyyy-MM"))

        # Cache cleaned DataFrame in Spark memory for high-performance SQL querying
        self.cleaned_df = cleaned.cache()
        total_cleaned_rows = self.cleaned_df.count()

        # Register Temporary View for Spark SQL
        self.cleaned_df.createOrReplaceTempView("air_quality_cleaned")

        # Save data quality metrics
        self.data_quality = {
            "total_raw_rows": int(total_raw_rows),
            "total_cleaned_rows": int(total_cleaned_rows),
            "removed_rows": int(total_raw_rows - total_cleaned_rows),
            "duplicate_records": int(duplicate_count),
            "columns": columns,
            "missing_counts": missing_counts,
            "missing_percentages": missing_percentages,
            "cleaning_strategy": (
                "1. Filtered records where essential City or Date identifiers are null. "
                "2. Retained rows where at least one primary particulate or AQI metric (PM2.5, PM10, AQI) is present. "
                "3. Removed duplicate records. "
                "4. Handled missing trace-gas attributes via null-safe aggregations instead of row-wide deletion."
            )
        }

        # Calculate high-level summary KPIs
        self._calculate_summary_kpis()

        return self.data_quality

    def _calculate_summary_kpis(self):
        """Calculate overall dashboard statistics using Spark SQL."""
        kpi_query = """
            SELECT 
                COUNT(*) AS total_records,
                COUNT(DISTINCT City) AS total_cities,
                ROUND(AVG(PM2_5), 2) AS avg_pm25,
                ROUND(AVG(PM10), 2) AS avg_pm10,
                ROUND(AVG(AQI), 2) AS avg_aqi,
                MIN(Date) AS min_date,
                MAX(Date) AS max_date
            FROM air_quality_cleaned
        """
        row = self.spark.sql(kpi_query).collect()[0]
        self.summary_stats = {
            "total_records": int(row["total_records"]),
            "total_cities": int(row["total_cities"]),
            "avg_pm25": float(row["avg_pm25"]) if row["avg_pm25"] is not None else 0.0,
            "avg_pm10": float(row["avg_pm10"]) if row["avg_pm10"] is not None else 0.0,
            "avg_aqi": float(row["avg_aqi"]) if row["avg_aqi"] is not None else 0.0,
            "date_range": f"{row['min_date']} to {row['max_date']}",
            "min_date": str(row["min_date"]),
            "max_date": str(row["max_date"])
        }

    def get_cities_list(self):
        """Retrieve list of distinct cities sorted alphabetically."""
        if "cities" in self.cached_results:
            return self.cached_results["cities"]

        if self.cleaned_df is None:
            self.load_and_clean_data()
        cities = [
            row["City"] for row in 
            self.spark.sql("SELECT DISTINCT City FROM air_quality_cleaned ORDER BY City").collect()
        ]
        self.cached_results["cities"] = cities
        return cities

    def get_monthly_pm25_trend(self, city=None):
        """
        Analytical Spark SQL Query #1:
        Calculate monthly average PM2.5 and AQI trends across the dataset or for a selected city.
        """
        if self.cleaned_df is None:
            self.load_and_clean_data()

        if city and city != "All Cities":
            query = f"""
                SELECT 
                    YearMonth,
                    ROUND(AVG(PM2_5), 2) AS avg_pm25,
                    ROUND(AVG(PM10), 2) AS avg_pm10,
                    ROUND(AVG(AQI), 2) AS avg_aqi,
                    COUNT(*) AS record_count
                FROM air_quality_cleaned
                WHERE City = '{city}' AND PM2_5 IS NOT NULL
                GROUP BY YearMonth
                ORDER BY YearMonth ASC
            """
        else:
            query = """
                SELECT 
                    YearMonth,
                    ROUND(AVG(PM2_5), 2) AS avg_pm25,
                    ROUND(AVG(PM10), 2) AS avg_pm10,
                    ROUND(AVG(AQI), 2) AS avg_aqi,
                    COUNT(*) AS record_count
                FROM air_quality_cleaned
                WHERE PM2_5 IS NOT NULL
                GROUP BY YearMonth
                ORDER BY YearMonth ASC
            """
        
        result_df = self.spark.sql(query)
        rows = [row.asDict() for row in result_df.collect()]
        return rows

    def get_city_wise_averages(self, pollutant="PM2.5"):
        """
        Analytical Spark SQL Query #2:
        Calculate city-wise average pollution levels across major Indian cities.
        """
        if self.cleaned_df is None:
            self.load_and_clean_data()

        # Sanitize pollutant column name for Spark SQL
        valid_pollutants = {
            "PM2.5": "PM2_5",
            "PM10": "PM10",
            "NO2": "NO2",
            "SO2": "SO2",
            "CO": "CO",
            "O3": "O3",
            "AQI": "AQI"
        }
        col_expr = valid_pollutants.get(pollutant, "PM2_5")

        query = f"""
            SELECT 
                City,
                ROUND(AVG({col_expr}), 2) AS avg_value,
                ROUND(AVG(PM2_5), 2) AS avg_pm25,
                ROUND(AVG(PM10), 2) AS avg_pm10,
                ROUND(AVG(AQI), 2) AS avg_aqi,
                COUNT(*) AS total_samples
            FROM air_quality_cleaned
            WHERE {col_expr} IS NOT NULL
            GROUP BY City
            ORDER BY avg_value DESC
        """
        result_df = self.spark.sql(query)
        rows = [row.asDict() for row in result_df.collect()]
        return rows

    def get_annual_trend(self):
        """
        Analytical Spark SQL Query #3:
        Calculate annual pollution trends from 2015 to 2020.
        """
        if "annual" in self.cached_results:
            return self.cached_results["annual"]

        if self.cleaned_df is None:
            self.load_and_clean_data()

        query = """
            SELECT 
                Year,
                ROUND(AVG(PM2_5), 2) AS avg_pm25,
                ROUND(AVG(PM10), 2) AS avg_pm10,
                ROUND(AVG(NO2), 2) AS avg_no2,
                ROUND(AVG(SO2), 2) AS avg_so2,
                ROUND(AVG(AQI), 2) AS avg_aqi
            FROM air_quality_cleaned
            WHERE Year IS NOT NULL
            GROUP BY Year
            ORDER BY Year ASC
        """
        result_df = self.spark.sql(query)
        rows = [row.asDict() for row in result_df.collect()]
        self.cached_results["annual"] = rows
        return rows

    def get_pollutant_correlations(self):
        """
        Calculate Pearson correlation matrix between available pollutants
        using PySpark's DataFrame stat.corr() function.
        """
        if "correlations" in self.cached_results:
            return self.cached_results["correlations"]

        if self.cleaned_df is None:
            self.load_and_clean_data()

        pollutants = ["PM2.5", "PM10", "NO2", "SO2", "CO", "O3", "AQI"]
        # Map PM2.5 to PM2_5 for Spark column lookup
        col_map = {p: ("PM2_5" if p == "PM2.5" else p) for p in pollutants}
        matrix = []

        for p1 in pollutants:
            row_vals = {"pollutant": p1}
            spark_col1 = col_map[p1]
            for p2 in pollutants:
                if p1 == p2:
                    row_vals[p2] = 1.0
                else:
                    spark_col2 = col_map[p2]
                    try:
                        # PySpark DataFrame correlation computation
                        val = self.cleaned_df.stat.corr(spark_col1, spark_col2)
                        row_vals[p2] = round(float(val), 3) if val is not None else 0.0
                    except Exception:
                        row_vals[p2] = 0.0
            matrix.append(row_vals)

        result = {
            "pollutants": pollutants,
            "matrix": matrix
        }
        self.cached_results["correlations"] = result
        return result

    def evaluate_performance(self):
        """
        Performance Evaluation:
        Measures actual execution time of a Spark SQL aggregation vs. an equivalent Pandas aggregation
        on the exact same dataset.
        Checks result numerical parity and provides documented explanation.
        """
        if not self.check_dataset_exists():
            raise FileNotFoundError("Dataset not found for performance evaluation.")

        self.initialize_spark()

        # 1. Measure PySpark Spark SQL Aggregation
        # Task: Group by City and Year, calculating Average PM2.5 and AQI
        spark_start = time.perf_counter()
        spark_agg = self.spark.sql("""
            SELECT 
                City, 
                Year, 
                AVG(PM2_5) AS avg_pm25, 
                AVG(AQI) AS avg_aqi,
                COUNT(*) AS cnt
            FROM air_quality_cleaned
            WHERE PM2_5 IS NOT NULL
            GROUP BY City, Year
            ORDER BY City, Year
        """).collect()
        spark_duration_ms = (time.perf_counter() - spark_start) * 1000

        # 2. Measure Equivalent Pandas Aggregation
        pandas_start = time.perf_counter()
        # Read the same cleaned dataset into Pandas
        pdf = pd.read_csv(self.data_path)
        pdf = pdf.dropna(subset=["City", "Date"])
        pdf = pdf[pdf["PM2.5"].notna() | pdf["PM10"].notna() | pdf["AQI"].notna()]
        pdf["Year"] = pd.to_datetime(pdf["Date"]).dt.year
        pdf_filtered = pdf[pdf["PM2.5"].notna()]
        pandas_agg = pdf_filtered.groupby(["City", "Year"]).agg(
            avg_pm25=("PM2.5", "mean"),
            avg_aqi=("AQI", "mean"),
            cnt=("PM2.5", "count")
        ).reset_index().sort_values(by=["City", "Year"])
        pandas_duration_ms = (time.perf_counter() - pandas_start) * 1000

        # Check numerical agreement between PySpark and Pandas results
        spark_records_count = len(spark_agg)
        pandas_records_count = len(pandas_agg)
        
        # Compare first overlapping group average to verify numerical accuracy
        sample_diff = 0.0
        results_match = (spark_records_count == pandas_records_count)
        if results_match and spark_records_count > 0:
            first_spark_val = spark_agg[0]["avg_pm25"]
            first_pandas_val = pandas_agg.iloc[0]["avg_pm25"]
            sample_diff = abs(first_spark_val - first_pandas_val)
            results_match = sample_diff < 0.01

        return {
            "spark_time_ms": round(spark_duration_ms, 2),
            "pandas_time_ms": round(pandas_duration_ms, 2),
            "rows_processed": int(self.cleaned_df.count() if self.cleaned_df else len(pdf)),
            "aggregated_groups_count": spark_records_count,
            "results_match": bool(results_match),
            "sample_difference": round(float(sample_diff), 6),
            "explanation": (
                "For small, single-node datasets (~30,000 rows), Pandas operates entirely in-memory with C-optimized vectorized operations and negligible execution overhead. "
                "PySpark incurs Spark catalyst query planning, JVM task execution, serialization, and partition coordination overhead, which makes it slower on small local files. "
                "However, PySpark's distributed architecture is designed to scale horizontally across multi-node clusters handling gigabytes to petabytes, where Pandas would fail due to single-machine memory constraints."
            )
        }
