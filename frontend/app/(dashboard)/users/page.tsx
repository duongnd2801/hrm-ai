'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import DraggableModal from '@/components/DraggableModal';
import Toast, { ToastState } from '@/components/Toast';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | string;
  fullName?: string;
  createdAt: string;
  isActive: boolean;
}

type ActionType = 'reset' | 'delete' | null;

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [newRole, setNewRole] = useState<User['role']>('EMPLOYEE');
  const [actionType, setActionType] = useState<ActionType>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [globalStats, setGlobalStats] = useState({ total: 0, admins: 0, managers: 0, employees: 0 });

  useEffect(() => {
    void fetchUsers();
    void fetchStats();
  }, [page]);

  const fetchStats = async () => {
    try {
      const res = await api.get('/api/users/stats');
      setGlobalStats(res.data);
    } catch (err) {
      console.error('Failed to fetch user stats');
    }
  };

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });
  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      if (typeof data === 'string') return data;
      if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
    return fallback;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users', {
        params: { page, size: 10 },
      });
      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Kh�ng th? t?i danh s�ch t�i kho?n.'));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      await fetchUsers();
      return;
    }
    setLoading(true);
    try {
      const response = await api.get('/api/users/search', {
        params: { email: searchEmail.trim(), page: 0, size: 10 },
      });
      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setPage(0);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'T�m ki?m th?t b?i.'));
    } finally {
      setLoading(false);
    }
  };

  const openRoleModal = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser) return;
    setSubmitting(true);
    try {
      await api.put(`/api/users/${selectedUser.id}/role`, { role: newRole });
      pushToast('success', `Đã cập nhật quyền cho ${selectedUser.email}.`);
      closeRoleModal();
      await fetchUsers();
      await fetchStats();
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Kh�ng th? c?p nh?t quy?n.'));
    } finally {
      setSubmitting(false);
    }
  };

  const openActionConfirm = (type: ActionType, user: User) => {
    setActionType(type);
    setTargetUser(user);
  };

  const closeActionConfirm = () => {
    setActionType(null);
    setTargetUser(null);
  };

  const handleConfirmAction = async () => {
    if (!actionType || !targetUser) return;
    setSubmitting(true);
    try {
      if (actionType === 'reset') {
        await api.post(`/api/users/${targetUser.id}/reset-password`);
        pushToast('success', `Đã reset mật khẩu cho ${targetUser.email}.`);
      }
      if (actionType === 'delete') {
        await api.delete(`/api/users/${targetUser.id}`);
        pushToast('success', `Đã xóa tài khoản ${targetUser.email}.`);
      }
      closeActionConfirm();
      await fetchUsers();
      await fetchStats();
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Thao t�c th?t b?i.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20';
      case 'HR': return 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/20';
      case 'MANAGER': return 'bg-violet-500/10 text-violet-700 dark:text-violet-300 border-violet-500/20';
      default: return 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20';
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-indigo-500', 'bg-emerald-500', 'bg-rose-500', 'bg-amber-500', 
      'bg-sky-500', 'bg-violet-500', 'bg-fuchsia-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 3);
  };


  return (
    <div className="space-y-12">
      <Toast toast={toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

      {/* Main Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
        <div>
          <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>QUẢN LÝ USER</h1>
          <p className="text-lg font-bold text-white dark:text-white/40 uppercase tracking-widest mt-6 ml-1" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>QUẢN TRỊ TÀI KHOẢN & PHÂN QUYỀN</p>
        </div>
      </div>

      {/* Stats Quick View Cards */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
         <StatCard icon="🔑" label="Quyền Quản trị" value={globalStats.admins} desc="Admin & HR" color="rose" />
         <StatCard icon="👔" label="Quản lý" value={globalStats.managers} desc="Team Managers" color="violet" />
         <StatCard icon="👤" label="Nhân viên" value={globalStats.employees} desc="Standard accounts" color="emerald" />
      </div>

      {/* Main Content Card */}
      <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
           <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest px-1 text-center md:text-left">Danh sách tài khoản hệ thống</h2>
              <p className="text-xs font-medium text-slate-500 dark:text-white/40 mt-1 px-1">Tìm thấy {users.length} tài khoản trong trang này</p>
           </div>
           
           <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative group w-full sm:w-80">
                 <input 
                    type="text" 
                    placeholder="Tìm email..." 
                    value={searchEmail} 
                    onChange={(e) => setSearchEmail(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 px-6 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-slate-900/10 dark:focus:bg-white/10 transition-all shadow-inner" 
                 />
                 <svg onClick={handleSearch} className="absolute right-4 top-3 w-5 h-5 text-slate-400 dark:text-white/20 cursor-pointer hover:text-indigo-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
              </div>
              <button 
                onClick={() => { setSearchEmail(''); setPage(0); fetchUsers(); }}
                className="p-3 bg-white/50 dark:bg-white/5 text-slate-500 dark:text-white/30 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-2xl transition-all border border-black/5 dark:border-white/5 active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              </button>
           </div>
        </div>

        <div className="overflow-x-auto rounded-3xl border border-black/5 dark:border-white/10">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-100/50 dark:bg-white/5 text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-white/40">
                <th className="px-8 py-5 text-left font-black">Người dùng</th>
                <th className="px-6 py-5 text-left font-black">Email & ID</th>
                <th className="px-6 py-5 text-left font-black">Quyền hạn</th>
                <th className="px-6 py-5 text-left font-black">Ngày tạo</th>
                <th className="px-8 py-5 text-right font-black">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5 bg-transparent">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 dark:text-white/20 font-black uppercase tracking-widest animate-pulse">Đang tải dữ liệu...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-slate-400 dark:text-white/20 font-black uppercase tracking-widest italic">Không tìm thấy tài khoản nào</td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-900/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl ${getAvatarColor(user.fullName || user.email)} flex items-center justify-center text-white font-black text-sm shadow-lg group-hover:scale-110 transition-transform duration-300 ring-4 ring-white/50 dark:ring-white/5`}>
                          {getInitials(user.fullName || user.email)}
                        </div>
                        <div>
                          <p className="font-black text-slate-900 dark:text-white text-base leading-tight uppercase tracking-tight">{user.fullName || 'Chưa cập nhật tên'}</p>
                          <p className="text-[10px] font-bold text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mt-1">ID: {user.id.substring(0, 8).toUpperCase()}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-slate-600 dark:text-white/70">{user.email}</p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-white/20 mt-1 italic">Tài khoản nhân viên</p>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-xl text-[10px] font-black tracking-widest border ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <p className="font-bold text-slate-700 dark:text-white/60">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                      <p className="text-[10px] font-medium text-slate-400 dark:text-white/20 mt-1 tracking-wider uppercase">{new Date(user.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</p>
                    </td>
                    <td className="px-8 py-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => openRoleModal(user)}
                          title="Đổi quyền"
                          className="p-3 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all border border-indigo-500/20 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>
                        </button>
                        <button 
                          onClick={() => openActionConfirm('reset', user)}
                          title="Reset mật khẩu"
                          className="p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-600 hover:text-white rounded-2xl transition-all border border-amber-500/20 active:scale-95"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" /></svg>
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button 
                            onClick={() => openActionConfirm('delete', user)}
                            title="Xóa tài khoản"
                            className="p-3 bg-rose-500/10 text-rose-600 dark:text-rose-400 hover:bg-rose-600 hover:text-white rounded-2xl transition-all border border-rose-500/20 active:scale-95"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" /></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-10 flex items-center justify-between">
            <p className="text-xs font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Trang {page + 1} / {totalPages}</p>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-6 py-2.5 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 disabled:opacity-30 transition-all disabled:pointer-events-none active:scale-95"
              >
                Trước
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-6 py-2.5 bg-white/50 dark:bg-white/5 border border-black/5 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/40 hover:bg-indigo-600 hover:text-white hover:border-indigo-600 disabled:opacity-30 transition-all disabled:pointer-events-none active:scale-95"
              >
                Sau
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showRoleModal && selectedUser && (
        <DraggableModal title="Đổi quyền tài khoản" onClose={closeRoleModal} widthClassName="max-w-lg">
          <div className="space-y-6 pt-4">
            <div className="flex items-center gap-4 bg-slate-900/5 dark:bg-white/5 p-4 rounded-3xl border border-black/5 dark:border-white/5">
                <div className={`w-14 h-14 rounded-2xl ${getAvatarColor(selectedUser.fullName || selectedUser.email)} flex items-center justify-center text-white font-black text-xl shadow-xl`}>
                  {getInitials(selectedUser.fullName || selectedUser.email)}
                </div>
                <div>
                   <p className="text-xs font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Tài khoản</p>
                   <p className="text-lg font-black text-slate-900 dark:text-white leading-tight mt-1">{selectedUser.fullName || selectedUser.email}</p>
                </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-3 px-1">Chọn quyền hạn mới</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/10 px-5 py-4 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15 transition-all appearance-none"
                style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%236366f1\' stroke-width=\'3\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' d=\'M19.5 8.25l-7.5 7.5-7.5-7.5\' /%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1.25rem center', backgroundSize: '1rem' }}
              >
                <option value="ADMIN">ADMIN (Quản trị tối cao)</option>
                <option value="HR">HR (Quản lý nhân sự)</option>
                <option value="MANAGER">MANAGER (Quản lý đội nhóm)</option>
                <option value="EMPLOYEE">EMPLOYEE (Nhân viên)</option>
              </select>
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <button onClick={closeRoleModal} className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all">Hủy</button>
              <button onClick={handleUpdateRole} disabled={submitting} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 shadow-lg shadow-indigo-600/30 active:scale-95">{submitting ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN CẬP NHẬT'}</button>
            </div>
          </div>
        </DraggableModal>
      )}

      {actionType && targetUser && (
        <DraggableModal title={actionType === 'reset' ? 'Reset mật khẩu' : 'Xóa tài khoản'} onClose={closeActionConfirm} widthClassName="max-w-md">
          <div className="space-y-6 pt-4 text-center">
            <div className={`w-20 h-20 mx-auto rounded-3xl ${actionType === 'reset' ? 'bg-amber-500/20 text-amber-500' : 'bg-rose-500/20 text-rose-500'} flex items-center justify-center text-3xl shadow-inner`}>
              {actionType === 'reset' ? '🔑' : '⚠️'}
            </div>
            <div>
               <p className="text-xl font-black text-slate-900 dark:text-white leading-tight uppercase tracking-tight px-4">
                 {actionType === 'reset' ? 'Khôi phục mật khẩu mặc định?' : 'Xác nhận xóa vĩnh viễn?'}
               </p>
               <p className="mt-4 text-sm font-semibold text-slate-500 dark:text-white/60 leading-relaxed px-4">
                 {actionType === 'reset' ? (
                   <>Bạn đang thực hiện đặt lại mật khẩu cho <span className="font-black text-slate-900 dark:text-white underline decoration-amber-500/50 decoration-4">{targetUser.email}</span> về mặc định <span className="font-black text-amber-600 dark:text-amber-400">Emp@123</span>.</>
                 ) : (
                   <>Tài khoản <span className="font-black text-slate-900 dark:text-white underline decoration-rose-500/50 decoration-4">{targetUser.email}</span> sẽ bị gỡ bỏ khỏi hệ thống. Thao tác này không thể thu hồi.</>
                 )}
               </p>
            </div>
            <div className="flex justify-center gap-3 pt-2">
              <button onClick={closeActionConfirm} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all">Không, đóng</button>
              <button 
                onClick={handleConfirmAction} 
                disabled={submitting} 
                className={`px-10 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-xl active:scale-95 ${actionType === 'reset' ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30' : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'}`}
              >
                {submitting ? 'ĐANG CHẠY...' : 'TÔI ĐỒNG Ý'}
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
    </div>
  );
}

function StatCard({ icon, label, value, desc, color }: { icon: string, label: string, value: number, desc: string, color: string }) {
  const colorMap: Record<string, string> = {
    rose: 'from-rose-500 via-red-500 to-orange-500 border-rose-500/20 shadow-rose-500/20 text-rose-600 dark:text-rose-400 dark:via-rose-500/10 dark:to-red-500/10',
    violet: 'from-violet-500 via-purple-500 to-fuchsia-500 border-violet-500/20 shadow-violet-500/20 text-violet-600 dark:text-violet-400 dark:via-violet-500/10 dark:to-purple-500/10',
    emerald: 'from-emerald-500 via-teal-500 to-cyan-500 border-emerald-500/20 shadow-emerald-500/20 text-emerald-600 dark:text-emerald-400 dark:via-emerald-500/10 dark:to-teal-500/10'
  };

  const bgClasses = colorMap[color] || colorMap.emerald;

  return (
    <div className="relative group min-w-[320px] rounded-[40px] overflow-hidden transition-all duration-500 hover:-translate-y-2">
      <div className={`absolute inset-0 bg-gradient-to-br ${bgClasses} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
      <div className="relative bg-gradient-to-br from-white/90 via-white/70 to-slate-50 dark:from-white/10 dark:via-slate-500/5 dark:to-slate-800/10 backdrop-blur-2xl border border-white/40 dark:border-white/5 p-8 shadow-xl dark:shadow-2xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.2em] mb-4">{label}</p>
              <h3 className="text-5xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{value}</h3>
            </div>
            <div className={`w-16 h-16 rounded-[24px] bg-gradient-to-br ${bgClasses.split(' border')[0]} flex items-center justify-center text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
              <span className="filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-black/5 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.25em]">{desc}</p>
          </div>
      </div>
    </div>
  );
}

