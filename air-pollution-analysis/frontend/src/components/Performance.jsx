import React, { useState, useEffect } from 'react';
import { Play, CheckCircle2, XCircle, Clock, Zap, Info } from 'lucide-react';

export default function Performance() {
  const [benchmark, setBenchmark] = useState(null);
  const [loading, setLoading] = useState(true);
  const [runningTest, setRunningTest] = useState(false);

  const fetchBenchmark = () => {
    setRunningTest(true);
    fetch('http://127.0.0.1:5000/api/performance')
      .then((res) => {
        if (!res.ok) throw new Error('Benchmark failed');
        return res.json();
      })
      .then((json) => {
        setBenchmark(json);
        setLoading(false);
        setRunningTest(false);
      })
      .catch(() => {
        setLoading(false);
        setRunningTest(false);
      });
  };

  useEffect(() => {
    fetchBenchmark();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Performance Evaluation</h2>
          <p className="text-xs text-slate-400 mt-1">
            Empirical runtime comparison: Spark SQL vs Single-Node Pandas aggregation.
          </p>
        </div>
        <button
          onClick={fetchBenchmark}
          disabled={runningTest}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors shadow-sm"
        >
          <Play className={`w-3.5 h-3.5 ${runningTest ? 'animate-spin' : ''}`} />
          <span>{runningTest ? 'Executing Benchmark...' : 'Run Live Benchmark'}</span>
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64 text-slate-400">
          <div className="text-sm">Executing benchmark query on Spark and Pandas engines...</div>
        </div>
      ) : !benchmark ? (
        <div className="text-slate-400 text-sm">Benchmark data unavailable.</div>
      ) : (
        <>
          {/* Execution Time Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>PySpark Runtime</span>
                <Zap className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-2xl font-bold text-cyan-400 mt-2 font-mono">
                {benchmark.spark_time_ms} ms
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Catalyst query planning + JVM execution</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Pandas Runtime</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-amber-400 mt-2 font-mono">
                {benchmark.pandas_time_ms} ms
              </div>
              <div className="text-[11px] text-slate-500 mt-1">In-memory vectorized C execution</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Rows Processed</span>
                <span className="text-xs text-slate-500 font-mono">N</span>
              </div>
              <div className="text-2xl font-bold text-white mt-2 font-mono">
                {Number(benchmark.rows_processed || 0).toLocaleString()}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Same dataset passed to both</div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Numerical Parity</span>
                {benchmark.results_match ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
              </div>
              <div className={`text-xl font-bold mt-2 ${benchmark.results_match ? 'text-emerald-400' : 'text-red-400'}`}>
                {benchmark.results_match ? 'Results Match' : 'Discrepancy'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Tolerance: &lt; 0.01 (Diff: {benchmark.sample_difference})
              </div>
            </div>
          </div>

          {/* Benchmark Query Definition & Execution Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
              <h3 className="text-sm font-semibold text-white">Aggregated Benchmark Query</h3>
              <p className="text-xs text-slate-400 mt-1 mb-3">
                Identical grouping and aggregation logic executed simultaneously on both engines:
              </p>
              <pre className="bg-slate-950 p-3 rounded-lg text-xs font-mono text-cyan-300 overflow-x-auto border border-slate-800/80">
{`-- Spark SQL Formulation
SELECT City, Year, 
       AVG(PM2.5) AS avg_pm25, 
       AVG(AQI) AS avg_aqi, 
       COUNT(*) AS cnt
FROM air_quality_cleaned
WHERE PM2.5 IS NOT NULL
GROUP BY City, Year
ORDER BY City, Year;`}
              </pre>
              <div className="text-[11px] text-slate-500 mt-3">
                Total grouped partitions produced: {benchmark.aggregated_groups_count} records.
              </div>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-semibold text-white">Academic Analysis & Overhead Explanation</h3>
                </div>
                <div className="mt-3 text-xs text-slate-300 leading-relaxed bg-slate-800/30 p-3.5 rounded-lg border border-slate-800">
                  {benchmark.explanation}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-500">
                Key takeaway for viva/assessment: PySpark is not built to beat Pandas on 30k rows on a single laptop; it is engineered for distributed fault-tolerant processing across petabyte-scale clusters where Pandas runs out of memory (OOM).
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
