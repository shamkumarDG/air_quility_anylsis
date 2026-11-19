import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import Trends from './components/Trends';
import DataQuality from './components/DataQuality';
import Performance from './components/Performance';
import Methodology from './components/Methodology';
import { AlertCircle, Server, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverStatus, setServerStatus] = useState(null);
  const [overview, setOverview] = useState(null);
  const [dataQuality, setDataQuality] = useState(null);
  const [cities, setCities] = useState([]);
  
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [loadingDQ, setLoadingDQ] = useState(true);
  const [overviewError, setOverviewError] = useState(null);

  // Check backend server status
  useEffect(() => {
    fetch('http://127.0.0.1:5000/api/status')
      .then((res) => res.json())
      .then((data) => setServerStatus(data))
      .catch(() => setServerStatus({ status: 'offline', message: 'Backend server is not reachable on port 5000.' }));
  }, []);

  // Fetch overview data and cities
  useEffect(() => {
    if (serverStatus && serverStatus.status === 'ready') {
      fetch('http://127.0.0.1:5000/api/overview')
        .then((res) => {
          if (!res.ok) throw new Error('Failed to retrieve summary statistics');
          return res.json();
        })
        .then((data) => {
          setOverview(data);
          setLoadingOverview(false);
        })
        .catch((err) => {
          setOverviewError(err.message);
          setLoadingOverview(false);
        });

      fetch('http://127.0.0.1:5000/api/data-quality')
        .then((res) => res.json())
        .then((data) => {
          setDataQuality(data);
          setLoadingDQ(false);
        })
        .catch(() => setLoadingDQ(false));

      fetch('http://127.0.0.1:5000/api/cities')
        .then((res) => res.json())
        .then((data) => setCities(data.cities || []))
        .catch(() => {});
    } else if (serverStatus && serverStatus.status === 'dataset_missing') {
      setLoadingOverview(false);
      setLoadingDQ(false);
    }
  }, [serverStatus]);

  return (
    <div className="flex min-h-screen bg-[#0B0F19] text-slate-100">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top Navbar */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-8 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono font-medium text-slate-400">Project:</span>
            <span className="text-xs font-semibold text-slate-200">Air Pollution Analysis Using PySpark & Spark SQL</span>
          </div>

          <div className="flex items-center gap-4">
            {serverStatus?.status === 'ready' ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>PySpark Engine Active</span>
              </div>
            ) : serverStatus?.status === 'dataset_missing' ? (
              <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-950/40 border border-amber-800/40 px-3 py-1 rounded-full">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Dataset Missing</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-800/60 border border-slate-700/60 px-3 py-1 rounded-full">
                <Server className="w-3.5 h-3.5 text-slate-400" />
                <span>Backend Connecting...</span>
              </div>
            )}
          </div>
        </header>

        {/* Content Container */}
        <main className="flex-1 p-8 max-w-7xl w-full mx-auto">
          {/* Missing dataset banner if applicable */}
          {serverStatus?.status === 'dataset_missing' && (
            <div className="mb-6 bg-amber-950/40 border border-amber-700/60 rounded-xl p-5 text-amber-200">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-amber-300">Dataset File Required</h3>
                  <p className="text-xs text-amber-200/90 mt-1">
                    The backend expects the Indian Air Quality CSV at:
                  </p>
                  <code className="inline-block mt-2 px-2.5 py-1 bg-amber-900/60 border border-amber-700/80 rounded text-xs font-mono text-amber-200">
                    air-pollution-analysis/data/city_day.csv
                  </code>
                  <p className="text-xs text-amber-300/80 mt-2">
                    Please place the Kaggle 'city_day.csv' file inside that directory and restart the Flask server.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'dashboard' && (
            <Dashboard 
              overview={overview} 
              loading={loadingOverview} 
              error={overviewError} 
              onNavigate={(tab) => setActiveTab(tab)} 
            />
          )}

          {activeTab === 'trends' && (
            <Trends cities={cities} />
          )}

          {activeTab === 'data-quality' && (
            <DataQuality dataQuality={dataQuality} loading={loadingDQ} />
          )}

          {activeTab === 'performance' && (
            <Performance />
          )}

          {activeTab === 'methodology' && (
            <Methodology />
          )}
        </main>
      </div>
    </div>
  );
}
