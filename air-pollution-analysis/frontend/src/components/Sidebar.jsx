import React from 'react';
import { 
  LayoutDashboard, 
  LineChart, 
  CheckCircle2, 
  Cpu, 
  BookOpen 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab }) {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trends', label: 'Trends', icon: LineChart },
    { id: 'data-quality', label: 'Data Quality', icon: CheckCircle2 },
    { id: 'performance', label: 'Performance', icon: Cpu },
    { id: 'methodology', label: 'Methodology', icon: BookOpen },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col shrink-0 min-h-screen">
      <div className="p-6 border-b border-slate-800">
        <div className="text-xs font-semibold tracking-wider text-cyan-400 uppercase">College BDA Project</div>
        <h1 className="text-lg font-bold text-white tracking-tight mt-1">Air Quality Analytics</h1>
        <p className="text-xs text-slate-400 mt-0.5">PySpark & Spark SQL Engine</p>
      </div>

      <nav className="flex-1 p-4 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-800">
          <div className="text-xs text-slate-400 font-medium">Dataset</div>
          <div className="text-xs text-slate-200 mt-1 font-mono">India Air Quality (2015–20)</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Format: city_day.csv</div>
        </div>
      </div>
    </aside>
  );
}
