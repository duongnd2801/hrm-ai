'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import Toast, { ToastState } from '@/components/Toast';
import { Department, Employee, Position } from '@/types';
import { getSession, hasRole, saveSession } from '@/lib/auth';
import { formatVND } from '@/lib/utils';
import { useSession } from '@/components/AuthProvider';

type EmployeePageProps = {
  params: Promise<{ id: string }>;
};

type SelectOption = {
  id: string;
  label: string;
  subLabel?: string;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (typeof data === 'string') return data;
  return (data as { message?: string } | undefined)?.message || fallback;
}

function getPositionRank(positionName?: string): number {
  const raw = (positionName || '').toUpperCase();
  if (!raw) return 0;
  if (raw.includes('CEO') || raw.includes('DIRECTOR') || raw.includes('ADMIN')) return 90;
  if (raw.includes('HR')) return 80;
  if (raw.includes('MANAGER') || raw.includes('MNG')) return 70;
  if (raw.includes('HEAD') || raw.includes('LEAD')) return 60;
  if (raw.includes('PM')) return 50;
  if (raw.includes('SENIOR')) return 40;
  if (raw.includes('DEV') || raw.includes('ENGINEER')) return 30;
  if (raw.includes('TEST') || raw.includes('QA')) return 20;
  if (raw.includes('INTERN') || raw.includes('COLLAB')) return 10;
  return 15;
}

function SearchableSelect({
  label,
  value,
  options,
  placeholder,
  onSelect,
  disabled = false,
  allowClear = false,
  clearLabel = '-- Chưa chọn --',
  helperText,
}: {
  label: string;
  value?: string;
  options: SelectOption[];
  placeholder: string;
  onSelect: (id?: string) => void;
  disabled?: boolean;
  allowClear?: boolean;
  clearLabel?: string;
  helperText?: string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function onDocumentClick(e: MouseEvent) {
      if (!boxRef.current) return;
      if (!boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onDocumentClick);
    return () => document.removeEventListener('mousedown', onDocumentClick);
  }, [open]);

  const selected = useMemo(() => options.find((o) => o.id === value) || null, [options, value]);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => `${o.label} ${o.subLabel || ''}`.toLowerCase().includes(q));
  }, [options, query]);

  return (
    <div ref={boxRef} className="relative">
      <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">{label}</label>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((prev) => !prev)}
        className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 px-4 text-left text-slate-900 dark:text-white font-bold hover:border-indigo-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-inner"
      >
        {selected ? (
          <span className="text-slate-900 dark:text-white">
            {selected.label}
            {selected.subLabel ? <span className="text-slate-500 dark:text-white/40 text-xs font-normal ml-2">({selected.subLabel})</span> : null}
          </span>
        ) : (
          <span className="text-slate-400 dark:text-white/20 font-normal italic">{placeholder}</span>
        )}
      </button>

      {open && !disabled && (
        <div className="absolute z-50 mt-3 w-full rounded-2xl border border-white/10 bg-slate-900/95 backdrop-blur-3xl shadow-3xl overflow-hidden ring-1 ring-white/10">
          <div className="p-3 border-b border-white/10">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm kiếm danh mục..."
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>
          <div className="max-h-64 overflow-auto p-1.5 scrollbar-thin scrollbar-thumb-white/10">
            {allowClear && (
              <button
                type="button"
                onClick={() => {
                  onSelect(undefined);
                  setOpen(false);
                  setQuery('');
                }}
                className="w-full text-left px-4 py-3 rounded-xl text-white/40 hover:bg-white/5 text-xs font-bold transition-all"
              >
                {clearLabel}
              </button>
            )}
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-xs text-white/20 font-bold uppercase tracking-widest text-center">Không tìm thấy</div>
            ) : (
              filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelect(item.id);
                    setOpen(false);
                    setQuery('');
                  }}
                  className={`w-full text-left px-4 py-3 rounded-xl transition-all mb-1 ${
                    value === item.id ? 'bg-indigo-500 text-white shadow-lg' : 'text-white/60 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-sm">{item.label}</div>
                  {item.subLabel ? <div className="text-[10px] opacity-60 mt-0.5">{item.subLabel}</div> : null}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {helperText ? <p className="text-[10px] text-white/20 mt-2 ml-1 italic">{helperText}</p> : null}
    </div>
  );
}

export default function EmployeeDetailPage({ params }: EmployeePageProps) {
  const { id } = React.use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useSession();

  const [mounted, setMounted] = useState(false);
  const [emp, setEmp] = useState<Employee | null>(null);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [managerOptions, setManagerOptions] = useState<Employee[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });

  const isHRAdmin = session ? hasRole(session.role, 'ADMIN', 'HR') : false;
  const isSelf = session?.employeeId === id;
  const canEditPersonal = isHRAdmin || isSelf;
  const canEditStructure = isHRAdmin;
  const forceCompleteProfile = searchParams.get('completeProfile') === '1';

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const fetchMeta = useCallback(async (employeeId: string) => {
    try {
      const [deptRes, posRes, employeeRes] = await Promise.all([
        api.get('/api/company/departments'),
        api.get('/api/company/positions'),
        api.get('/api/employees'),
      ]);

      setDepartments(deptRes.data as Department[]);
      setPositions(posRes.data as Position[]);
      const employees = (employeeRes.data as Employee[]).filter((e) => e.id !== employeeId);
      setManagerOptions(employees);
    } catch {
      pushToast('error', 'Không thể tải dữ liệu cấu trúc công ty.');
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const tasks: Promise<unknown>[] = [api.get(`/api/employees/${id}`)];
        if (isHRAdmin) tasks.push(fetchMeta(id));
        const [res] = await Promise.all(tasks);
        setEmp((res as any).data as Employee);
      } catch (err: unknown) {
        setError(getErrorMessage(err, 'Không thể truy cập hồ sơ nhân viên này.'));
      } finally {
        setLoading(false);
      }
    };

    void run();
  }, [mounted, id, isHRAdmin, fetchMeta]);

  const departmentSelectOptions = useMemo<SelectOption[]>(
    () => departments.map((d) => ({ id: d.id, label: d.name })),
    [departments]
  );
  const positionSelectOptions = useMemo<SelectOption[]>(
    () => positions.map((p) => ({ id: p.id, label: p.name, subLabel: p.description || undefined })),
    [positions]
  );
  const eligibleManagers = useMemo(() => {
    if (!emp) return [];
    const currentRank = getPositionRank(emp.positionName);
    return managerOptions.filter((candidate) => getPositionRank(candidate.positionName) > currentRank);
  }, [emp, managerOptions]);
  const managerSelectOptions = useMemo<SelectOption[]>(
    () =>
      eligibleManagers.map((m) => ({
        id: m.id,
        label: m.fullName,
        subLabel: `${m.email}${m.positionName ? ` | ${m.positionName}` : ''}`,
      })),
    [eligibleManagers]
  );

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!emp) return;

    setSaving(true);
    try {
      if (canEditStructure) {
        await api.put(`/api/employees/${id}`, emp);
      } else {
        await api.patch(`/api/employees/${id}/personal`, {
          phone: emp.phone,
          address: emp.address,
          bio: emp.bio,
          gender: emp.gender,
          birthDate: emp.birthDate,
        });
      }
      pushToast('success', 'Đã lưu thay đổi hồ sơ thành công.');
      setTimeout(() => router.push('/employees'), 1500);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Lỗi khi lưu trữ dữ liệu.'));
    } finally {
      setSaving(false);
    }
  }

  if (!mounted) return null;
  if (loading) return <div className="text-white/20 p-20 text-center font-black uppercase tracking-[0.2em]">Đang đồng bộ hồ sơ...</div>;
  if (error) return <div className="text-rose-400 p-20 text-center font-black uppercase tracking-widest">{error}</div>;
  if (!emp) return null;

  return (
    <div className="space-y-10 pb-20">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Title Section */}
      <div className="flex flex-col md:flex-row md:items-end justify-between pt-10">
         <div className="flex items-center gap-8">
            <div className="relative group">
               <Avatar name={emp.fullName} size="xl" />
               <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl opacity-0 group-hover:opacity-100 transition-all" />
            </div>
            <div>
               <h1 className="text-6xl font-black text-white/90 tracking-tighter mix-blend-overlay uppercase leading-[0.8] mb-4">{emp.fullName}</h1>
               <div className="flex items-center gap-4">
                  <span className="text-xs font-black bg-indigo-500 text-white px-3 py-1 rounded-full uppercase tracking-widest">{emp.positionName || 'Nhân viên'}</span>
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest border-l border-white/10 pl-4">{emp.departmentName || 'Chung'}</span>
               </div>
            </div>
         </div>

         <div className="flex gap-3 mt-8 md:mt-0">
            <button
               type="button"
               onClick={() => router.push('/employees')}
               className="px-6 py-3 rounded-2xl bg-white/5 text-white/40 hover:text-white hover:bg-white/10 font-bold text-xs uppercase tracking-widest transition-all"
            >
               QUAY LẠI
            </button>
         </div>
      </div>

      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* Left Column: Essential Info */}
         <div className="lg:col-span-2 space-y-10">
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-indigo-500 rounded-full" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest">Thông tin cá nhân</h3>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">Số điện thoại</label>
                    <input
                      type="text"
                      value={emp.phone || ''}
                      placeholder="Chưa cập nhật"
                      onChange={(e) => setEmp({ ...emp, phone: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">Ngày sinh</label>
                    <input
                      type="date"
                      value={emp.birthDate || ''}
                      onChange={(e) => setEmp({ ...emp, birthDate: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">Địa chỉ thường trú</label>
                    <input
                      type="text"
                      value={emp.address || ''}
                      placeholder="Chưa cập nhật địa chỉ"
                      onChange={(e) => setEmp({ ...emp, address: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 px-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">Tiểu sử / Ghi chú</label>
                    <textarea
                      rows={4}
                      value={emp.bio || ''}
                      placeholder="Giới thiệu ngắn về bản thân..."
                      onChange={(e) => setEmp({ ...emp, bio: e.target.value })}
                      disabled={!canEditPersonal}
                      className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all disabled:opacity-50 resize-none"
                    />
                  </div>
               </div>
            </div>
         </div>

         {/* Right Column: Work & System info */}
         <div className="space-y-10">
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
               <div className="flex items-center gap-3 mb-8">
                  <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-widest">Cơ cấu & Lương</h3>
               </div>

               <div className="space-y-6">
                  {canEditStructure ? (
                    <>
                      <SearchableSelect
                        label="Phòng ban"
                        value={emp.departmentId}
                        options={departmentSelectOptions}
                        placeholder="Chọn bộ phận..."
                        allowClear
                        onSelect={(nextId) => {
                          const selected = departments.find((d) => d.id === nextId);
                          setEmp({ ...emp, departmentId: nextId, departmentName: selected?.name });
                        }}
                      />
                      <SearchableSelect
                        label="Chức danh"
                        value={emp.positionId}
                        options={positionSelectOptions}
                        placeholder="Chọn chức vụ..."
                        allowClear
                        onSelect={(nextId) => {
                          const selected = positions.find((p) => p.id === nextId);
                          setEmp({ ...emp, positionId: nextId, positionName: selected?.name });
                        }}
                      />
                      <div>
                        <label className="block text-slate-500 dark:text-white/40 font-black uppercase text-[10px] tracking-widest mb-2 ml-1">Lương cơ bản (VND)</label>
                        <input
                          type="number"
                          value={emp.baseSalary || 0}
                          onChange={(e) => setEmp({ ...emp, baseSalary: Number(e.target.value) })}
                          className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-3 px-4 text-indigo-500 dark:text-indigo-400 font-black text-lg focus:ring-2 focus:ring-indigo-500/50 outline-none transition-all"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-4">
                       <div className="p-5 bg-slate-900/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                          <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-1">Mức lương hiện tại</p>
                          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 tracking-tighter">{formatVND(emp.baseSalary)}</p>
                       </div>
                       <div className="p-5 bg-slate-900/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5">
                          <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-1">Tham gia từ</p>
                          <p className="text-lg font-black text-slate-900 dark:text-white tracking-widest">{new Date(emp.startDate).toLocaleDateString('vi-VN')}</p>
                       </div>
                    </div>
                  )}

                  <hr className="border-white/5 my-6" />

                  <button
                    type="submit"
                    disabled={saving || !canEditPersonal}
                    className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:bg-white/10 disabled:text-white/20 text-white rounded-[24px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-500/20 active:scale-95 flex items-center justify-center gap-3"
                  >
                    {saving && <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                    {saving ? 'ĐANG LƯU...' : 'LƯU HỒ SƠ'}
                  </button>
               </div>
            </div>

            {/* Account Card */}
            <div className="bg-slate-900/40 backdrop-blur-3xl rounded-[40px] p-10 border border-white/5 shadow-3xl text-center">
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] mb-4">Tài khoản hệ thống</p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-4">
                   {emp.status === 'ACTIVE' ? 'Đang hoạt động' : 'Đã khóa'}
                </div>
                <h4 className="text-white font-bold truncate mb-1">{emp.email}</h4>
                <p className="text-white/30 text-xs">Mã nhân viên: {emp.id.split('-')[0].toUpperCase()}</p>
            </div>
         </div>
      </form>
    </div>
  );
}
