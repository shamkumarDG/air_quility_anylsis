import React from 'react';
import { ShieldCheck, Copy, Database, Check, AlertTriangle } from 'lucide-react';

export default function DataQuality({ dataQuality, loading }) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <div className="text-sm">Assessing data quality metrics in PySpark DataFrame...</div>
      </div>
    );
  }

  if (!dataQuality) {
    return (
      <div className="text-slate-400 text-sm">Data quality metrics unavailable.</div>
    );
  }

  const columns = dataQuality.columns || [];
  const missingCounts = dataQuality.missing_counts || {};
  const missingPercentages = dataQuality.missing_percentages || {};

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Data Quality & Cleansing Metrics</h2>
        <p className="text-xs text-slate-400 mt-1">
          Detailed assessment of dataset completeness, missing value distribution, and deduplication results.
        </p>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Raw Records</span>
            <Database className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-xl font-bold text-white mt-2">
            {Number(dataQuality.total_raw_rows || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Rows ingested from CSV</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Cleaned Records</span>
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-xl font-bold text-cyan-400 mt-2">
            {Number(dataQuality.total_cleaned_rows || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Retained after validation</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Excluded Rows</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold text-amber-400 mt-2">
            {Number(dataQuality.removed_rows || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Missing all particulate data</div>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Duplicates Removed</span>
            <Copy className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-xl font-bold text-purple-400 mt-2">
            {dataQuality.duplicate_records || 0}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Identified via dropDuplicates()</div>
        </div>
      </div>

      {/* Missing Values Assessment Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white mb-1">Column Completeness & Missing Value Profile</h3>
        <p className="text-xs text-slate-400 mb-4">
          Calculated by PySpark using null aggregation expressions across all dataset attributes.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-medium">
                <th className="py-2.5 px-3">Column Name</th>
                <th className="py-2.5 px-3">Missing Rows</th>
                <th className="py-2.5 px-3">Missing Rate</th>
                <th className="py-2.5 px-3 min-w-[200px]">Completeness Indicator</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {columns.map((colName) => {
                const count = missingCounts[colName] || 0;
                const pct = missingPercentages[colName] || 0;
                const completePct = (100 - pct).toFixed(1);
                
                return (
                  <tr key={colName} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-medium text-slate-200">
                      {colName}
                    </td>
                    <td className="py-2.5 px-3 text-slate-300 font-mono">
                      {count.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={pct > 50 ? 'text-amber-400' : pct > 20 ? 'text-blue-400' : 'text-slate-300'}>
                        {pct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              completePct > 80 ? 'bg-cyan-500' : completePct > 40 ? 'bg-blue-500' : 'bg-amber-500'
                            }`}
                            style={{ width: `${completePct}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono w-10 text-right">{completePct}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documented Cleansing Strategy */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-white">Documented Cleansing Strategy</h3>
        <p className="text-xs text-slate-400 mt-2 leading-relaxed">
          {dataQuality.cleaning_strategy}
        </p>
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Entity Validation</span>
            </div>
            <p className="text-slate-400 mt-1 text-[11px]">
              Guaranteed no nulls in <code className="text-slate-300">City</code> or <code className="text-slate-300">Date</code> coordinates.
            </p>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Selective Pruning</span>
            </div>
            <p className="text-slate-400 mt-1 text-[11px]">
              Preserved 84%+ of rows by discarding only entries devoid of all key particulate measurements.
            </p>
          </div>
          <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-800">
            <div className="font-semibold text-cyan-400 flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" />
              <span>Null-Safe Aggregation</span>
            </div>
            <p className="text-slate-400 mt-1 text-[11px]">
              Spark SQL's <code className="text-slate-300">AVG()</code> naturally ignores null values during calculations.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
