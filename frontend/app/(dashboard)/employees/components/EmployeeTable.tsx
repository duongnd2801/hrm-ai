'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/components/AuthProvider';
import { hasRole } from '@/lib/auth';
import api from '@/lib/api';
import Avatar from '@/components/Avatar';
import { Employee } from '@/types';
import { formatDate, formatVND } from '@/lib/utils';

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
    <span className={`inline-flex items-center py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-transparent ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function EmployeeTable({ search = '' }: { search?: string }) {
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
                page: currentPage - 1, // Backend is 0-indexed
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
  }, [search, currentPage, pageSize]);

  useEffect(() => {
    const handler = setTimeout(() => {
       setCurrentPage(1);
    }, 500);
    return () => clearTimeout(handler);
  }, [search]);

  const canManageGlobal = hasRole('ADMIN', 'HR');

  // Pagination Logic
  const totalPages = Math.ceil(totalItems / pageSize);
  const paginatedEmployees = employees; // Already paged from backend

  return (
    <div className="w-full relative">
      <div className={`w-full overflow-x-auto scrollbar-thin scrollbar-thumb-black/10 dark:scrollbar-thumb-white/10 pb-4 bg-transparent border-none transition-opacity duration-300 ${loading ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
        <table className="min-w-[1100px] w-full text-left">
          <thead className="text-[10px] uppercase tracking-[0.2em] bg-slate-900/5 dark:bg-white/5 border-y border-black/5 dark:border-white/10 text-slate-500 dark:text-white/40 font-black">
            <tr>
              <th className="px-6 py-5 rounded-tl-2xl">Nhân viên</th>
              <th className="px-6 py-5">Liên lạc</th>
              <th className="px-6 py-5">Cơ cấu & Vị trí</th>
              <th className="px-6 py-5">Trạng thái</th>
              <th className="px-6 py-5 w-[100px]">Ngày vào</th>
              <th className="px-6 py-5">Lương cơ bản</th>
              <th className="px-6 py-5 text-right pr-6 rounded-tr-2xl">Tác vụ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-black/5 dark:divide-white/5 text-sm min-h-[500px]">
            {loading && employees.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-20 text-center font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">
                        Đang chuẩn bị dữ liệu...
                    </td>
                </tr>
            ) : employees.length === 0 ? (
                <tr>
                    <td colSpan={7} className="px-6 py-20 text-center font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.3em]">
                        Không tìm thấy nhân viên nào
                    </td>
                </tr>
            ) : (
                paginatedEmployees.map((emp) => {
                    const isSelf = session?.employeeId === emp.id;
                    const canEdit = canManageGlobal || isSelf;

                    return (
                        <tr key={emp.id} className="hover:bg-slate-900/5 dark:hover:bg-white/[0.03] transition-colors duration-200 group">
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-4 min-w-[220px]">
                                    <div className="relative shrink-0 group/avatar z-10 cursor-default">
                                        <Avatar name={emp.fullName} size="md" />
                                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-white dark:border-slate-900 ${emp.status === 'ACTIVE' ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-slate-400 dark:bg-slate-500 shadow-slate-500/50'}`} />
                                        
                                        <div className="absolute left-14 top-1/2 -translate-y-1/2 w-[300px] opacity-0 invisible group-hover/avatar:opacity-100 group-hover/avatar:visible transition-all duration-300 z-[999]">
                                            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-3xl p-5 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.8)] ml-4">
                                               <div className="flex items-center gap-4 mb-5">
                                                  <Avatar name={emp.fullName} size="lg" />
                                                  <div className="flex-1 min-w-0">
                                                     <h4 className="font-black text-sm text-slate-900 dark:text-white uppercase tracking-widest truncate">{emp.fullName}</h4>
                                                     <p className="text-[10px] text-slate-500 dark:text-white/40 uppercase tracking-widest truncate mt-0.5">{emp.positionName || 'Nhân viên'}</p>
                                                  </div>
                                               </div>
                                               <div className="space-y-2 text-xs font-bold text-slate-700 dark:text-white/80">
                                                  <div className="flex justify-between items-center bg-slate-900/5 dark:bg-white/5 py-2 px-3 rounded-xl">
                                                     <span className="text-slate-500 dark:text-white/40 uppercase text-[9px] tracking-widest">Phòng ban</span>
                                                     <span className="truncate">{emp.departmentName || 'Chung'}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center bg-slate-900/5 dark:bg-white/5 py-2 px-3 rounded-xl">
                                                     <span className="text-slate-500 dark:text-white/40 uppercase text-[9px] tracking-widest">SĐT</span>
                                                     <span className="truncate">{emp.phone || 'Chưa cập nhật'}</span>
                                                  </div>
                                                  <div className="flex justify-between items-center bg-slate-900/5 dark:bg-white/5 py-2 px-3 rounded-xl">
                                                     <span className="text-slate-500 dark:text-white/40 uppercase text-[9px] tracking-widest">Quản lý</span>
                                                     <span className="truncate max-w-[120px]" title={emp.managerName || 'Không có'}>{emp.managerName || 'Không có'}</span>
                                                  </div>
                                               </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <Link href={`/employees/${emp.id}`} className="font-black text-slate-900 dark:text-white text-[13px] leading-tight hover:text-indigo-600 dark:hover:text-indigo-400 block transition-colors uppercase tracking-widest truncate" title={emp.fullName}>{emp.fullName}</Link>
                                        <div className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em] mt-1">ID: {emp.id.split('-')[0]}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="space-y-1.5 min-w-[160px]">
                                    <div className="text-slate-800 dark:text-white/80 font-bold text-[11px] uppercase tracking-widest truncate" title={emp.email}>{emp.email}</div>
                                    <div className="flex items-center gap-1.5">
                                       <svg className="w-3 h-3 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                       <span className="text-slate-500 dark:text-white/50 text-[10px] font-bold tracking-[0.1em]">{emp.phone || 'Chưa có SĐT'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <div className="space-y-2 min-w-[160px]">
                                    <div className="flex items-center gap-2">
                                       <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 rounded text-[9px] font-black uppercase tracking-widest truncate max-w-[100px]" title={emp.departmentName || 'Chung'}>{emp.departmentName || 'Chung'}</span>
                                       <span className="text-slate-800 dark:text-white/90 font-bold text-[11px] uppercase tracking-widest truncate flex-1" title={emp.positionName || 'Nhân viên'}>{emp.positionName || 'Nhân viên'}</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-slate-500 dark:text-white/40">
                                       <svg className="w-3 h-3 text-slate-400 dark:text-white/30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                          <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                       </svg>
                                       <span className="text-[10px] font-bold tracking-widest uppercase truncate max-w-[140px]" title={emp.managerName ? `QL: ${emp.managerName}` : 'Không có Quản lý'}>{emp.managerName || 'Không quản lý'}</span>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                               <StatusBadge status={emp.status} />
                            </td>
                            <td className="px-6 py-5 text-slate-500 dark:text-white/50 font-black tracking-widest text-[10px] uppercase">
                                {formatDate(emp.startDate)}
                            </td>
                            <td className="px-6 py-5">
                                <div className="text-emerald-600 dark:text-emerald-400 font-black tracking-widest text-[13px]">{formatVND(emp.baseSalary)}</div>
                            </td>
                            <td className="px-6 py-5 text-right pr-6 whitespace-nowrap">
                                <Link
                                    href={`/employees/${emp.id}${isSelf ? '?edit=1' : ''}`}
                                    className="inline-flex items-center justify-center whitespace-nowrap px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 text-slate-600 dark:text-white hover:bg-indigo-50 dark:hover:bg-white/10 hover:text-indigo-600 dark:hover:text-white transition-all shadow-sm active:scale-95 duration-200"
                                >
                                    {canEdit ? (
                                        <>
                                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                            </svg>
                                            SỬA
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-3.5 h-3.5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                            XEM
                                        </>
                                    )}
                                </Link>
                            </td>
                        </tr>
                    );
                })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="flex items-center justify-between border-t border-black/5 dark:border-white/10 mt-6 pt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-indigo-500/5 dark:bg-indigo-500/10 border border-indigo-500/10 px-3 py-1.5 rounded-xl shadow-sm">
             <span className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">Xem:</span>
             <select
               value={pageSize}
               onChange={(e) => {
                 setPageSize(Number(e.target.value));
                 setCurrentPage(1);
               }}
               className="bg-transparent border-none text-[10px] font-black text-slate-900 dark:text-white transition-all outline-none cursor-pointer p-0"
             >
               {[10, 15, 20].map(s => <option key={s} value={s} className="bg-slate-950 text-white">{s} dòng</option>)}
             </select>
          </div>
          <div className="px-3 py-1.5 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/10 rounded-xl shadow-sm group">
             <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest group-hover:scale-105 transition-transform inline-block">Tổng {totalItems} nhân sự</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1 || loading}
            className="p-2.5 rounded-xl border border-black/5 dark:border-white/10 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-500/5 dark:hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="px-5 py-2.5 bg-indigo-600 dark:bg-indigo-500 text-white rounded-xl text-[10px] font-black tracking-widest shadow-xl shadow-indigo-500/30 scale-105 border border-indigo-400/20">
            TRANG {currentPage} / {totalPages || 1}
          </div>

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages || totalPages === 0 || loading}
            className="p-2.5 rounded-xl border border-black/5 dark:border-white/10 text-slate-400 hover:text-indigo-600 dark:hover:text-white hover:bg-indigo-500/5 dark:hover:bg-white/10 disabled:opacity-20 transition-all active:scale-90"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
