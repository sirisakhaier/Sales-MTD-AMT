'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Calendar, 
  UploadCloud, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileCheck, 
  Database, 
  Layers, 
  ArrowRight,
  RefreshCw,
  HardDrive,
  Filter
} from 'lucide-react';

export default function LandingPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-06');
  const [monthData, setMonthData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const [uploadResults, setUploadResults] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>('ADMIN');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchMonthSummary = async (month: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/sales-months?month=${month}`);
      const data = await res.json();
      setMonthData(data);
    } catch (e: any) {
      setErrorMsg('Failed to load month metadata.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthSummary(selectedMonth);
    const role = localStorage.getItem('user_role') || 'ADMIN';
    setUserRole(role);
  }, [selectedMonth]);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (userRole === 'VIEWER') return;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(Array.from(e.target.files));
    }
  };

  const handleFiles = async (files: File[]) => {
    if (userRole === 'VIEWER') {
      alert('VIEWER role cannot upload files.');
      return;
    }

    setUploading(true);
    setUploadResults(null);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append('salesMonth', selectedMonth);
    formData.append('userEmail', 'admin@makro.co.th');
    files.forEach(f => formData.append('files', f));

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Upload failed');
      }

      setUploadResults(data);
      fetchMonthSummary(selectedMonth);
    } catch (err: any) {
      setErrorMsg(err.message || 'File upload error');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-8">
      
      {/* Top Banner / Month Selection Header */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl -z-10 pointer-events-none" />
        
        <div>
          <div className="flex items-center space-x-2 text-xs font-semibold text-sky-400 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Sales Month Selection</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Sales MTD Data Management
          </h1>
          <p className="text-sm text-slate-400 mt-1 max-w-xl">
            Upload wide-format monthly MTD reports. Each upload is appended as an independent historical snapshot in Cloudflare D1.
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

      {/* Month Status Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">MTD Snapshots</span>
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-white">
            {loading ? '...' : monthData?.totalSnapshots || 0}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Historical snapshot files
          </div>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Latest MTD Date</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-bold text-white truncate">
            {loading ? '...' : monthData?.latestMtdDate || 'No Data'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Extracted date from report
          </div>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Latest Source File</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xs font-mono font-medium text-white truncate" title={monthData?.latestFilename}>
            {loading ? '...' : monthData?.latestFilename || 'None Uploaded'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Preserved in Cloudflare R2
          </div>
        </div>

        <div className="glass-card glass-card-hover p-5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Unpivoted Records</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-400">
            {loading ? '...' : (monthData?.totalRecords || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Stored in Cloudflare D1
          </div>
        </div>

      </div>

      {/* File Upload Module */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <UploadCloud className="w-5 h-5 text-sky-400" />
              <span>Upload MTD Report Files</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Supports .xls, .xlsx, .csv. Dynamic month column detection and automated unpivoting engine.
            </p>
          </div>
          {userRole === 'VIEWER' && (
            <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
              Read-Only Mode (Viewer)
            </span>
          )}
        </div>

        {/* Drag and Drop Zone */}
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleFileDrop}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            userRole === 'VIEWER' 
              ? 'border-slate-800 bg-slate-900/30 opacity-60 cursor-not-allowed'
              : uploading
                ? 'border-sky-500 bg-sky-500/5 animate-pulse'
                : 'border-slate-700 hover:border-sky-500/60 hover:bg-slate-900/50 cursor-pointer'
          }`}
          onClick={() => {
            if (userRole !== 'VIEWER' && !uploading && fileInputRef.current) {
              fileInputRef.current.click();
            }
          }}
        >
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileInputChange}
            multiple 
            accept=".xls,.xlsx,.csv"
            className="hidden" 
          />

          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500/20 to-cyan-500/20 flex items-center justify-center border border-sky-500/30 text-sky-400 shadow-lg">
              {uploading ? (
                <RefreshCw className="w-7 h-7 animate-spin text-sky-400" />
              ) : (
                <FileSpreadsheet className="w-7 h-7" />
              )}
            </div>

            {uploading ? (
              <div>
                <p className="text-sm font-semibold text-sky-400">Processing & Unpivoting MTD Files...</p>
                <p className="text-xs text-slate-400 mt-1">Calculating SHA-256 hash, detecting month columns, appending to D1 & R2...</p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white">
                  Drag & Drop Sales MTD files here, or <span className="text-sky-400 underline">browse</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Example: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-sky-300">Sales MTD 20260621.xls</code>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Upload Status / Feedback Alert */}
        {errorMsg && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {uploadResults && (
          <div className="p-5 rounded-2xl glass-card border border-emerald-500/30 bg-emerald-500/5 space-y-3">
            <div className="flex items-center justify-between text-emerald-400 font-semibold text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5" />
                <span>Import Batch Completed ({uploadResults.newRecords.toLocaleString()} new records added)</span>
              </div>
              <span className="text-xs font-mono text-slate-400">Batch ID: {uploadResults.batchId}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Target Month:</span> <strong className="text-white">{uploadResults.salesMonth}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Duplicate Files:</span> <strong className="text-amber-400">{uploadResults.duplicateRecords}</strong>
              </div>
              <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                <span className="text-slate-400">Error Records:</span> <strong className="text-rose-400">{uploadResults.errorRecords}</strong>
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              {uploadResults.fileResults?.map((fr: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-slate-900/40">
                  <span className="font-mono text-slate-300 truncate max-w-sm">{fr.filename}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    fr.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                  }`}>
                    {fr.status} ({fr.records?.toLocaleString() || 0} recs)
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Snapshot History Section */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center space-x-2">
              <Layers className="w-5 h-5 text-sky-400" />
              <span>Historical MTD Snapshots ({selectedMonth})</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Each snapshot is independently stored. Deleting one date does not impact other historical dates.
            </p>
          </div>
          
          <button 
            onClick={() => fetchMonthSummary(selectedMonth)}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl glass-card hover:bg-slate-800"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {/* Snapshot Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">MTD Date</th>
                <th className="py-3 px-4">Source Filename</th>
                <th className="py-3 px-4 text-right">Selected Month Records</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Uploaded At</th>
                <th className="py-3 px-4 text-center">R2 Storage Key</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {monthData?.snapshots && monthData.snapshots.length > 0 ? (
                monthData.snapshots.map((s: any) => (
                  <tr key={s.id} className="hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-sky-400 flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{s.mtd_report_date}</span>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-200 truncate max-w-xs" title={s.source_filename}>
                      {s.source_filename}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold text-emerald-400">
                      {(s.record_count || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        <FileCheck className="w-3 h-3" />
                        <span>{s.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-400">
                      {new Date(s.created_at).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono text-[10px] text-slate-400 truncate max-w-[150px]" title={s.r2_object_key}>
                      <span className="flex items-center justify-center space-x-1">
                        <HardDrive className="w-3 h-3 text-slate-500" />
                        <span>{s.r2_object_key || 'Stored'}</span>
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No snapshots uploaded for {selectedMonth} yet. Drag and drop sample files above to test!
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
