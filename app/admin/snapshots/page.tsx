'use client';

import React, { useState, useEffect } from 'react';
import { Layers, Trash2, RefreshCw, FileText, CheckCircle2, AlertTriangle, Calendar } from 'lucide-react';

export default function AdminSnapshotsPage() {
  const [snapshots, setSnapshots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [msg, setMsg] = useState<string | null>(null);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/snapshots?month=${selectedMonth}`);
      const data = await res.json();
      setSnapshots(data.snapshots || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSnapshots();
  }, [selectedMonth]);

  const handleDeleteSnapshot = async (id: string, mtdDate: string, filename: string) => {
    if (!confirm(`Are you sure you want to delete MTD Snapshot for ${mtdDate} (${filename})?\n\nThis will remove this snapshot's records without affecting other snapshot dates!`)) return;

    try {
      const res = await fetch(`/api/snapshots/${id}?userEmail=admin@makro.co.th`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(`Snapshot ${mtdDate} deleted successfully.`);
      fetchSnapshots();
    } catch (err: any) {
      alert(err.message || 'Failed to delete snapshot');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Layers className="w-6 h-6 text-sky-400" />
            <span>Admin MTD Snapshot Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Manage individual historical MTD snapshots. Deleting a snapshot removes only that date's dataset.
          </p>
        </div>

        <div className="flex items-center space-x-3 glass-card p-2 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 font-medium ml-2">Sales Month:</span>
          <select 
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-slate-900 text-white font-bold text-sm px-3 py-1.5 rounded-xl border border-slate-700 focus:outline-none cursor-pointer"
          >
            <option value="2026-06">2026-06 (June 2026)</option>
            <option value="2026-07">2026-07 (July 2026)</option>
            <option value="2026-08">2026-08 (August 2026)</option>
            <option value="2026-05">2026-05 (May 2026)</option>
          </select>
        </div>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Snapshots List */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">Sales Month</th>
                <th className="py-3 px-4">MTD Report Date</th>
                <th className="py-3 px-4">Source Filename</th>
                <th className="py-3 px-4 text-right">Records</th>
                <th className="py-3 px-4 text-right">Total Revenue</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading snapshots...</td>
                </tr>
              ) : snapshots.length > 0 ? (
                snapshots.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-900/40">
                    <td className="py-3.5 px-4 font-mono text-slate-300">{s.sales_month}</td>
                    <td className="py-3.5 px-4 font-bold text-sky-400 flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.mtd_report_date}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200 truncate max-w-xs" title={s.source_filename}>
                      {s.source_filename}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-400">
                      {(s.records || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-white">
                      ฿{(s.total_sales_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleDeleteSnapshot(s.id, s.mtd_report_date, s.source_filename)}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Snapshot</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    No active snapshots for {selectedMonth}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
