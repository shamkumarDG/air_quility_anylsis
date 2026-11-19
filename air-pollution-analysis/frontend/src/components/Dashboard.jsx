import React from 'react';
import { Database, MapPin, Wind, Calendar, Activity, AlertCircle } from 'lucide-react';

export default function Dashboard({ overview, loading, error, onNavigate }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-sm">Calculating dataset statistics using PySpark...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-950/30 border border-red-800/50 rounded-xl p-6 text-red-200 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
        <div>
          <div className="font-semibold text-sm">Failed to load overview data</div>
          <p className="text-xs text-red-300 mt-1">{error}</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Records',
      value: overview?.total_records ? Number(overview.total_records).toLocaleString() : '—',
      caption: 'Processed by PySpark DataFrame',
      icon: Database,
      highlight: 'text-cyan-400'
    },
    {
      title: 'Monitored Cities',
      value: overview?.total_cities || '—',
      caption: 'Across Indian Metropolitans',
      icon: MapPin,
      highlight: 'text-blue-400'
    },
    {
      title: 'Average PM2.5',
      value: overview?.avg_pm25 ? `${overview.avg_pm25} µg/m³` : '—',
      caption: 'Fine Particulate Matter',
      icon: Wind,
      highlight: 'text-amber-400'
    },
    {
      title: 'Average PM10',
      value: overview?.avg_pm10 ? `${overview.avg_pm10} µg/m³` : '—',
      caption: 'Coarse Particulate Matter',
      icon: Wind,
      highlight: 'text-orange-400'
    },
    {
      title: 'Average AQI',
      value: overview?.avg_aqi ? Math.round(overview.avg_aqi) : '—',
      caption: 'National Air Quality Index',
      icon: Activity,
      highlight: 'text-emerald-400'
    },
    {
      title: 'Temporal Range',
      value: overview?.date_range || '—',
      caption: 'Multi-year Historical Data',
      icon: Calendar,
      highlight: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Executive Dashboard</h2>
        <p className="text-xs text-slate-400 mt-1">
          Historical Indian Air Quality Analytics computed using Apache Spark (PySpark & Spark SQL).
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{card.title}</span>
                <Icon className={`w-4 h-4 ${card.highlight}`} />
              </div>
              <div className={`text-2xl font-bold mt-3 tracking-tight ${card.highlight}`}>
                {card.value}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-normal">
                {card.caption}
              </div>
            </div>
          );
        })}
      </div>

      {/* Overview Quick Actions & Architecture Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white">Academic Implementation Summary</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed">
            This application is constructed for college Big Data Analytics (BDA) assessment. It ingests historical Indian city-day air quality data (2015–2020), applies PySpark transformations to resolve missing attributes, registers in-memory temporary views, and executes Spark SQL analytical queries to generate real trends and correlation matrices.
          </p>
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Execution Mode: Local Standalone</span>
            <button
              onClick={() => onNavigate('trends')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              Explore Visualizations →
            </button>
          </div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white">Spark SQL Aggregation Highlights</h3>
          <ul className="text-xs text-slate-400 mt-2 space-y-2">
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>Temporal Partitioning:</strong> Analyzed multi-year particulate trends across monthly intervals.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>City-Level Aggregations:</strong> Compared spatial pollution distributions across 26 major metropolitan centers.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-cyan-400">•</span>
              <span><strong>Pearson Correlation:</strong> Computed multi-pollutant cross-correlation matrix via Spark DataFrame API.</span>
            </li>
          </ul>
          <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500">Spark Session: PySpark 3.5</span>
            <button
              onClick={() => onNavigate('performance')}
              className="text-xs font-medium text-cyan-400 hover:text-cyan-300"
            >
              View Benchmark Data →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
