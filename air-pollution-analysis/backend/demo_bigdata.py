#!/usr/bin/env python
# --------------------------------------------------------------
# demo_bigdata.py
# A concise end‑to‑end Spark demo: ingest → clean → transform → query → write
# --------------------------------------------------------------
import os
from datetime import datetime

from pyspark.sql import SparkSession
from pyspark.sql.functions import (
    col,
    to_date,
    year,
    month,
    when,
    avg,
    count,
    lit,
)

# ------------------------------------------------------------------
# 1️⃣ Spark session (tuned for a “big‑data” demo)
# ------------------------------------------------------------------
spark = (
    SparkSession.builder.appName("AirQualityBigDataDemo")
    # Adjust these settings for your local machine – they illustrate typical big‑data tuning
    .config("spark.sql.shuffle.partitions", "200")          # parallelism
    .config("spark.sql.execution.arrow.enabled", "true")   # Arrow for Pandas interop
    .config("spark.serializer", "org.apache.spark.serializer.KryoSerializer")
    .getOrCreate()
)

# ------------------------------------------------------------------
# 2️⃣ Paths – change only if you placed the CSV elsewhere
# ------------------------------------------------------------------
PROJECT_ROOT = os.path.abspath(os.path.join(__file__, "..", ".."))
DATA_CSV = os.path.join(
    PROJECT_ROOT,
    "backend",
    "data",
    "city_day.csv",   # <-- the Kaggle file you downloaded
)
OUTPUT_PARQUET = os.path.join(
    PROJECT_ROOT,
    "backend",
    "output",
    "air_quality_parquet",
)

# ------------------------------------------------------------------
# 3️⃣ Ingest CSV (assume > 10 M rows → true “big‑data” size)
# ------------------------------------------------------------------
df_raw = (
    spark.read.format("csv")
    .option("header", "true")
    .option("inferSchema", "true")
    .load(DATA_CSV)
)

print(f"Raw rows: {df_raw.count():,}")

# ------------------------------------------------------------------
# 4️⃣ Cleaning
# ------------------------------------------------------------------
# 4.1 Drop exact duplicate rows
df_clean = df_raw.dropDuplicates()

# 4.2 Standardise column names (lower‑case, replace spaces)
df_clean = df_clean.select(
    [col(c).alias(c.lower().replace(" ", "_")) for c in df_clean.columns]
)

# 4.3 Cast date column to proper DateType (original column is “date”)
df_clean = df_clean.withColumn(
    "date",
    to_date(col("date"), "yyyy-MM-dd")
)

# 4.4 Filter out rows where the core pollutant measurements are null
core_pollutants = ["pm2_5", "pm10", "so2", "no2", "o3", "co"]
for p in core_pollutants:
    df_clean = df_clean.filter(col(p).isNotNull())

print(f"After cleaning rows: {df_clean.count():,}")

# ------------------------------------------------------------------
# 5️⃣ Feature engineering
# ------------------------------------------------------------------
df_feat = (
    df_clean.withColumn("year", year(col("date")))
    .withColumn("month", month(col("date")))
    # WHO 2021 annual limit for PM2.5 is 5 µg/m³ (example)
    .withColumn(
        "pm2_5_exceed_who",
        when(col("pm2_5") > lit(5), 1).otherwise(0),
    )
)

# ------------------------------------------------------------------
# 6️⃣ Register as temporary view for SQL queries
# ------------------------------------------------------------------
df_feat.createOrReplaceTempView("air_quality")

# ------------------------------------------------------------------
# 7️⃣ Analytical query – city‑wise monthly avg + WHO exceedance count
# ------------------------------------------------------------------
query = """
SELECT
    city,
    year,
    month,
    ROUND(AVG(pm2_5), 2)      AS avg_pm2_5,
    ROUND(AVG(pm10), 2)       AS avg_pm10,
    ROUND(AVG(no2), 2)        AS avg_no2,
    SUM(pm2_5_exceed_who)     AS pm2_5_who_exceedances,
    COUNT(*)                  AS obs_count
FROM air_quality
GROUP BY city, year, month
ORDER BY city, year, month
"""

df_result = spark.sql(query)

print("Sample of aggregated result:")
df_result.show(5, truncate=False)

# ------------------------------------------------------------------
# 8️⃣ Write result as **partitioned Parquet** (city / year)
# ------------------------------------------------------------------
(
    df_result.write.mode("overwrite")
    .partitionBy("city", "year")
    .parquet(OUTPUT_PARQUET)
)

print(f"Aggregated data written to {OUTPUT_PARQUET}")

# ------------------------------------------------------------------
# 9️⃣ Clean shutdown
# ------------------------------------------------------------------
spark.stop()