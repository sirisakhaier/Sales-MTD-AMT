'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Shield, Trash2, Edit3, KeyRound, CheckCircle2, AlertCircle } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Add / Edit Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any | null>(null);

  // Password Modal state
  const [showPassModal, setShowPassModal] = useState(false);
  const [passUser, setPassUser] = useState<any | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // Form Fields
  const [usernameVal, setUsernameVal] = useState('');
  const [emailVal, setEmailVal] = useState('');
  const [nameVal, setNameVal] = useState('');
  const [roleVal, setRoleVal] = useState('MANAGER');
  const [passwordVal, setPasswordVal] = useState('');
  const [activeVal, setActiveVal] = useState(true);

  const [msg, setMsg] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/users');
      const data = await res.json();
      setUsers(data.users || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAddModal = () => {
    setEditingUser(null);
    setUsernameVal('');
    setEmailVal('');
    setNameVal('');
    setRoleVal('MANAGER');
    setPasswordVal('');
    setActiveVal(true);
    setShowModal(true);
  };

  const handleOpenEditModal = (user: any) => {
    setEditingUser(user);
    setUsernameVal(user.username || '');
    setEmailVal(user.email || '');
    setNameVal(user.full_name || '');
    setRoleVal(user.role || 'MANAGER');
    setPasswordVal('');
    setActiveVal(user.is_active === 1);
    setShowModal(true);
  };

  const handleOpenPassModal = (user: any) => {
    setPassUser(user);
    setNewPasswordVal('');
    setShowPassModal(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);

    const payload: any = {
      username: usernameVal,
      email: emailVal,
      full_name: nameVal,
      role: roleVal,
      is_active: activeVal
    };

    if (passwordVal.trim().length > 0) {
      payload.password = passwordVal;
    }

    try {
      let res;
      if (editingUser) {
        payload.id = editingUser.id;
        res = await fetch('/api/admin/users', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        if (!passwordVal) {
          alert('Password is required for new users.');
          return;
        }
        res = await fetch('/api/admin/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save user');

      setMsg(editingUser ? `User ${usernameVal} updated successfully.` : `User ${usernameVal} created successfully.`);
      setShowModal(false);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passUser || !newPasswordVal) return;

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: passUser.id,
          newPassword: newPasswordVal,
          adminChange: true,
          adminEmail: 'admin@makro.co.th'
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Password update failed');

      setMsg(`Password for user ${passUser.username} updated successfully.`);
      setShowPassModal(false);
      setNewPasswordVal('');
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleDeleteUser = async (id: string, username: string) => {
    if (!confirm(`Are you sure you want to delete user ${username}?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${id}&adminEmail=admin@makro.co.th`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMsg(`User ${username} deleted.`);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass-card p-6 rounded-3xl border border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center space-x-2">
            <Users className="w-6 h-6 text-sky-400" />
            <span>Admin User Management</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Create, edit, reset passwords, and manage system access permissions for all users.
          </p>
        </div>
        
        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-lg shadow-sky-500/20"
        >
          <UserPlus className="w-4 h-4" />
          <span>Create New User</span>
        </button>
      </div>

      {msg && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center justify-between">
          <span>{msg}</span>
          <button onClick={() => setMsg(null)} className="text-slate-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Users Table */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase">
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Full Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Login</th>
                <th className="py-3 px-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id} className="hover:bg-slate-900/40">
                  <td className="py-3 px-4 font-mono font-bold text-sky-400">{u.username || 'N/A'}</td>
                  <td className="py-3 px-4 font-semibold text-white">{u.full_name || '-'}</td>
                  <td className="py-3 px-4 text-slate-300 font-mono text-[11px]">{u.email}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.role === 'ADMIN' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      u.role === 'MANAGER' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}>
                      {u.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      u.is_active === 1 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                    }`}>
                      {u.is_active === 1 ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-400 text-[11px]">
                    {u.last_login_at ? new Date(u.last_login_at).toLocaleString() : 'Never'}
                  </td>
                  <td className="py-3 px-4 text-center space-x-1">
                    <button 
                      onClick={() => handleOpenEditModal(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-sky-400 hover:bg-sky-500/10"
                      title="Edit User"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleOpenPassModal(u)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                      title="Change Password"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>

                    <button 
                      onClick={() => handleDeleteUser(u.id, u.username || u.email)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                      title="Delete User"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit User Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 max-w-md w-full space-y-4">
            <h3 className="text-lg font-bold text-white">
              {editingUser ? `Edit User: ${editingUser.username}` : 'Create New System User'}
            </h3>
            
            <form onSubmit={handleSaveUser} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium">Username</label>
                <input 
                  type="text" 
                  value={usernameVal} 
                  onChange={e => setUsernameVal(e.target.value)}
                  placeholder="john_doe"
                  className="w-full mt-1 bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Full Name</label>
                <input 
                  type="text" 
                  value={nameVal} 
                  onChange={e => setNameVal(e.target.value)}
                  placeholder="John Doe"
                  className="w-full mt-1 bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Email Address</label>
                <input 
                  type="email" 
                  value={emailVal} 
                  onChange={e => setEmailVal(e.target.value)}
                  placeholder="john@makro.co.th"
                  className="w-full mt-1 bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">Role</label>
                <select 
                  value={roleVal} 
                  onChange={e => setRoleVal(e.target.value)}
                  className="w-full mt-1 bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                >
                  <option value="ADMIN">ADMIN (Full Access)</option>
                  <option value="MANAGER">MANAGER (Upload & View)</option>
                  <option value="VIEWER">VIEWER (Read-Only)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium">
                  {editingUser ? 'New Password (leave blank to keep current)' : 'Password'}
                </label>
                <input 
                  type="password" 
                  value={passwordVal} 
                  onChange={e => setPasswordVal(e.target.value)}
                  placeholder="••••••••"
                  className="w-full mt-1 bg-slate-900 text-white text-xs px-3 py-2 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                  required={!editingUser}
                />
              </div>

              {editingUser && (
                <div className="flex items-center space-x-2 pt-1">
                  <input 
                    type="checkbox"
                    id="activeCheck"
                    checked={activeVal}
                    onChange={e => setActiveVal(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-800 text-sky-500"
                  />
                  <label htmlFor="activeCheck" className="text-xs text-slate-300">Active Account</label>
                </div>
              )}

              <div className="flex items-center justify-end space-x-2 pt-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white rounded-xl"
                >
                  {editingUser ? 'Save Changes' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {showPassModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-card p-6 rounded-3xl border border-slate-800 max-w-sm w-full space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center space-x-2">
              <KeyRound className="w-5 h-5 text-amber-400" />
              <span>Change Password</span>
            </h3>
            <p className="text-xs text-slate-400">
              Set new password for user <strong className="text-white">{passUser?.username}</strong> ({passUser?.email}).
            </p>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-semibold">New Password</label>
                <input 
                  type="password" 
                  value={newPasswordVal}
                  onChange={e => setNewPasswordVal(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full mt-1 bg-slate-900 text-white text-xs px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500"
                  required
                />
              </div>

              <div className="flex items-center justify-end space-x-2">
                <button 
                  type="button" 
                  onClick={() => setShowPassModal(false)}
                  className="px-4 py-2 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
