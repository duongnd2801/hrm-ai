'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, CheckCircle2, Eye, Info, KeyRound, LayoutGrid, Lock, MoreVertical, Pencil, Plus, Shield, Trash2 } from 'lucide-react';
import ConfirmDialog from '@/components/ConfirmDialog';
import RbacConsoleNav from '@/components/RbacConsoleNav';
import RoleDialog from '@/components/RoleDialog';
import Toast, { ToastState } from '@/components/Toast';
import { fetchCurrentSession } from '@/lib/api';
import { roleApi } from '@/lib/roleApi';
import type { RoleDTO } from '@/types';

const SYSTEM_ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState<RoleDTO | null>(null);
  const [open, setOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [roleToDelete, setRoleToDelete] = useState<RoleDTO | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    };
    if (activeMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    void fetchRoles();
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const data = await roleApi.getAllRoles();
      setRoles(data);
    } catch {
      pushToast('error', 'Không thể tải danh sách role');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setOpen(true);
  };

  const handleEdit = (role: RoleDTO) => {
    setSelectedRole(role);
    setOpen(true);
    setActiveMenu(null);
  };

  const handleDelete = (role: RoleDTO) => {
    setRoleToDelete(role);
    setConfirmOpen(true);
    setActiveMenu(null);
  };

  const confirmDelete = async () => {
    if (!roleToDelete) return;
    setConfirmOpen(false);
    try {
      await roleApi.deleteRole(roleToDelete.id!);
      await fetchCurrentSession();
      pushToast('success', `Đã xóa role "${roleToDelete.name}"`);
      await fetchRoles();
    } catch (error: any) {
      pushToast('error', error.response?.data?.message || 'Không thể xóa role');
    } finally {
      setRoleToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 animate-pulse">
          Đang tải role...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1400px] mx-auto pb-40 animate-in fade-in duration-1000">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
      <ConfirmDialog
        isOpen={confirmOpen}
        title="Xóa Role"
        message={`Bạn có chắc muốn xóa role "${roleToDelete?.name}" không? Hành động này không thể hoàn tác.`}
        confirmText="Xóa role"
        cancelText="Giữ lại"
        kind="danger"
        onConfirm={() => void confirmDelete()}
        onCancel={() => { setConfirmOpen(false); setRoleToDelete(null); }}
      />
      <RoleDialog
        open={open}
        onOpenChange={setOpen}
        role={selectedRole}
        roles={roles}
        onSuccess={() => {
          void fetchCurrentSession();
          void fetchRoles();
        }}
      />
      <RbacConsoleNav />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-[24px] bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-xl dark:shadow-2xl relative">
              <Shield className="w-8 h-8" />
              <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-0 dark:opacity-20" />
            </div>
            <h1
              className="text-5xl md:text-6xl font-black text-white px-1 tracking-tight leading-none mix-blend-overlay"
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            >
              Roles
            </h1>
          </div>
          <p className="text-sm font-bold text-white dark:text-white/50 tracking-[0.08em] ml-1.5 flex items-center gap-3" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            <span className="w-8 h-[1px] bg-white/40 dark:bg-white/20" />
            Quản lý nhóm quyền cho từng loại người dùng
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/settings/roles/matrix"
            className="group relative h-16 px-10 bg-black/20 hover:bg-black/30 dark:bg-white/5 dark:hover:bg-white/10 text-white dark:text-white/60 dark:hover:text-white rounded-[24px] border border-white/20 dark:border-white/5 transition-all duration-500 flex items-center gap-4 active:scale-95 shadow-xl backdrop-blur-xl"
          >
            <LayoutGrid className="w-5 h-5 group-hover:rotate-180 transition-transform duration-700" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Ma trận phân quyền</span>
          </Link>

          <Link
            href="/settings/permissions"
            className="group relative h-16 px-10 bg-black/20 hover:bg-black/30 dark:bg-white/5 dark:hover:bg-white/10 text-white dark:text-white/60 dark:hover:text-white rounded-[24px] border border-white/20 dark:border-white/5 transition-all duration-500 flex items-center gap-4 active:scale-95 shadow-xl backdrop-blur-xl"
          >
            <KeyRound className="w-5 h-5 group-hover:rotate-12 transition-transform duration-700" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Danh mục quyền</span>
          </Link>

          <button
            onClick={handleCreate}
            className="group relative h-16 px-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[24px] overflow-hidden transition-all duration-500 shadow-2xl shadow-indigo-600/30 hover:scale-[1.03] active:scale-95 flex items-center gap-4"
          >
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <Plus className="w-5 h-5 relative z-10 group-hover:rotate-90 transition-transform duration-500" />
            <span className="relative z-10 text-[11px] font-black uppercase tracking-[0.2em]">Tạo role</span>
          </button>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5 rounded-3xl flex items-center gap-5 max-w-3xl">
        <div className="p-2.5 rounded-2xl bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <p className="text-[11px] font-bold text-amber-700/80 dark:text-amber-500/80 leading-relaxed uppercase tracking-widest">
          Các role hệ thống như ADMIN, HR, MANAGER, EMPLOYEE đang giữ luồng vận hành cốt lõi. Có thể chỉnh permission bên trong, nhưng nên tránh làm rỗng toàn bộ quyền của các role này.
        </p>
      </div>

      {/* Role Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {roles.map((role) => {
          const isSystemRole = SYSTEM_ROLES.includes(role.name);
          const isMenuOpen = activeMenu === role.id;

          return (
            <div
              key={role.id}
              className="group glass-dark border border-slate-200 dark:border-white/5 p-8 rounded-[42px] hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-500 relative flex flex-col h-full shadow-lg dark:shadow-2xl hover:shadow-xl dark:hover:shadow-indigo-500/10"
            >
              <div className="flex items-start justify-between mb-10">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-widest uppercase">{role.name}</h3>
                    {isSystemRole && (
                      <div className="px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-500 border border-emerald-200 dark:border-emerald-500/20 text-[8px] font-black uppercase tracking-[0.2em]">
                        Hệ thống
                      </div>
                    )}
                  </div>
                  <p className="text-slate-400 dark:text-white/30 text-[10px] font-bold leading-relaxed uppercase tracking-widest italic pr-8 line-clamp-2">
                    {role.description || 'Chưa có mô tả cho role này'}
                  </p>
                </div>

                {/* 3-dot menu — dùng ref để detect outside click */}
                <div
                  className="relative"
                  ref={isMenuOpen ? menuRef : null}
                >
                  <button
                    type="button"
                    onClick={() => setActiveMenu(isMenuOpen ? null : (role.id || null))}
                    className={`p-3 rounded-2xl transition-all ${
                      isMenuOpen
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                    }`}
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  {isMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-44 bg-white dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl p-1.5 z-50 animate-in zoom-in-95 duration-150">
                      <button
                        type="button"
                        onClick={() => handleEdit(role)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-500/10 text-sky-600 dark:text-sky-400 transition-all text-[11px] font-black uppercase tracking-widest"
                      >
                        <Pencil className="w-4 h-4 shrink-0" />
                        Chỉnh sửa
                      </button>
                      {!isSystemRole && (
                        <button
                          type="button"
                          onClick={() => handleDelete(role)}
                          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-500/10 text-rose-600 dark:text-rose-500 transition-all text-[11px] font-black uppercase tracking-widest"
                        >
                          <Trash2 className="w-4 h-4 shrink-0" />
                          Xóa role
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Permission Tags */}
              <div className="flex-1 space-y-6 mb-10">
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.25em]">Permission</span>
                    <div className="w-6 h-6 rounded-lg bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-black italic">
                      {role.permissions?.length || 0}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  {role.permissions?.slice(0, 8).map((permissionCode) => (
                    <div
                      key={permissionCode}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/5 text-[9px] font-black text-slate-600 dark:text-white/60 uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 dark:hover:bg-indigo-600/10 hover:border-indigo-200 dark:hover:border-indigo-500/20 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all"
                    >
                      <CheckCircle2 className="w-3 h-3 opacity-50" />
                      {permissionCode}
                    </div>
                  ))}

                  {role.permissions && role.permissions.length > 8 && (
                    <div className="px-3.5 py-1.5 rounded-xl bg-indigo-600 border border-indigo-500 shadow-lg shadow-indigo-600/20 text-[9px] font-black text-white uppercase tracking-widest">
                      +{role.permissions.length - 8} quyền khác
                    </div>
                  )}

                  {(!role.permissions || role.permissions.length === 0) && (
                    <div className="flex items-center gap-3 p-4 rounded-[24px] bg-rose-50 dark:bg-rose-500/5 border border-rose-200 dark:border-rose-500/10 w-full justify-center">
                      <Info className="w-4 h-4 text-rose-400 dark:text-rose-500/50" />
                      <span className="text-[10px] font-black text-rose-500 dark:text-rose-500/50 uppercase tracking-widest">Chưa gán permission nào</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex items-center justify-between mt-auto">
                <div className="flex flex-col gap-1">
                  <span className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em] leading-none">Khởi tạo</span>
                  <span className="text-[11px] font-black text-slate-500 dark:text-white/50 uppercase tracking-widest">
                    {role.createdAt ? new Date(role.createdAt).toLocaleDateString('vi-VN') : 'Kế thừa'}
                  </span>
                </div>
                <div
                  className={`p-3 rounded-2xl ${
                    isSystemRole
                      ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20'
                      : 'bg-slate-100 dark:bg-white/5 text-slate-400 dark:text-white/20 border border-slate-200 dark:border-white/5'
                  } transition-all`}
                >
                  {isSystemRole ? <Lock className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
