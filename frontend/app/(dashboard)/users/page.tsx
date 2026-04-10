'use client';

import axios from 'axios';
import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { roleApi } from '@/lib/roleApi';
import { useSession } from '@/components/AuthProvider';
import type { RoleDTO } from '@/types';
import DraggableModal from '@/components/DraggableModal';
import Toast, { ToastState } from '@/components/Toast';
import { Key, ShieldCheck, User as UserIcon, RefreshCcw, Trash2, Search, MoreHorizontal, UserCog, ChevronLeft, ChevronRight, Eye, Calendar, Mail, Tag } from 'lucide-react';

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
  const { session } = useSession();
  const permissions = session?.permissions ?? [];
  const canViewUsers = permissions.includes('USER_VIEW');
  const canUpdateUsers = permissions.includes('USER_UPDATE');
  const canDeleteUsers = permissions.includes('USER_DELETE');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchEmail, setSearchEmail] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [newRole, setNewRole] = useState<User['role']>('EMPLOYEE');
  const [actionType, setActionType] = useState<ActionType>(null);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [globalStats, setGlobalStats] = useState({ total: 0, admins: 0, managers: 0, employees: 0 });
  const [allRoles, setAllRoles] = useState<RoleDTO[]>([]);

  useEffect(() => {
    if (!canViewUsers) return;
    void fetchUsers();
    void fetchStats();
    if (canUpdateUsers) {
      void fetchRoles();
    }
  }, [page, canViewUsers, canUpdateUsers]);

  const fetchRoles = async () => {
    try {
      const data = await roleApi.getAllRoles();
      setAllRoles(data);
    } catch (err) {
      console.error('Failed to fetch roles');
    }
  };

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
      pushToast('error', getErrorMessage(err, 'Không thể tải danh sách tài khoản.'));
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
      pushToast('error', getErrorMessage(err, 'Tìm kiếm thất bại.'));
    } finally {
      setLoading(false);
    }
  };

  const openRoleModal = (user: User) => {
    if (!canUpdateUsers) return;
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const closeRoleModal = () => {
    setShowRoleModal(false);
    setSelectedUser(null);
  };

  const handleUpdateRole = async () => {
    if (!selectedUser || !canUpdateUsers) return;
    setSubmitting(true);
    try {
      await api.put(`/api/users/${selectedUser.id}/role`, { role: newRole });
      pushToast('success', `Đã cập nhật quyền cho ${selectedUser.email}.`);
      closeRoleModal();
      await fetchUsers();
      await fetchStats();
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Không thể cập nhật quyền.'));
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
    if (actionType === 'reset' && !canUpdateUsers) return;
    if (actionType === 'delete' && !canDeleteUsers) return;
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
      pushToast('error', getErrorMessage(err, 'Thao tác thất bại.'));
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN': return 'bg-rose-500 text-white shadow-rose-500/20';
      case 'HR': return 'bg-sky-500 text-white shadow-sky-500/20';
      case 'MANAGER': return 'bg-violet-500 text-white shadow-violet-500/20';
      default: return 'bg-slate-400 text-white shadow-slate-500/20';
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

  if (!session) return null;
  if (!canViewUsers) {
    return (
      <div className="py-20 text-center text-slate-500 dark:text-white/40 font-black uppercase tracking-widest">
        Bạn không có quyền truy cập quản lý tài khoản.
      </div>
    );
  }

  return (
    <div className="space-y-12 pb-20">
      <Toast toast={toast} onClose={() => setToast(prev => ({ ...prev, show: false }))} />

      {/* Main Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
        <div>
          <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>Quản lý TK</h1>
          <p className="text-lg font-bold text-white dark:text-white/40 uppercase tracking-widest mt-6 ml-1" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Hệ thống định danh & Phân quyền truy cập</p>
        </div>
      </div>

      {/* Stats Quick View Cards */}
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-none">
         <StatCard icon="🔑" label="Quyền Quản trị" value={globalStats.admins} desc="Admin & HR" color="rose" />
         <StatCard icon="👔" label="Quản lý" value={globalStats.managers} desc="Team Managers" color="violet" />
         <StatCard icon="👤" label="Nhân viên" value={globalStats.employees} desc="Accounts" color="emerald" />
      </div>

      {/* Main Content Card */}
      <div className="bg-white/60 dark:bg-white/5 backdrop-blur-3xl rounded-[48px] p-12 border border-black/5 dark:border-white/10 shadow-3xl overflow-hidden relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-rose-500/5 opacity-100 transition-opacity duration-700 pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-8 relative z-10">
           <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider px-1">Danh mục định danh</h2>
              <p className="text-[10px] font-black text-indigo-400 tracking-[0.2em] mt-2 ml-1 uppercase leading-none italic">Tổng quan hệ sinh thái tài khoản hệ thống</p>
           </div>
           
           <div className="flex items-center gap-4">
              <div className="relative group">
                <input 
                  type="text" 
                  placeholder="Tra cứu email..." 
                  value={searchEmail} 
                  onChange={(e) => setSearchEmail(e.target.value)} 
                  className="bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3.5 px-8 text-[11px] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white dark:focus:bg-white/10 transition-all w-72 shadow-inner font-bold uppercase tracking-widest" 
                />
                <Search className="absolute right-6 top-4 w-4 h-4 text-slate-400 dark:text-white/20 cursor-pointer hover:text-indigo-500" />
              </div>
           </div>
        </div>

        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 pb-6 bg-transparent border-none relative z-10">
          <table className="min-w-[1000px] w-full text-left border-separate border-spacing-0">
            <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/40 text-slate-600 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-8 py-6 rounded-tl-3xl">TÀI KHOẢN</th>
                <th className="px-8 py-6">EMAIL ĐĂNG NHẬP</th>
                <th className="px-8 py-6 text-center">VAI TRÒ / QUYỀN</th>
                <th className="px-8 py-6 text-center">NGÀY KHỞI TẠO</th>
                <th className="px-8 py-6 text-right pr-10 rounded-tr-3xl">TÁC VỤ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {loading ? (
                <tr><td colSpan={5} className="py-32 text-center text-slate-400 dark:text-white/15 font-black uppercase tracking-[0.5em] text-xl animate-pulse">ĐANG TẢI DỮ LIỆU...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="py-32 text-center text-slate-400 dark:text-white/15 font-black uppercase tracking-[0.5em] text-xl italic">KHÔNG TÌM THẤY TÀI KHOẢN</td></tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} className="group hover:bg-slate-900/[0.04] dark:bg-slate-900/40 dark:hover:bg-indigo-500/10 transition-all duration-300">
                    <td className="px-8 py-3.5">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-xl ${getAvatarColor(user.fullName || user.email)} flex items-center justify-center text-white font-black text-lg shadow-xl ring-2 ring-white/10 group-hover:rotate-6 transition-all duration-500`}>
                          {getInitials(user.fullName || user.email)}
                        </div>
                        <div className="relative group/name">
                          <p onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowDetailModal(true); }} className="font-black text-slate-900 dark:text-white text-[17px] leading-tight uppercase tracking-wider truncate cursor-pointer hover:text-indigo-500 transition-colors">{user.fullName || 'Chưa cập nhật tên'}</p>
                          <p className="text-[9px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1 opacity-60">ID: {user.id.substring(0, 8).toUpperCase()}</p>
                          
                          {/* Hover Info Card - Right Side Fixed */}
                          <div className="fixed z-[9999] p-7 w-72 bg-white dark:bg-slate-950 rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/15 opacity-0 invisible group-hover/name:opacity-100 group-hover/name:visible transition-all duration-300 pointer-events-none transform translate-x-10 -translate-y-1/2 mt-0 ml-10">
                            <div className="space-y-4">
                               <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                  <Mail className="w-5 h-5 text-indigo-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/80 truncate">{user.email}</span>
                               </div>
                               <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                  <ShieldCheck className="w-5 h-5 text-rose-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/80">Quyền: {user.role}</span>
                               </div>
                               <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                                  <Calendar className="w-5 h-5 text-emerald-500" />
                                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-700 dark:text-white/80">Ngày tạo: {new Date(user.createdAt).toLocaleDateString('vi-VN')}</span>
                               </div>
                            </div>
                            <div className="absolute left-[-8px] top-1/2 -translate-y-1/2 w-4 h-4 bg-white dark:bg-slate-950 rotate-45 border-l border-b border-black/5 dark:border-white/15" />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-3.5 text-[11px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest italic">{user.email}</td>
                    <td className="px-8 py-3.5 text-center">
                      <span className={`inline-flex px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-8 py-3.5 text-center">
                      <p className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{new Date(user.createdAt).toLocaleDateString('vi-VN')}</p>
                      <p className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest mt-1 opacity-60 tracking-widest">{new Date(user.createdAt).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</p>
                    </td>
                    <td className="px-8 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => { setSelectedUser(user); setNewRole(user.role); setShowDetailModal(true); }} 
                          className="w-10 h-10 flex items-center justify-center bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl shadow-xl transition-all active:scale-95 group/btn"
                          title="Quản lý tài khoản"
                        >
                          <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" strokeWidth={2.5} />
                        </button>
                        <button onClick={() => openActionConfirm('reset', user)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-500 hover:bg-amber-500 hover:text-white transition-all border border-amber-500/20 shadow-lg active:scale-90" title="Reset mật khẩu">
                          <RefreshCcw className="w-5 h-5" />
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button onClick={() => openActionConfirm('delete', user)} className="w-10 h-10 flex items-center justify-center rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-500 hover:bg-rose-500 hover:text-white transition-all border border-rose-500/20 shadow-lg active:scale-90" title="Xóa tài khoản">
                            <Trash2 className="w-5 h-5" />
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

        {/* Pagination - Premium */}
        {totalPages > 1 && (
          <div className="mt-12 pt-10 border-t border-black/5 dark:border-white/10 flex items-center justify-between">
            <div className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">
               Trang <span className="text-slate-900 dark:text-white ml-2">{page + 1} / {totalPages}</span>
            </div>
            <div className="flex gap-4">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-8 py-3 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 transition-all flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" /> TRƯỚC
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-8 py-3 bg-white/60 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-white dark:hover:bg-white/10 disabled:opacity-20 transition-all flex items-center gap-2"
              >
                SAU <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals - Standard consistency */}
      {/* Minimalist User Detail Modal */}
      {canUpdateUsers && showDetailModal && selectedUser && (
        <DraggableModal title="Phân quyền tài khoản" onClose={() => setShowDetailModal(false)} widthClassName="max-w-md">
          <div className="p-10 space-y-10">
            {/* Minimal Header */}
            <div className="flex items-center gap-6">
              <div className={`w-20 h-20 rounded-[28px] ${getAvatarColor(selectedUser.fullName || selectedUser.email)} flex items-center justify-center text-white font-black text-3xl shadow-xl shrink-0 ring-4 ring-black/5 dark:ring-white/5`}>
                {getInitials(selectedUser.fullName || selectedUser.email)}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase truncate tracking-tight">{selectedUser.fullName || 'N/A'}</h3>
                <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] truncate mt-1 italic">{selectedUser.email}</p>
              </div>
            </div>

            {/* Premium Role Selector */}
            <div className="space-y-6">
               <div className="grid grid-cols-2 gap-3">
                  {allRoles.map((role) => (
                    <button
                      key={role.id || role.name}
                      onClick={() => setNewRole(role.name)}
                      className={`relative p-5 rounded-3xl border transition-all duration-300 text-left group overflow-hidden ${
                        newRole === role.name 
                        ? 'bg-indigo-600 border-indigo-600 shadow-[0_15px_35px_rgba(79,70,229,0.3)]' 
                        : 'bg-slate-900/5 dark:bg-white/5 border-black/5 dark:border-white/5 hover:border-indigo-500/30'
                      }`}
                    >
                      <div className={`text-[9px] font-black uppercase tracking-widest mb-1 ${newRole === role.name ? 'text-white/70' : 'text-slate-400 dark:text-white/30'}`}>
                        VAI TRÒ
                      </div>
                      <div className={`text-xs font-black uppercase tracking-widest ${newRole === role.name ? 'text-white' : 'text-slate-700 dark:text-white/70'}`}>
                        {role.name}
                      </div>
                      {newRole === role.name && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                        </div>
                      )}
                    </button>
                  ))}
                  {allRoles.length === 0 && (
                     <p className="col-span-2 text-center py-4 text-[10px] font-black text-rose-500 uppercase tracking-widest italic animate-pulse">Đang nạp danh sách vai trò...</p>
                  )}
               </div>

               <button 
                  onClick={handleUpdateRole}
                  disabled={submitting || newRole === selectedUser.role}
                  className={`w-full py-5 rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-2xl transition-all flex items-center justify-center gap-4 ${
                    newRole === selectedUser.role 
                    ? 'bg-slate-100 dark:bg-white/5 text-slate-300 pointer-events-none opacity-50' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/30 active:scale-[0.98]'
                  }`}
               >
                  {submitting ? <RefreshCcw className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
                  {submitting ? 'ĐANG LƯU' : 'XÁC NHẬN VAI TRÒ'}
               </button>
            </div>

            <button 
                onClick={() => setShowDetailModal(false)}
                className="w-full text-[9px] font-black uppercase tracking-[0.4em] text-slate-400 dark:text-white/10 hover:text-rose-500 transition-all text-center pt-2"
            >
                [ ĐÓNG ]
            </button>
          </div>
        </DraggableModal>
      )}

      {actionType && targetUser && (
        <DraggableModal title={actionType === 'reset' ? 'Khôi phục bảo mật' : 'Xóa định danh'} onClose={closeActionConfirm} widthClassName="max-w-md">
          <div className="space-y-8 pt-8 text-center">
            <div className={`w-24 h-24 mx-auto rounded-[32px] ${actionType === 'reset' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/10' : 'bg-rose-500/10 text-rose-500 border-rose-500/20 shadow-rose-500/10'} border-2 flex items-center justify-center text-4xl shadow-2xl group`}>
              {actionType === 'reset' ? <Key className="w-10 h-10" /> : <Trash2 className="w-10 h-10" />}
            </div>
            <div className="px-4">
               <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-tight">
                 {actionType === 'reset' ? 'THIẾT LẬP LẠI MẬT KHẨU?' : 'GỠ BỎ TÀI KHOẢN NÀY?'}
               </h3>
               <p className="mt-5 text-sm font-bold text-slate-500 dark:text-white/40 leading-relaxed px-2">
                 {actionType === 'reset' ? (
                   <>Đặt lại mật khẩu cho <span className="font-black text-slate-900 dark:text-white underline decoration-amber-500 decoration-2">{targetUser.email}</span> về chuỗi mặc định <span className="text-amber-500">Emp@123</span>.</>
                 ) : (
                   <>Tài khoản <span className="font-black text-slate-900 dark:text-white underline decoration-rose-500 decoration-2">{targetUser.email}</span> sẽ bị xóa vĩnh viễn khỏi cơ sở dữ liệu hệ thống.</>
                 )}
               </p>
            </div>
            <div className="flex justify-center gap-4 pt-4">
              <button onClick={closeActionConfirm} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all">Hủy bỏ</button>
              <button 
                onClick={handleConfirmAction} 
                disabled={submitting} 
                className={`px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all shadow-2xl shadow-black/20 active:scale-95 ${actionType === 'reset' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-rose-600 hover:bg-rose-500'}`}
              >
                {submitting ? 'ĐANG CHẠY...' : 'TÔI XÁC NHẬN'}
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
    rose: 'from-rose-500/30 via-red-500/10 to-orange-500/5 dark:from-rose-500/20 dark:via-rose-600/10 border-rose-500/20 text-rose-500',
    violet: 'from-violet-500/30 via-purple-500/10 to-fuchsia-500/5 dark:from-violet-500/20 dark:via-violet-600/10 border-violet-500/20 text-violet-500',
    emerald: 'from-emerald-500/30 via-teal-500/10 to-cyan-500/5 dark:from-emerald-500/20 dark:via-emerald-600/10 border-emerald-500/20 text-emerald-500'
  };

  const ringGlow: Record<string, string> = {
    rose: 'bg-rose-500 shadow-rose-500/50',
    violet: 'bg-violet-500 shadow-violet-500/50',
    emerald: 'bg-emerald-500 shadow-emerald-500/50'
  };

  return (
    <div className="relative group min-w-[320px] rounded-[48px] overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${colorMap[color]} opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />
      <div className={`relative bg-gradient-to-br from-white/90 via-white/70 to-slate-50 dark:from-white/5 dark:via-white/[0.02] dark:to-white/[0.01] backdrop-blur-3xl border border-white/40 dark:border-white/5 p-10 shadow-3xl`}>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-[10px] font-black text-slate-500 dark:text-white/40 uppercase tracking-[0.3em] mb-4">{label}</p>
              <h3 className="text-6xl font-black text-slate-900 dark:text-white leading-none tracking-tighter">{value}</h3>
            </div>
            <div className={`w-16 h-16 rounded-[24px] ${ringGlow[color]} flex items-center justify-center text-2xl shadow-2xl group-hover:scale-110 transition-transform duration-500`}>
              <span className="filter grayscale group-hover:grayscale-0 transition-all">{icon}</span>
            </div>
          </div>
          <div className="mt-8 pt-8 border-t border-black/5 dark:border-white/5">
            <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">{desc}</p>
          </div>
      </div>
    </div>
  );
}
