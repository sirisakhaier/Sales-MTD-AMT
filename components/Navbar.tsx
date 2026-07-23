'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Cloud, 
  BarChart3, 
  UploadCloud, 
  ShieldCheck, 
  Users, 
  Database, 
  Layers, 
  FileText, 
  ChevronDown,
  Sparkles,
  Server,
  LogIn,
  LogOut
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  const fetchUser = async (roleOverride?: string) => {
    try {
      // Check saved user session from login
      const sessionStr = localStorage.getItem('user_session');
      if (sessionStr && !roleOverride) {
        const session = JSON.parse(sessionStr);
        setCurrentUser(session);
        return;
      }

      const url = roleOverride ? `/api/auth/me?role=${roleOverride}` : '/api/auth/me';
      const res = await fetch(url);
      const data = await res.json();
      setCurrentUser(data);
      if (roleOverride) {
        localStorage.setItem('user_role', roleOverride);
        router.refresh();
      }
    } catch (e) {
      console.error('Auth error', e);
    }
  };

  useEffect(() => {
    const savedRole = localStorage.getItem('user_role');
    fetchUser(savedRole || undefined);
  }, [pathname]);

  const handleRoleChange = (role: string) => {
    localStorage.removeItem('user_session');
    fetchUser(role);
    setShowRoleDropdown(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('user_session');
    localStorage.removeItem('user_role');
    setCurrentUser(null);
    router.push('/login');
  };

  const roleColors: Record<string, string> = {
    ADMIN: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
    MANAGER: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    VIEWER: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link href="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-sky-500/20 group-hover:scale-105 transition-transform">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-bold bg-gradient-to-r from-white via-slate-200 to-sky-400 bg-clip-text text-transparent">
                  Sales MTD System
                </span>
                <div className="flex items-center space-x-1.5 text-[10px] text-sky-400 font-mono">
                  <Server className="w-3 h-3" />
                  <span>Cloudflare Workers + D1 + R2</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <Link 
              href="/" 
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/' 
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload & Snapshots</span>
            </Link>

            <Link 
              href="/dashboard" 
              className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/dashboard' 
                  ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Analytics & Trends</span>
            </Link>

            {/* Admin Menu (Allowed for ADMIN role) */}
            {currentUser?.role === 'ADMIN' && (
              <div className="relative group">
                <button className={`flex items-center space-x-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname.startsWith('/admin') 
                    ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Admin Portal</span>
                  <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>

                <div className="absolute right-0 mt-1 w-48 rounded-xl glass-card border border-slate-800 shadow-2xl py-1 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                  <Link href="/admin/users" className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Users className="w-4 h-4 text-sky-400" />
                    <span>User Management</span>
                  </Link>
                  <Link href="/admin/sales-data" className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Database className="w-4 h-4 text-sky-400" />
                    <span>Sales Data Records</span>
                  </Link>
                  <Link href="/admin/snapshots" className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white">
                    <Layers className="w-4 h-4 text-sky-400" />
                    <span>Snapshot Management</span>
                  </Link>
                  <Link href="/admin/audit-logs" className="flex items-center space-x-2 px-4 py-2 text-xs text-slate-300 hover:bg-slate-800 hover:text-white">
                    <FileText className="w-4 h-4 text-sky-400" />
                    <span>System Audit Logs</span>
                  </Link>
                </div>
              </div>
            )}
          </nav>

          {/* User Profile & Role Switcher */}
          <div className="flex items-center space-x-2">
            
            <div className="relative">
              <button 
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center space-x-2.5 px-3 py-1.5 rounded-xl glass-card hover:bg-slate-800/80 transition-colors border border-slate-800"
              >
                <div className="text-right">
                  <div className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {currentUser?.username || currentUser?.full_name || 'User'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                    {currentUser?.email || ''}
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${roleColors[currentUser?.role || 'ADMIN']}`}>
                  {currentUser?.role || 'ADMIN'}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {showRoleDropdown && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl glass-card border border-slate-800 shadow-2xl p-2 z-50">
                  <div className="px-3 py-2 border-b border-slate-800 text-[11px] font-medium text-slate-400 flex items-center justify-between">
                    <span>Quick Testing Role</span>
                    <Sparkles className="w-3 h-3 text-sky-400" />
                  </div>

                  <button 
                    onClick={() => handleRoleChange('ADMIN')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between mt-1 ${
                      currentUser?.role === 'ADMIN' ? 'bg-rose-500/10 text-rose-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div>ADMIN</div>
                      <div className="text-[10px] text-slate-400 font-normal">admin / admin123</div>
                    </div>
                    {currentUser?.role === 'ADMIN' && <span className="text-rose-400">✓</span>}
                  </button>

                  <button 
                    onClick={() => handleRoleChange('MANAGER')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      currentUser?.role === 'MANAGER' ? 'bg-amber-500/10 text-amber-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div>MANAGER</div>
                      <div className="text-[10px] text-slate-400 font-normal">manager / manager123</div>
                    </div>
                    {currentUser?.role === 'MANAGER' && <span className="text-amber-400">✓</span>}
                  </button>

                  <button 
                    onClick={() => handleRoleChange('VIEWER')}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs flex items-center justify-between ${
                      currentUser?.role === 'VIEWER' ? 'bg-emerald-500/10 text-emerald-400 font-semibold' : 'text-slate-300 hover:bg-slate-800/60'
                    }`}
                  >
                    <div>
                      <div>VIEWER</div>
                      <div className="text-[10px] text-slate-400 font-normal">viewer / viewer123</div>
                    </div>
                    {currentUser?.role === 'VIEWER' && <span className="text-emerald-400">✓</span>}
                  </button>

                  <div className="border-t border-slate-800 mt-2 pt-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold text-rose-400 hover:bg-rose-500/10 flex items-center space-x-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Link 
              href="/login" 
              className="p-2 rounded-xl glass-card text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Sign In"
            >
              <LogIn className="w-4 h-4" />
            </Link>

          </div>

        </div>
      </div>
    </header>
  );
}
