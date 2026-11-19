"""
Flask Backend Application
Academic Big Data Analytics (BDA) Project: Air Pollution Analysis Using PySpark and Spark SQL
"""

import os
import threading
from flask import Flask, jsonify, request
from flask_cors import CORS
from analysis import AirQualityAnalyzer

app = Flask(__name__)
# Enable CORS for local React development (port 5173 / all localhost)
CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global analyzer instance
analyzer = AirQualityAnalyzer()

@app.route("/", methods=["GET"])
def home():
    """Welcome route explaining that this is the API backend."""
    return jsonify({
        "project": "Air Pollution Analysis Using PySpark and Spark SQL (Backend API)",
        "status": "online",
        "frontend_dashboard_url": "http://localhost:5173",
        "endpoints": [
            "/api/status",
            "/api/overview",
            "/api/cities",
            "/api/trends/monthly",
            "/api/trends/city-comparison",
            "/api/trends/annual",
            "/api/correlations",
            "/api/performance",
            "/api/data-quality",
            "/api/methodology"
        ]
    })

def preload_spark_pipeline():
    """Background thread to initialize PySpark on startup without blocking Flask."""
    if analyzer.check_dataset_exists():
        try:
            print("[Flask] Preloading PySpark data pipeline in background...")
            analyzer.load_and_clean_data()
            print("[Flask] PySpark data pipeline preloaded successfully.")
        except Exception as err:
            print(f"[Flask] Warning: Preloading data failed ({err}). Will load lazily on first request.")
    else:
        print("[Flask] Dataset not found in data/ folder. Awaiting user placement.")

# Start preload thread when app loads
threading.Thread(target=preload_spark_pipeline, daemon=True).start()

@app.route("/api/status", methods=["GET"])
def get_status():
    """Health check endpoint to verify dataset availability."""
    exists = analyzer.check_dataset_exists()
    return jsonify({
        "status": "ready" if exists else "dataset_missing",
        "dataset_path": analyzer.data_path,
        "message": (
            "Dataset is ready for PySpark processing."
            if exists else
            f"Dataset not found at '{analyzer.data_path}'. Please ensure 'city_day.csv' is placed in the 'data/' folder."
        )
    })

@app.route("/api/overview", methods=["GET"])
def get_overview():
    """Returns dashboard summary KPIs calculated by PySpark."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
        
        if not analyzer.summary_stats:
            analyzer.load_and_clean_data()
            
        return jsonify(analyzer.summary_stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/data-quality", methods=["GET"])
def get_data_quality():
    """Returns dataset quality metrics, missing value counts, and cleaning summary."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
            
        if not analyzer.data_quality:
            analyzer.load_and_clean_data()
            
        return jsonify(analyzer.data_quality)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/cities", methods=["GET"])
def get_cities():
    """Returns list of distinct cities available in the dataset."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
            
        cities = analyzer.get_cities_list()
        return jsonify({"cities": cities})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/trends/monthly", methods=["GET"])
def get_monthly_trend():
    """Returns monthly average PM2.5 and AQI trend (supports ?city= parameter)."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
            
        city = request.args.get("city", "All Cities")
        data = analyzer.get_monthly_pm25_trend(city=city)
        return jsonify({"city": city, "data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/trends/city-comparison", methods=["GET"])
def get_city_comparison():
    """Returns city-wise averages for selected pollutant (supports ?pollutant= parameter)."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
            
        pollutant = request.args.get("pollutant", "PM2.5")
        data = analyzer.get_city_wise_averages(pollutant=pollutant)
        return jsonify({"pollutant": pollutant, "data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/trends/annual", methods=["GET"])
def get_annual_trend():
    """Returns annual pollution trend from 2015 to 2020."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
            
        data = analyzer.get_annual_trend()
        return jsonify({"data": data})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/correlations", methods=["GET"])
def get_correlations():
    """Returns Pearson correlation matrix for pollutants computed via PySpark."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
            
        corr = analyzer.get_pollutant_correlations()
        return jsonify(corr)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/performance", methods=["GET"])
def get_performance():
    """Executes live benchmark comparing PySpark vs Pandas aggregation execution times."""
    try:
        if not analyzer.check_dataset_exists():
            return jsonify({"error": "Dataset missing"}), 404
            
        benchmark = analyzer.evaluate_performance()
        return jsonify(benchmark)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/methodology", methods=["GET"])
def get_methodology():
    """Returns academic methodology and research paper reference details."""
    return jsonify({
        "pipeline_stages": [
            "Dataset (CSV)",
            "PySpark DataFrame Ingestion",
            "Data Quality & Null-Handling",
            "Feature Engineering (Year, Month)",
            "Spark SQL Transformations",
            "Analytical Aggregations",
            "Recharts Interactive Visualizations",
            "Pandas vs Spark Benchmark"
        ],
        "paper_reference": {
            "title": "A PySpark-SparkSQL Pipeline for Urban Air Quality Monitoring: 4-Year Trends and WHO Assessment (2021–2024)",
            "doi": "https://doi.org/10.51584/IJRIAS.2026.11070068",
            "relationship": (
                "This academic project adapts the methodological framework proposed by the reference paper "
                "(ingestion → cleansing → feature engineering → Spark SQL queries → evaluation). "
                "However, this project applies the pipeline independently to the Indian Air Quality Dataset (2015–2020) "
                "from Kaggle, generating its own unique analytical metrics without reproducing the paper's original empirical dataset."
            )
        }
    })


if __name__ == "__main__":
    print("[Flask] Starting Air Pollution Analysis API server on port 5000...")
    app.run(host="127.0.0.1", port=5000, debug=False)
