import React from 'react';
import { BookOpen, ExternalLink, ArrowRight, ShieldCheck, Layers, GitBranch } from 'lucide-react';

export default function Methodology() {
  const pipelineSteps = [
    {
      title: 'Dataset Ingestion',
      desc: 'Raw CSV ingestion (city_day.csv) covering 2015–2020 Indian air quality monitoring records.',
      tech: 'pyspark.sql.DataFrameReader'
    },
    {
      title: 'PySpark DataFrame',
      desc: 'Schema inference and resilient distributed dataset mapping into structured Spark columns.',
      tech: 'StructType & InferSchema'
    },
    {
      title: 'Data Cleaning',
      desc: 'Deduplication and strategic missing-value handling to prevent loss of critical particulate records.',
      tech: 'dropDuplicates & null filter'
    },
    {
      title: 'Feature Engineering',
      desc: 'Parsing string timestamps into DateType, deriving Year, Month, and YearMonth partitions.',
      tech: 'to_date, year, month, date_format'
    },
    {
      title: 'Spark SQL Views',
      desc: 'Registering in-memory temporary views for high-performance declarative SQL aggregations.',
      tech: 'createOrReplaceTempView'
    },
    {
      title: 'Analytical Aggregation',
      desc: 'Executing spatial (city-wise) and temporal (monthly/yearly) multi-pollutant statistical summaries.',
      tech: 'spark.sql() with AVG, COUNT'
    },
    {
      title: 'Visualization Layer',
      desc: 'Translating Spark analytical records into interactive charts (Recharts) for visual exploration.',
      tech: 'React, Recharts, Tailwind CSS'
    },
    {
      title: 'Performance Benchmark',
      desc: 'Empirically evaluating Spark SQL vs single-threaded Pandas runtime and verifying numerical parity.',
      tech: 'time.perf_counter() & Parity Check'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Methodology & Research Citation</h2>
        <p className="text-xs text-slate-400 mt-1">
          Architectural pipeline design and methodological foundation for the Big Data Analytics assessment.
        </p>
      </div>

      {/* Research Paper Citation Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <BookOpen className="w-4 h-4" />
          <span>Methodological Reference Paper</span>
        </div>

        <h3 className="text-base font-bold text-white mt-2 leading-snug">
          "A PySpark-SparkSQL Pipeline for Urban Air Quality Monitoring: 4-Year Trends and WHO Assessment (2021–2024)"
        </h3>

        <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
          <span className="text-slate-400">Digital Object Identifier (DOI):</span>
          <a
            href="https://doi.org/10.51584/IJRIAS.2026.11070068"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-mono text-cyan-400 hover:text-cyan-300 underline underline-offset-2"
          >
            <span>https://doi.org/10.51584/IJRIAS.2026.11070068</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="mt-4 p-4 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-300 space-y-2 leading-relaxed">
          <p>
            <strong>Academic Scope & Independence:</strong> This project adapts the broad data engineering and analytical pipeline proposed in the cited research paper—specifically the architectural progression of raw sensor ingestion, distributed schema definition, missing value resilience, and Spark SQL analytical querying.
          </p>
          <p className="text-slate-400 text-[11px]">
            <em>Notice:</em> This application utilizes its own independent dataset (Indian Air Quality Dataset 2015–2020 by Rohan Rao, Kaggle) and generates autonomous analytical results. It does not claim to reproduce or duplicate the empirical findings of the reference paper.
          </p>
        </div>
      </div>

      {/* Pipeline Workflow Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 text-white text-sm font-semibold mb-4">
          <Layers className="w-4 h-4 text-cyan-400" />
          <span>Big Data Processing Pipeline Architecture</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {pipelineSteps.map((step, idx) => (
            <div
              key={idx}
              className="bg-slate-800/40 border border-slate-800 rounded-lg p-4 flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/40">
                    Stage {idx + 1}
                  </span>
                  {idx < pipelineSteps.length - 1 && (
                    <ArrowRight className="w-3 h-3 text-slate-600 hidden lg:block" />
                  )}
                </div>
                <h4 className="text-xs font-bold text-white tracking-tight">{step.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-normal">{step.desc}</p>
              </div>
              <div className="mt-3 pt-2 border-t border-slate-800/60 text-[10px] font-mono text-slate-500">
                {step.tech}
              </div>
            </div>
          ))}
        </div>
      </div>
    
    </div>
  );
}