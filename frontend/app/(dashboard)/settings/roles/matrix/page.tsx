'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, LayoutGrid, Lock, RefreshCcw, Search, Shield, ShieldAlert, Sparkles, X } from 'lucide-react';
import React from 'react';
import RbacConsoleNav from '@/components/RbacConsoleNav';
import Toast, { ToastState } from '@/components/Toast';
import { fetchCurrentSession } from '@/lib/api';
import { permissionApi } from '@/lib/permissionApi';
import { roleApi } from '@/lib/roleApi';
import type { PermissionDTO, RoleDTO } from '@/types';

const SYSTEM_ROLES = ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'];

export default function PermissionMatrixPage() {
  const [roles, setRoles] = useState<RoleDTO[]>([]);
  const [permissions, setPermissions] = useState<PermissionDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [rolesData, permissionsData] = await Promise.all([
        roleApi.getAllRoles(),
        permissionApi.getAllPermissions(),
      ]);
      setRoles(rolesData);
      setPermissions(permissionsData);
    } catch {
      pushToast('error', 'Không thể tải dữ liệu phân quyền');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (role: RoleDTO, permissionCode: string) => {
    if (role.name === 'ADMIN') {
      pushToast('info', 'Role ADMIN được khóa toàn bộ permission để tránh lệch quyền hệ thống');
      return;
    }

    const exists = role.permissions.includes(permissionCode);
    const nextPermissions = exists
      ? role.permissions.filter((code) => code !== permissionCode)
      : [...role.permissions, permissionCode];

    setRoles((prev) =>
      prev.map((item) => (item.id === role.id ? { ...item, permissions: nextPermissions } : item))
    );

    setSaving(role.id!);
    try {
      await roleApi.updateRole(role.id!, {
        ...role,
        permissions: nextPermissions,
      });
      await fetchCurrentSession();
      pushToast('success', `Đã cập nhật quyền cho role ${role.name}`);
    } catch (error: any) {
      pushToast('error', error.response?.data?.message || 'Không thể cập nhật role');
      await fetchData();
    } finally {
      setSaving(null);
    }
  };

  const filteredPermissions = permissions.filter((permission) => {
    const keyword = searchTerm.toLowerCase();
    return (
      permission.name.toLowerCase().includes(keyword) ||
      permission.code.toLowerCase().includes(keyword) ||
      permission.module.toLowerCase().includes(keyword)
    );
  });

  const modules = Array.from(new Set(permissions.map((permission) => permission.module)));

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin shadow-2xl shadow-indigo-500/20" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-500 animate-pulse">
          Đang tải ma trận phân quyền...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-12 max-w-[1600px] mx-auto pb-40 animate-in fade-in duration-1000">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />
      <RbacConsoleNav />

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 pt-10">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="p-4 rounded-[24px] bg-indigo-100 dark:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-500/20 shadow-xl dark:shadow-2xl relative">
              <LayoutGrid className="w-8 h-8" />
              <div className="absolute inset-0 bg-indigo-400 blur-2xl opacity-0 dark:opacity-20" />
            </div>
            <h1
              className="text-5xl md:text-6xl font-black text-white px-1 tracking-tighter uppercase leading-none mix-blend-overlay"
              style={{ textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}
            >
              Ma trận
            </h1>
          </div>
          <p className="text-sm font-black text-white dark:text-white/40 uppercase tracking-[0.25em] ml-1.5 flex items-center gap-3" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
            <span className="w-8 h-[1px] bg-white/40 dark:bg-white/20" />
            Gán permission trực tiếp theo role
          </p>
        </div>

        <div className="flex items-center gap-4 flex-wrap">
          <Link
            href="/settings/permissions"
            className="h-16 px-8 bg-black/20 hover:bg-black/30 dark:bg-white/5 dark:hover:bg-white/10 text-white dark:text-white/60 dark:hover:text-white rounded-[24px] border border-white/20 dark:border-white/5 transition-all duration-300 flex items-center gap-3 shadow-xl backdrop-blur-xl"
          >
            <Shield className="w-5 h-5" />
            <span className="text-[11px] font-black uppercase tracking-[0.2em]">Danh mục quyền</span>
          </Link>

          <div className="relative group lg:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 dark:text-white/20 group-focus-within:text-indigo-500 dark:group-focus-within:text-indigo-400 transition-colors" />
            <input
              type="text"
              placeholder="Tìm permission..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[24px] py-4 pl-16 pr-8 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all font-bold tracking-wider placeholder:text-slate-300 dark:placeholder:text-white/10 shadow-sm dark:shadow-none"
            />
          </div>

          <button
            onClick={() => void fetchData()}
            className="p-4 bg-black/20 hover:bg-black/30 dark:bg-white/5 dark:hover:bg-white/10 text-white dark:text-white/40 dark:hover:text-white rounded-[24px] border border-white/20 dark:border-white/5 transition-all active:scale-90 shadow-xl backdrop-blur-xl"
          >
            <RefreshCcw className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Matrix Table */}
      <div className="glass-dark border border-slate-200 dark:border-white/5 rounded-[48px] overflow-hidden shadow-xl dark:shadow-3xl">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-slate-50 dark:bg-black/20 backdrop-blur-3xl">
                <th className="p-8 text-left sticky left-0 z-40 bg-slate-100/90 dark:bg-slate-950/80 backdrop-blur-xl border-b border-r border-slate-200 dark:border-white/5 w-[360px]">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-500 uppercase tracking-[0.3em] leading-none">Danh mục</span>
                    <span className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Permission</span>
                  </div>
                </th>
                {roles.map((role) => (
                  <th key={role.id} className="p-8 text-center border-b border-slate-200 dark:border-white/5 min-w-[180px]">
                    <div className="flex flex-col items-center gap-3">
                      <div className="px-4 py-1.5 rounded-full bg-indigo-100 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/30 text-[10px] font-black text-indigo-700 dark:text-indigo-400 uppercase tracking-widest">
                        {role.name}
                      </div>
                      {saving === role.id && <RefreshCcw className="w-3 h-3 text-indigo-500 animate-spin" />}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((module) => {
                const modulePermissions = filteredPermissions.filter((permission) => permission.module === module);
                if (modulePermissions.length === 0) return null;

                return (
                  <React.Fragment key={module}>
                    <tr className="bg-indigo-50/50 dark:bg-indigo-600/[0.03]">
                      <td colSpan={roles.length + 1} className="p-4 px-8 border-b border-slate-200 dark:border-white/5 sticky left-0 z-30">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-4 h-4 text-indigo-500 dark:text-indigo-400 opacity-50" />
                          <span className="text-[11px] font-black text-slate-500 dark:text-white/60 uppercase tracking-[0.4em]">{module}</span>
                        </div>
                      </td>
                    </tr>

                    {modulePermissions.map((permission) => (
                      <tr key={permission.id} className="group hover:bg-indigo-50/30 dark:hover:bg-white/[0.02] transition-colors">
                        <td className="p-6 px-10 sticky left-0 z-30 bg-white/90 dark:bg-slate-950/80 backdrop-blur-xl border-b border-r border-slate-200 dark:border-white/5 group-hover:bg-indigo-50/50 dark:group-hover:bg-slate-900 transition-colors">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-black text-slate-800 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors uppercase tracking-widest">
                              {permission.name}
                            </span>
                            <span className="text-[9px] font-bold text-slate-400 dark:text-white/20 uppercase tracking-widest font-mono italic">
                              {permission.code}
                            </span>
                          </div>
                        </td>

                        {roles.map((role) => {
                          const isSelected = role.permissions.includes(permission.code);
                          const isLocked = role.name === 'ADMIN';

                          return (
                            <td key={`${role.id}-${permission.code}`} className="p-6 text-center border-b border-slate-200 dark:border-white/5">
                              <button
                                onClick={() => !isLocked && void handleToggle(role, permission.code)}
                                disabled={isLocked}
                                className={`w-12 h-12 mx-auto rounded-2xl flex items-center justify-center transition-all duration-500 scale-90 group-hover:scale-100 ${
                                  isSelected
                                    ? 'bg-indigo-600 text-white shadow-[0_10px_25px_rgba(79,70,229,0.3)]'
                                    : 'bg-slate-100 dark:bg-white/5 text-slate-300 dark:text-white/10 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-slate-500 dark:hover:text-white/30 border border-slate-200 dark:border-white/5'
                                } ${isLocked ? 'opacity-30 cursor-not-allowed' : 'active:scale-75'}`}
                              >
                                {isSelected ? <Check className="w-5 h-5 stroke-[3]" /> : <X className="w-5 h-5 opacity-20" />}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="glass-dark p-8 rounded-[38px] border border-slate-200 dark:border-white/5 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 flex items-center justify-center">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Bảo vệ hệ thống</h3>
          <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-widest">
            ADMIN được xem là super-role, nên toàn bộ permission trong ma trận đều bị khóa để tránh trạng thái hiển thị sai với quyền thực tế.
          </p>
        </div>

        <div className="glass-dark p-8 rounded-[38px] border border-slate-200 dark:border-white/5 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 flex items-center justify-center">
            <Lock className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Đồng bộ tức thì</h3>
          <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-widest">
            Sau khi đổi role hoặc permission, session local được đồng bộ lại ngay để UI phản ánh đúng quyền hiện tại.
          </p>
        </div>

        <div className="glass-dark p-8 rounded-[38px] border border-slate-200 dark:border-white/5 flex flex-col gap-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500 flex items-center justify-center">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest">Lưu ý nghiệp vụ</h3>
          <p className="text-[11px] font-bold text-slate-500 dark:text-white/40 leading-relaxed uppercase tracking-widest">
            Permission mới nên đặt theo chuẩn code ổn định để dùng chung cho menu, API guard và các tính năng phát sinh sau này.
          </p>
        </div>
      </div>
    </div>
  );
}
