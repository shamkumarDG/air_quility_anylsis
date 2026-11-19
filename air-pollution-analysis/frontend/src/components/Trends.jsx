import React, { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  Cell 
} from 'recharts';
import { Filter, AlertCircle } from 'lucide-react';

export default function Trends({ cities }) {
  const [selectedCity, setSelectedCity] = useState('All Cities');
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');

  const [monthlyData, setMonthlyData] = useState([]);
  const [cityData, setCityData] = useState([]);
  const [annualData, setAnnualData] = useState([]);
  const [correlationData, setCorrelationData] = useState(null);

  const [monthlyLoading, setMonthlyLoading] = useState(true);
  const [cityLoading, setCityLoading] = useState(true);
  const [annualLoading, setAnnualLoading] = useState(true);
  const [corrLoading, setCorrLoading] = useState(true);

  const [monthlyError, setMonthlyError] = useState(null);
  const [cityError, setCityError] = useState(null);

  // 1. Fetch Monthly PM2.5 trend
  useEffect(() => {
    setMonthlyLoading(true);
    setMonthlyError(null);
    fetch(`http://127.0.0.1:5000/api/trends/monthly?city=${encodeURIComponent(selectedCity)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch monthly trend data');
        return res.json();
      })
      .then((json) => {
        setMonthlyData(json.data || []);
        setMonthlyLoading(false);
      })
      .catch((err) => {
        setMonthlyError(err.message);
        setMonthlyLoading(false);
      });
  }, [selectedCity]);

  // 2. Fetch City-wise averages
  useEffect(() => {
    setCityLoading(true);
    setCityError(null);
    fetch(`http://127.0.0.1:5000/api/trends/city-comparison?pollutant=${encodeURIComponent(selectedPollutant)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch city comparison data');
        return res.json();
      })
      .then((json) => {
        setCityData(json.data || []);
        setCityLoading(false);
      })
      .catch((err) => {
        setCityError(err.message);
        setCityLoading(false);
      });
  }, [selectedPollutant]);

  // 3. Fetch Annual trend & Correlations on mount
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/trends/annual')
      .then((res) => res.json())
      .then((json) => {
        setAnnualData(json.data || []);
        setAnnualLoading(false);
      })
      .catch(() => setAnnualLoading(false));

    fetch('http://127.0.0.1:5000/api/correlations')
      .then((res) => res.json())
      .then((json) => {
        setCorrelationData(json);
        setCorrLoading(false);
      })
      .catch(() => setCorrLoading(false));
  }, []);

  const pollutantOptions = ['PM2.5', 'PM10', 'NO2', 'SO2', 'CO', 'O3', 'AQI'];

  // Helper for correlation color intensity
  const getCorrColor = (val) => {
    if (val === 1) return 'bg-cyan-500/30 text-cyan-200 border-cyan-500/40';
    if (val >= 0.7) return 'bg-emerald-500/25 text-emerald-200 border-emerald-500/30';
    if (val >= 0.4) return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20';
    if (val >= 0.1) return 'bg-slate-800 text-slate-300 border-slate-700';
    if (val >= -0.1) return 'bg-slate-900 text-slate-400 border-slate-800';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white tracking-tight">Pollution Trends & Visualizations</h2>
        <p className="text-xs text-slate-400 mt-1">
          Four analytical visualizations powered by real PySpark aggregations and Spark SQL queries.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CHART 1: Monthly PM2.5 Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Chart 1: Monthly PM2.5 Trend</h3>
              <p className="text-xs text-slate-400 mt-0.5">Spark SQL temporal aggregation by YearMonth</p>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="All Cities">All Cities (National)</option>
                {cities && cities.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] pt-4">
            {monthlyLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading trend...</div>
            ) : monthlyError ? (
              <div className="h-full flex items-center justify-center text-xs text-amber-400 gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{monthlyError}</span>
              </div>
            ) : monthlyData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                No PM2.5 records available for selected city filter.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis 
                    dataKey="YearMonth" 
                    stroke="#64748B" 
                    fontSize={10} 
                    tickFormatter={(val) => val ? val.slice(2) : ''}
                    interval={Math.ceil(monthlyData.length / 10)}
                  />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line 
                    type="monotone" 
                    dataKey="avg_pm25" 
                    name="Avg PM2.5 (µg/m³)" 
                    stroke="#06B6D4" 
                    strokeWidth={2} 
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="avg_aqi" 
                    name="Avg AQI" 
                    stroke="#A855F7" 
                    strokeWidth={1.5} 
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 2: Average PM2.5 / Pollutant by City */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Chart 2: Average Pollution by City</h3>
              <p className="text-xs text-slate-400 mt-0.5">Spark SQL spatial aggregation grouped by City</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400">Metric:</span>
              <select
                value={selectedPollutant}
                onChange={(e) => setSelectedPollutant(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                {pollutantOptions.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex-1 min-h-[300px] pt-4">
            {cityLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading cities...</div>
            ) : cityError ? (
              <div className="h-full flex items-center justify-center text-xs text-amber-400 gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{cityError}</span>
              </div>
            ) : cityData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Selected metric is currently unavailable across cities.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={cityData.slice(0, 14)} margin={{ top: 10, right: 10, left: -10, bottom: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis 
                    dataKey="City" 
                    stroke="#64748B" 
                    fontSize={9} 
                    angle={-45} 
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Bar 
                    dataKey="avg_value" 
                    name={`Average ${selectedPollutant}`} 
                    fill="#3B82F6" 
                    radius={[4, 4, 0, 0]}
                  >
                    {cityData.slice(0, 14).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={index < 3 ? '#EF4444' : index < 7 ? '#F59E0B' : '#06B6D4'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 3: Annual Pollution Trend */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Chart 3: Annual Multi-Year Pollution Trend</h3>
            <p className="text-xs text-slate-400 mt-0.5">Spark SQL multi-column yearly averages (2015–2020)</p>
          </div>

          <div className="flex-1 min-h-[300px] pt-4">
            {annualLoading ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">Loading annual trend...</div>
            ) : annualData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Annual trend data unavailable.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={annualData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" />
                  <XAxis dataKey="Year" stroke="#64748B" fontSize={11} />
                  <YAxis stroke="#64748B" fontSize={10} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
                    labelStyle={{ color: '#94A3B8' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="avg_pm25" name="PM2.5" stroke="#06B6D4" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avg_pm10" name="PM10" stroke="#F59E0B" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avg_no2" name="NO2" stroke="#10B981" strokeWidth={1.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="avg_so2" name="SO2" stroke="#8B5CF6" strokeWidth={1.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* CHART 4: Correlation Matrix */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col">
          <div className="pb-4 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-white">Chart 4: Pollutant Correlation Heatmap Matrix</h3>
            <p className="text-xs text-slate-400 mt-0.5">Pearson correlation r computed via PySpark stat.corr()</p>
          </div>

          <div className="flex-1 min-h-[300px] pt-4 flex flex-col justify-center">
            {corrLoading ? (
              <div className="text-center text-xs text-slate-400">Calculating correlation coefficients via PySpark...</div>
            ) : !correlationData || !correlationData.matrix ? (
              <div className="text-center text-xs text-slate-400">Correlation data unavailable.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-center border-collapse">
                  <thead>
                    <tr>
                      <th className="p-1.5 text-left text-slate-400 font-medium">Pollutant</th>
                      {correlationData.pollutants.map((p) => (
                        <th key={p} className="p-1.5 font-medium text-slate-300">{p}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {correlationData.matrix.map((row) => (
                      <tr key={row.pollutant} className="border-t border-slate-800/60">
                        <td className="p-1.5 text-left font-medium text-slate-300">{row.pollutant}</td>
                        {correlationData.pollutants.map((col) => {
                          const val = row[col];
                          return (
                            <td key={col} className="p-1">
                              <div className={`py-1 px-1.5 rounded border text-[11px] font-mono ${getCorrColor(val)}`}>
                                {val.toFixed(2)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="flex items-center justify-between text-[10px] text-slate-500 mt-3 px-1">
                  <span>Green: Strong Positive</span>
                  <span>Dark: Weak / Neutral</span>
                  <span>Red: Negative</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
