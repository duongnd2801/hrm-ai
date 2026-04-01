'use client';

import { useEffect, useMemo, useState } from 'react';
import api from '@/lib/api';
import DraggableModal from '@/components/DraggableModal';

interface User {
  id: string;
  email: string;
  role: 'ADMIN' | 'HR' | 'MANAGER' | 'EMPLOYEE' | string;
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
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    void fetchUsers();
  }, [page]);

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get('/api/users', {
        params: { page, size: 20 },
      });
      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể tải danh sách tài khoản.');
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
    setError('');
    try {
      const response = await api.get('/api/users/search', {
        params: { email: searchEmail.trim(), page: 0, size: 20 },
      });
      setUsers(response.data.content || []);
      setTotalPages(response.data.totalPages || 0);
      setPage(0);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Tìm kiếm thất bại.');
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
    setError('');
    try {
      await api.put(`/api/users/${selectedUser.id}/role`, { role: newRole });
      setSuccess(`Đã cập nhật quyền cho ${selectedUser.email}.`);
      closeRoleModal();
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể cập nhật quyền.');
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
    setError('');
    try {
      if (actionType === 'reset') {
        await api.post(`/api/users/${targetUser.id}/reset-password`);
        setSuccess(`Đã reset mật khẩu cho ${targetUser.email} về Emp@123.`);
      }
      if (actionType === 'delete') {
        await api.delete(`/api/users/${targetUser.id}`);
        setSuccess(`Đã xóa tài khoản ${targetUser.email}.`);
      }
      closeActionConfirm();
      await fetchUsers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return 'bg-rose-500/10 text-rose-700 dark:text-rose-300';
      case 'HR':
        return 'bg-sky-500/10 text-sky-700 dark:text-sky-300';
      case 'MANAGER':
        return 'bg-violet-500/10 text-violet-700 dark:text-violet-300';
      default:
        return 'bg-slate-500/10 text-slate-700 dark:text-slate-300';
    }
  };

  const totalPagesSafe = Math.max(1, totalPages);
  const activeCount = useMemo(() => users.filter((u) => u.isActive !== false).length, [users]);

  return (
    <div className="px-2 lg:px-6 py-4">
      <section className="rounded-[32px] border border-black/5 dark:border-white/10 bg-white/50 dark:bg-white/5 backdrop-blur-2xl overflow-hidden shadow-xl">
        <div className="px-6 lg:px-8 py-7 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h1 className="text-3xl lg:text-5xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">
              Quản lý user
            </h1>
            <p className="mt-2 text-[11px] lg:text-sm font-black uppercase tracking-[0.34em] italic text-slate-500 dark:text-white/45">
              Quản trị tài khoản, phân quyền và bảo mật hệ thống
            </p>
          </div>

          <div className="self-start lg:self-auto p-1.5 rounded-full bg-slate-200/80 dark:bg-white/10 flex gap-1.5">
            <div className="px-6 py-3 rounded-full bg-indigo-600 text-white text-xs font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">
              Đang hoạt động ({activeCount})
            </div>
            <div className="px-6 py-3 rounded-full text-slate-500 dark:text-white/60 text-xs font-black uppercase tracking-widest">
              Tổng ({users.length})
            </div>
          </div>
        </div>

        <div className="border-t border-black/5 dark:border-white/10" />

        <div className="px-6 lg:px-8 py-5 flex flex-col lg:flex-row gap-3">
          <input
            type="email"
            value={searchEmail}
            onChange={(e) => setSearchEmail(e.target.value)}
            placeholder="Nhập email cần tìm..."
            className="flex-1 rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30 focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
          />
          <button
            onClick={() => void handleSearch()}
            className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Tìm kiếm
          </button>
          <button
            onClick={() => {
              setSearchEmail('');
              setPage(0);
              void fetchUsers();
            }}
            className="px-6 py-3 rounded-2xl bg-slate-500/15 hover:bg-slate-500/25 text-slate-700 dark:text-slate-200 text-xs font-black uppercase tracking-widest transition-all active:scale-95"
          >
            Làm mới
          </button>
        </div>

        {error && (
          <div className="mx-6 lg:mx-8 mb-4 rounded-2xl border border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300 px-5 py-3 text-sm font-bold flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError('')} className="text-base font-black hover:opacity-80">
              ✕
            </button>
          </div>
        )}

        {success && (
          <div className="mx-6 lg:mx-8 mb-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-5 py-3 text-sm font-bold flex items-center justify-between">
            <span>{success}</span>
            <button type="button" onClick={() => setSuccess('')} className="text-base font-black hover:opacity-80">
              ✕
            </button>
          </div>
        )}

        <div className="overflow-x-auto">
          {loading ? (
            <div className="py-14 text-center text-slate-500 dark:text-white/45 font-black uppercase tracking-widest">Đang tải dữ liệu...</div>
          ) : users.length === 0 ? (
            <div className="py-14 text-center text-slate-500 dark:text-white/45 font-black uppercase tracking-widest">Không có tài khoản phù hợp.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-black/[0.03] dark:bg-black/30 border-y border-black/5 dark:border-white/10">
                <tr className="text-[11px] uppercase tracking-[0.18em] text-slate-500 dark:text-white/45">
                  <th className="px-6 lg:px-8 py-5 text-left font-black">Email</th>
                  <th className="px-6 py-5 text-left font-black">Quyền</th>
                  <th className="px-6 py-5 text-left font-black">Ngày tạo</th>
                  <th className="px-6 py-5 text-left font-black">Tác vụ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5 dark:divide-white/10">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-black/[0.02] dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-6 lg:px-8 py-5 text-slate-900 dark:text-white font-semibold">{user.email}</td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black border border-black/5 dark:border-white/10 ${getRoleColor(user.role)}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-slate-600 dark:text-white/65 font-semibold">
                      {new Date(user.createdAt).toLocaleDateString('vi-VN')}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => openRoleModal(user)}
                          className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/25 hover:bg-indigo-600 hover:text-white transition-all active:scale-95"
                        >
                          Đổi quyền
                        </button>
                        <button
                          onClick={() => openActionConfirm('reset', user)}
                          className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/25 hover:bg-amber-500 hover:text-white transition-all active:scale-95"
                        >
                          Reset mật khẩu
                        </button>
                        {user.role !== 'ADMIN' && (
                          <button
                            onClick={() => openActionConfirm('delete', user)}
                            className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/25 hover:bg-rose-600 hover:text-white transition-all active:scale-95"
                          >
                            Xóa
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="px-6 lg:px-8 py-4 flex items-center justify-between border-t border-black/5 dark:border-white/10">
          <span className="text-sm text-slate-600 dark:text-white/60 font-semibold">
            Trang {page + 1} / {totalPagesSafe}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(0, page - 1))}
              disabled={page === 0}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-500/15 text-slate-700 dark:text-slate-200 hover:bg-slate-500/25 disabled:opacity-40 transition-all"
            >
              Trước
            </button>
            <button
              onClick={() => setPage(Math.min(totalPagesSafe - 1, page + 1))}
              disabled={page >= totalPagesSafe - 1}
              className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-slate-500/15 text-slate-700 dark:text-slate-200 hover:bg-slate-500/25 disabled:opacity-40 transition-all"
            >
              Sau
            </button>
          </div>
        </div>
      </section>

      {showRoleModal && selectedUser && (
        <DraggableModal title="Đổi quyền tài khoản" onClose={closeRoleModal} widthClassName="max-w-lg">
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-white/65 font-semibold">
              Tài khoản: <span className="font-black text-slate-900 dark:text-white">{selectedUser.email}</span>
            </p>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 mb-2">Quyền mới</label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="w-full rounded-2xl border border-black/10 dark:border-white/15 bg-white dark:bg-white/5 px-4 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-indigo-500/15"
              >
                <option value="ADMIN">ADMIN</option>
                <option value="HR">HR</option>
                <option value="MANAGER">MANAGER</option>
                <option value="EMPLOYEE">EMPLOYEE</option>
              </select>
            </div>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeRoleModal}
                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleUpdateRole()}
                disabled={submitting}
                className="px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 hover:bg-indigo-500 text-white transition-all disabled:opacity-50 active:scale-95"
              >
                {submitting ? 'Đang cập nhật...' : 'Xác nhận đổi quyền'}
              </button>
            </div>
          </div>
        </DraggableModal>
      )}

      {actionType && targetUser && (
        <DraggableModal
          title={actionType === 'reset' ? 'Xác nhận reset mật khẩu' : 'Xác nhận xóa tài khoản'}
          onClose={closeActionConfirm}
          widthClassName="max-w-lg"
        >
          <div className="space-y-6">
            <p className="text-sm text-slate-600 dark:text-white/65 font-semibold leading-relaxed">
              {actionType === 'reset' ? (
                <>
                  Bạn có chắc muốn reset mật khẩu cho <span className="font-black text-slate-900 dark:text-white">{targetUser.email}</span> về mặc định <span className="font-black text-amber-700 dark:text-amber-300">Emp@123</span>?
                </>
              ) : (
                <>
                  Bạn có chắc muốn xóa tài khoản <span className="font-black text-slate-900 dark:text-white">{targetUser.email}</span>? Hành động này không thể hoàn tác.
                </>
              )}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={closeActionConfirm}
                className="px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/70 hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => void handleConfirmAction()}
                disabled={submitting}
                className={`px-7 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all disabled:opacity-50 active:scale-95 ${
                  actionType === 'reset' ? 'bg-amber-500 hover:bg-amber-400' : 'bg-rose-600 hover:bg-rose-500'
                }`}
              >
                {submitting ? 'Đang xử lý...' : actionType === 'reset' ? 'Xác nhận reset' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </DraggableModal>
      )}
    </div>
  );
}
