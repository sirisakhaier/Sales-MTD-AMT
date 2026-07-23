'use client';

import React, { useState, useEffect } from 'react';
import { Database, Search, Filter, Trash2, Download, ChevronLeft, ChevronRight, MapPin, Tag } from 'lucide-react';

export default function AdminSalesDataPage() {
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('2026-06');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);

  const fetchSalesData = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams({
        page: String(page),
        limit: '50',
        salesMonth: selectedMonth,
        search
      });
      const res = await fetch(`/api/admin/sales-data?${queryParams}`);
      const data = await res.json();
      setRecords(data.records || []);
      setTotalPages(data.totalPages || 1);
      setTotalRecords(data.total || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSalesData();
  }, [page, selectedMonth, search]);

  const handleDeleteRow = async (id: string) => {
    if (!confirm('Delete this sales record?')) return;
    try {
      await fetch(`/api/admin/sales-data?id=${id}`, { method: 'DELETE' });
      fetchSalesData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportCSV = () => {
    if (!records || records.length === 0) return;
    const headers = [
      'sales_month', 'mtd_report_date', 'store_code', 'store_name', 'province', 'region',
      'product_code', 'product_name', 'model', 'chk_cat', 'sales_amount', 'source_filename'
    ];
    const csvRows = [headers.join(',')];

    records.forEach(r => {
      const row = [
        r.sales_month,
        r.mtd_report_date,
        `"${r.store_code}"`,
        `"${(r.store_name || '').replace(/"/g, '""')}"`,
        `"${(r.province || '').replace(/"/g, '""')}"`,
        `"${(r.region || '').replace(/"/g, '""')}"`,
        `"${r.product_code}"`,
        `"${(r.product_name || '').replace(/"/g, '""')}"`,
        `"${(r.model || '').replace(/"/g, '""')}"`,
        `"${(r.chk_cat || r.category || '').replace(/"/g, '""')}"`,
        r.sales_amount,
        `"${r.source_filename}"`
      ];
      csvRows.push(row.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `joined_sales_mtd_data_${selectedMonth}_page${page}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
              <Database className="w-6 h-6 text-sky-400" />
              <span>Joined Sales MTD & Dimension Explorer</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              MTD files joined with Store Dimension (<code className="text-sky-300">Location Number = STORE_ID_CUST</code>) & Model Dimension (<code className="text-sky-300">Item Number = SKU_NO</code>). Total: {totalRecords.toLocaleString()} rows.
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-slate-700"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Joined CSV</span>
          </button>
        </div>

        {/* Search & Filter */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
          <div className="relative col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input 
              type="text" 
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search store name, province, region, item code, model name..."
              className="w-full bg-slate-900 text-white text-xs pl-9 pr-4 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="flex items-center space-x-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
            <Filter className="w-4 h-4 text-sky-400" />
            <span className="text-xs text-slate-400 font-medium">Month:</span>
            <select 
              value={selectedMonth}
              onChange={e => { setSelectedMonth(e.target.value); setPage(1); }}
              className="bg-transparent text-white text-xs font-bold focus:outline-none cursor-pointer flex-1"
            >
              <option value="2026-06" className="bg-slate-900">2026-06 (June 2026)</option>
              <option value="2026-07" className="bg-slate-900">2026-07 (July 2026)</option>
              <option value="2026-08" className="bg-slate-900">2026-08 (August 2026)</option>
              <option value="2026-05" className="bg-slate-900">2026-05 (May 2026)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-3">MTD Date</th>
                <th className="py-3 px-3">Store (ID / Name)</th>
                <th className="py-3 px-3">Store Province / Region</th>
                <th className="py-3 px-3">Item (SKU / Name)</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3 text-right">Sales Amount</th>
                <th className="py-3 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading joined records...</td>
                </tr>
              ) : records.length > 0 ? (
                records.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-900/40">
                    <td className="py-2.5 px-3 font-mono text-sky-400">{r.mtd_report_date}</td>
                    
                    {/* Store Info */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-300 text-[11px]">ID: {r.store_code}</div>
                      <div className="text-white font-semibold truncate max-w-[170px]" title={r.store_name}>
                        {r.store_name}
                      </div>
                    </td>

                    {/* Store Province & Region */}
                    <td className="py-2.5 px-3">
                      <div className="text-slate-300 font-medium flex items-center space-x-1">
                        <MapPin className="w-3 h-3 text-sky-400 flex-shrink-0" />
                        <span>{r.province || 'N/A'}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{r.region || 'Region N/A'}</div>
                    </td>

                    {/* Product Info */}
                    <td className="py-2.5 px-3">
                      <div className="font-mono text-slate-300 text-[11px]">SKU: {r.product_code}</div>
                      <div className="text-slate-200 truncate max-w-xs" title={r.product_name}>
                        {r.product_name}
                      </div>
                    </td>

                    {/* Model Info */}
                    <td className="py-2.5 px-3">
                      <div className="font-semibold text-sky-300">{r.model || '-'}</div>
                      <div className="text-[10px] text-slate-500">{r.chk_cat || r.category || ''}</div>
                    </td>

                    {/* Sales Amount */}
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-400">
                      ฿{(r.sales_amount || 0).toLocaleString()}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <button 
                        onClick={() => handleDeleteRow(r.id)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Delete record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">No records found matching filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-2 text-xs text-slate-400 border-t border-slate-800">
          <div>
            Page {page} of {totalPages} ({totalRecords.toLocaleString()} total joined records)
          </div>

          <div className="flex items-center space-x-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-xl glass-card disabled:opacity-40 hover:bg-slate-800"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              disabled={page >= totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-xl glass-card disabled:opacity-40 hover:bg-slate-800"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
