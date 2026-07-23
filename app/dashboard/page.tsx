'use client';

import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Store, 
  Package, 
  Layers, 
  Calendar,
  DollarSign,
  PieChart as PieIcon,
  RefreshCw,
  Filter
} from 'lucide-react';

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

export default function DashboardPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');
  const [dashData, setDashData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboard = async (month: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard?month=${month}`);
      const data = await res.json();
      setDashData(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard(selectedMonth);
  }, [selectedMonth]);

  const COLORS = ['#0284c7', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'];

  return (
    <div className="space-y-8">
      
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl">
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>MTD Trend & Analytics</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Sales Performance Dashboard
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Compare historical MTD snapshot dates and monitor cumulative revenue trajectories.
          </p>
        </div>

        {/* Month Selector */}
        <div className="flex items-center space-x-3 glass-card p-2 rounded-2xl border border-slate-800">
          <Filter className="w-4 h-4 text-sky-400 ml-2" />
          <span className="text-xs text-slate-400 font-medium">Sales Month:</span>
          <select 
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="bg-slate-900 text-white font-bold text-sm px-4 py-2 rounded-xl border border-slate-700 focus:outline-none focus:border-sky-500 cursor-pointer"
          >
            <option value="2026-06">June 2026 (2026-06)</option>
            <option value="2026-07">July 2026 (2026-07)</option>
            <option value="2026-08">August 2026 (2026-08)</option>
            <option value="2026-05">May 2026 (2026-05)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Latest MTD Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            ฿{loading ? '...' : (dashData?.latestSales || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            As of {dashData?.latestDate || 'N/A'}
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">MTD Snapshot Count</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '...' : dashData?.totalSnapshots || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Active snapshots in month
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Growth vs Initial MTD</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {loading ? '...' : `${dashData?.salesGrowth > 0 ? '+' : ''}${dashData?.salesGrowth || 0}%`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Progress since 1st snapshot
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Top Store Sales</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white truncate">
            {loading ? '...' : dashData?.topStores?.[0]?.store_name || 'N/A'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            ฿{(dashData?.topStores?.[0]?.total_sales || 0).toLocaleString()}
          </div>
        </div>

      </div>

      {/* MTD Sales Growth Trajectory Chart */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              <span>Cumulative Sales Growth Across MTD Dates</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Tracks revenue progression as new weekly MTD snapshot files are uploaded.
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-4">
          {dashData?.trajectory && dashData.trajectory.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashData.trajectory} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="mtd_report_date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(v) => `฿${(v / 1e6).toFixed(1)}M`} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                  formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, 'Total Sales']}
                />
                <Area type="monotone" dataKey="total_sales" stroke="#38bdf8" strokeWidth={3} fillOpacity={1} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              No trajectory data available for {selectedMonth}. Upload MTD files to view trend.
            </div>
          )}
        </div>
      </div>

      {/* Grid: Top Stores & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Top Stores Bar Chart */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Store className="w-4 h-4 text-sky-400" />
              <span>Top Stores Performance</span>
            </h3>
            <span className="text-xs text-slate-400">Latest MTD ({dashData?.latestDate})</span>
          </div>

          <div className="h-64 w-full pt-2">
            {dashData?.topStores && dashData.topStores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashData.topStores} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#64748b" fontSize={10} tickFormatter={(v) => `฿${(v/1e3).toFixed(0)}k`} />
                  <YAxis dataKey="store_name" type="category" stroke="#94a3b8" fontSize={10} width={130} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                    formatter={(val: any) => [`฿${Number(val).toLocaleString()}`, 'Sales']}
                  />
                  <Bar dataKey="total_sales" radius={[0, 8, 8, 0]}>
                    {dashData.topStores.map((_: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No store data.
              </div>
            )}
          </div>
        </div>

        {/* Top Items Table */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center space-x-2">
              <Package className="w-4 h-4 text-sky-400" />
              <span>Top Selling Products</span>
            </h3>
            <span className="text-xs text-slate-400">Latest MTD ({dashData?.latestDate})</span>
          </div>

          <div className="overflow-x-auto max-h-64">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                  <th className="py-2.5 px-3">Item Code</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-3 text-right">Total Sales</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {dashData?.topProducts && dashData.topProducts.length > 0 ? (
                  dashData.topProducts.map((p: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-900/40">
                      <td className="py-2 px-3 font-mono text-sky-400">{p.product_code}</td>
                      <td className="py-2 px-3 text-slate-200 truncate max-w-xs" title={p.product_name}>{p.product_name}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-400">฿{(p.total_sales || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="py-6 text-center text-slate-500">No product data</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
