'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/AuthProvider';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import { Employee } from '@/types';
import { formatDate, formatVND } from '@/lib/utils';
import { Eye, Pencil, Trash2 } from 'lucide-react';

function StatusBadge({ status }: { status: Employee['status'] }) {
  const map: Record<Employee['status'], string> = {
    ACTIVE: 'bg-emerald-500 text-white dark:text-emerald-950 px-3',
    INACTIVE: 'bg-slate-200 dark:bg-slate-500/20 text-slate-500 dark:text-slate-300 px-3 border-transparent dark:border-slate-500/20',
    PROBATION: 'bg-amber-500 text-white dark:text-amber-950 px-3',
    CONTRACT: 'bg-indigo-600 dark:bg-indigo-500 text-white px-3',
    COLLABORATOR: 'bg-purple-600 dark:bg-purple-500 text-white px-3',
  };

  const label: Record<Employee['status'], string> = {
    ACTIVE: 'Đang làm việc',
    INACTIVE: 'Ngưng hoạt động',
    PROBATION: 'Thử việc',
    CONTRACT: 'Hợp đồng',
    COLLABORATOR: 'Cộng tác viên',
  };

  return (
    <span className={`inline-flex items-center py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent shadow-sm ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function EmployeeTable({ search = '', refreshKey = 0 }: { search?: string; refreshKey?: number }) {
  const { session } = useSession();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        const res = await api.get('/api/employees', { 
            params: { 
                search,
                page: currentPage - 1,
                size: pageSize
            } 
        });
        const data = res.data;
        setEmployees(data.content || []);
        setTotalItems(data.totalElements || 0);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [search, currentPage, pageSize, refreshKey]);

  useEffect(() => {
     setCurrentPage(1);
  }, [search]);

  const canManageGlobal = session?.permissions.includes('EMP_UPDATE') ?? false;
  const totalPages = Math.ceil(totalItems / pageSize);

  return (
    <div className="w-full relative">
      <div className={`w-full overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 pb-4 bg-transparent border-none transition-opacity duration-300 ${loading ? 'opacity-50' : 'opacity-100'}`}>
        <table className="min-w-[1200px] w-full text-left border-separate border-spacing-0">
          <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/40 text-slate-600 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-black/5 dark:border-white/5">
            <tr>
              <th className="px-6 py-5 rounded-tl-3xl whitespace-nowrap">NHÂN VIÊN</th>
              <th className="px-6 py-5 whitespace-nowrap">LIÊN LẠC</th>
              <th className="px-6 py-5 whitespace-nowrap text-center">CƠ CẤU & VỊ TRÍ</th>
              <th className="px-6 py-5 whitespace-nowrap text-center">TRẠNG THÁI</th>
              <th className="px-6 py-5 whitespace-nowrap text-center">NGÀY VÀO</th>
              <th className="px-6 py-5 whitespace-nowrap text-right">LƯƠNG CƠ BẢN</th>
              <th className="px-6 py-5 text-right pr-6 rounded-tr-3xl whitespace-nowrap">TÁC VỤ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm">
            {employees.length === 0 && !loading ? (
                <tr>
                    <td colSpan={7} className="px-6 py-20 text-center font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.5em] text-lg italic">
                        KHÔNG TÌM THẤY NHÂN VIÊN
                    </td>
                </tr>
            ) : (
                employees.map((emp) => {
                    const isSelf = session?.employeeId === emp.id;
                    const canEdit = canManageGlobal || isSelf;

                    return (
                        <tr key={emp.id} className="group hover:bg-slate-900/[0.04] dark:bg-slate-900/40 dark:hover:bg-indigo-500/10 transition-all duration-300">
                            <td className="px-6 py-3.5 border-b border-black/5 dark:border-white/5">
                                <div className="flex items-center gap-5 min-w-[280px]">
                                    <div className="relative group/avatar">
                                       <Avatar name={emp.fullName} size="lg" />
                                       <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full shadow-sm" />
                                    </div>
                                    <div className="flex-1 min-w-0 relative group/name">
                                        <Link href={`/employees/${emp.id}`} className="font-black text-slate-900 dark:text-white text-[14px] leading-tight hover:text-indigo-600 block transition-colors uppercase tracking-wider truncate">{emp.fullName || 'N/A'}</Link>
                                        <div className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-[0.2em] mt-1 opacity-60">ID: {emp.id.substring(0, 8).toUpperCase()}</div>
                                        
                                        {/* Hover Info Card - Right Side Fixed */}
                                        <div className="fixed z-[9999] p-8 w-80 bg-white dark:bg-slate-950 rounded-[40px] shadow-[0_30px_80px_rgba(0,0,0,0.5)] border border-black/5 dark:border-white/15 opacity-0 invisible group-hover/name:opacity-100 group-hover/name:visible transition-all duration-500 pointer-events-none transform translate-x-12 -translate-y-1/3 mt-0 ml-12">
                                          <div className="space-y-5">
                                             <div className="flex items-center gap-5 p-5 bg-slate-50 dark:bg-white/5 rounded-3xl border border-black/5 dark:border-white/5">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-lg bg-indigo-500 shadow-lg`}>
                                                   {emp.fullName?.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                   <p className="text-[13px] font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{emp.fullName}</p>
                                                   <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{emp.positionName || 'Nhân sự'}</p>
                                                </div>
                                             </div>
                                             <div className="space-y-4 px-2">
                                                <div className="flex items-center justify-between text-[13px] font-black uppercase tracking-widest text-slate-400 dark:text-white/50">
                                                   <span>Phòng ban:</span>
                                                   <span className="text-indigo-500">{emp.departmentName || 'Chung'}</span>
                                                </div>
                                                <div className="pt-3 border-t border-black/5 dark:border-white/5 space-y-2">
                                                   <div className="flex items-center gap-2">
                                                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-white/50">Địa chỉ:</span>
                                                   </div>
                                                   <p className="text-[12px] font-bold text-slate-900 dark:text-white leading-relaxed italic line-clamp-3">
                                                      {emp.address || 'Chưa cập nhật địa điểm...'}
                                                   </p>
                                                </div>
                                             </div>
                                          </div>
                                          <div className="absolute left-[-10px] top-1/4 w-5 h-5 bg-white dark:bg-slate-950 rotate-45 border-l border-b border-black/5 dark:border-white/15" />
                                        </div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-3.5 border-b border-black/5 dark:border-white/5">
                                <div className="space-y-1 min-w-[180px]">
                                    <div className="text-slate-800 dark:text-white/80 font-bold text-[11px] uppercase tracking-widest truncate">{emp.email}</div>
                                    <div className="text-slate-400 dark:text-white/50 text-[10px] font-black tracking-[0.2em] uppercase italic">{emp.phone || 'Chuẩn bị dữ liệu...'}</div>
                                </div>
                            </td>
                            <td className="px-6 py-3.5 border-b border-black/5 dark:border-white/5 text-center">
                                <div className="inline-flex flex-col items-center">
                                    <span className="px-3 py-1 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest mb-1">{emp.departmentName || 'CHUNG'}</span>
                                    <span className="text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-wider">{emp.positionName || 'NHÂN VIÊN'}</span>
                                </div>
                            </td>
                            <td className="px-6 py-3.5 border-b border-black/5 dark:border-white/5 text-center">
                               <StatusBadge status={emp.status} />
                            </td>
                            <td className="px-6 py-3.5 border-b border-black/5 dark:border-white/5 text-center">
                                <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase tracking-tight">{formatDate(emp.startDate)}</div>
                                <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 opacity-60">CHÍNH THỨC</div>
                            </td>
                            <td className="px-6 py-3.5 border-b border-black/5 dark:border-white/5 text-right">
                                <div className="text-emerald-600 dark:text-emerald-400 font-black tracking-widest text-[13px]">{formatVND(emp.baseSalary)}</div>
                            </td>
                            <td className="px-6 py-3.5 border-b border-black/5 dark:border-white/5 text-right pr-6">
                                <div className="flex items-center justify-end gap-3">
                                    <Link
                                        href={`/employees/${emp.id}${canEdit ? '?edit=1' : ''}`}
                                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-xl shadow-indigo-600/20 transition-all active:scale-95 group/btn"
                                        title="Xem chi tiết & Quản lý"
                                    >
                                        <Eye className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                    </Link>
                                </div>
                            </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Container - Bright Style */}
      <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 mt-6 pt-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 px-4 py-2 rounded-2xl shadow-sm">
             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Hiển thị:</span>
             <select
               value={pageSize}
               onChange={(e) => setPageSize(Number(e.target.value))}
               className="bg-transparent border-none text-[11px] font-black text-slate-900 dark:text-white outline-none cursor-pointer p-0"
             >
               {[10, 20, 50].map(s => <option key={s} value={s} className="bg-slate-900 text-white">{s} dòng</option>)}
             </select>
          </div>
          <div className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">
            Tổng cộng: <span className="text-slate-900 dark:text-white">{totalItems} nhân sự</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-black/5 dark:border-white/10 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
          </button>
          <div className="px-6 py-2 bg-indigo-600 dark:bg-indigo-500 text-white rounded-full text-[10px] font-black tracking-widest shadow-xl shadow-indigo-500/30 uppercase">
             Trang {currentPage} / {totalPages || 1}
          </div>
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="w-10 h-10 flex items-center justify-center rounded-xl border border-black/5 dark:border-white/10 text-slate-400 hover:text-indigo-600 transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
          </button>
        </div>
      </div>
    </div>
  );
}
