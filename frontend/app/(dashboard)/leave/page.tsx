'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { LeaveRequest, LeaveType } from '@/types';
import Toast, { ToastState } from '@/components/Toast';
import { formatDate } from '@/lib/utils';

const leaveTypeOptions: { value: LeaveType; label: string }[] = [
  { value: 'ANNUAL', label: 'Nghỉ phép năm' },
  { value: 'OT_LEAVE', label: 'Nghỉ bù OT' },
  { value: 'SICK', label: 'Nghỉ ốm' },
  { value: 'UNPAID', label: 'Nghỉ không lương' },
  { value: 'HALF_DAY_AM', label: 'Nghỉ nửa ngày sáng' },
  { value: 'HALF_DAY_PM', label: 'Nghỉ nửa ngày chiều' },
];

function StatusBadge({ status }: { status: LeaveRequest['status'] }) {
  const map: Record<LeaveRequest['status'], string> = {
    PENDING: 'bg-amber-500/20 text-amber-500 border-amber-500/10',
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/10',
    REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/10',
  };
  const label: Record<LeaveRequest['status'], string> = {
    PENDING: 'Đang xét duyệt',
    APPROVED: 'Đã chấp thuận',
    REJECTED: 'Bị từ chối',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function LeavePage() {
  const { session } = useSession();
  const [type, setType] = useState<LeaveType>('ANNUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [myItems, setMyItems] = useState<LeaveRequest[]>([]);
  const [pendingItems, setPendingItems] = useState<LeaveRequest[]>([]);
  const [reviewedItems, setReviewedItems] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [showForm, setShowForm] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

  const role = session?.role ?? null;
  const isAdminOrHR = role === 'HR' || role === 'ADMIN';
  const canReview = role === 'MANAGER' || role === 'HR' || role === 'ADMIN';
  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });
  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const data = error.response?.data;
      if (typeof data === 'string') return data;
      if (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string') {
        return data.message;
      }
    }
    fallback;
  };

  const loadData = useCallback(async () => {
    try {
      const tasks = [api.get<LeaveRequest[]>('/api/leave-requests/my')];
      if (canReview) {
        tasks.push(api.get<LeaveRequest[]>('/api/leave-requests/pending'));
        tasks.push(api.get<LeaveRequest[]>('/api/leave-requests/reviewed'));
      }
      
      const res = await Promise.all(tasks);
      setMyItems(res[0].data ?? []);
      if (canReview) {
        setPendingItems(res[1]?.data ?? []);
        setReviewedItems(res[2]?.data ?? []);
      }
    } catch {
      pushToast('error', 'Không thể đồng bộ dữ liệu nghỉ phép.');
    }
  }, [canReview]);

  useEffect(() => {
    if (session) {
      void loadData();
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      setEndDate(today);
      setShowForm(!isAdminOrHR);
    }
  }, [session, loadData, isAdminOrHR]);

  async function submit() {
    setLoading(true);
    try {
      await api.post('/api/leave-requests', { type, startDate, endDate, reason });
      setReason('');
      pushToast('success', 'Đã nộp đơn nghỉ phép thành công.');
      await loadData();
      if (isAdminOrHR) setShowForm(false);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Gửi đơn thất bại.'));
    } finally {
      setLoading(false);
    }
  }

  async function review(id: string, approved: boolean) {
    try {
      await api.patch(`/api/leave-requests/${id}/${approved ? 'approve' : 'reject'}`);
      pushToast('success', approved ? 'Đã phê duyệt nghỉ phép.' : 'Đã bác bỏ đơn.');
      await loadData();
    } catch {
      pushToast('error', 'Xử lý đơn thất bại.');
    }
  }

  if (!session) return null;

  const currentDisplayItems = activeTab === 'pending' ? pendingItems : reviewedItems;

  return (
    <div className="space-y-12 pb-24">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Header */}
      <div className="pt-10 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-[0.8]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Nghỉ phép<br/>& Công tác
            </h1>
            <div className="flex items-center gap-4 mt-6 ml-2">
               <span className="w-8 h-1 bg-emerald-500 rounded-full" />
               <p className="text-sm font-bold uppercase tracking-[0.4em] italic text-white/80" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Phê duyệt & Quản lý vắng mặt</p>
            </div>
         </div>
         
         {isAdminOrHR && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl"
            >
              {showForm ? 'Hủy' : 'Đăng ký nghỉ cá nhân'}
            </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Left Side: Registration Form */}
         {showForm && (
            <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
               <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                     Đăng ký nghỉ
                  </h3>

                  <div className="space-y-6">
                     <div>
                       <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Loại hình nghỉ</label>
                       <select
                         value={type}
                         onChange={(e) => setType(e.target.value as LeaveType)}
                         className="w-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-5 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none shadow-inner"
                       >
                         {leaveTypeOptions.map((option) => (
                           <option key={option.value} value={option.value} className="bg-white text-slate-900 dark:bg-slate-900 dark:text-white uppercase">
                             {option.label}
                           </option>
                         ))}
                       </select>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Bắt đầu</label>
                         <input
                           type="date"
                           value={startDate}
                           onChange={(e) => setStartDate(e.target.value)}
                           className="w-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none shadow-inner"
                         />
                       </div>
                       <div>
                         <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Kết thúc</label>
                         <input
                           type="date"
                           value={endDate}
                           onChange={(e) => setEndDate(e.target.value)}
                           className="w-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none shadow-inner"
                         />
                       </div>
                     </div>

                     <div>
                       <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Lý do cụ thể</label>
                       <textarea
                         rows={4}
                         value={reason}
                         onChange={(e) => setReason(e.target.value)}
                         className="w-full bg-slate-100 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-inner"
                       />
                     </div>

                     <button
                       onClick={() => void submit()}
                       disabled={loading || !reason.trim()}
                       className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-200 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-white/20 text-slate-950 font-black uppercase tracking-[0.2em] rounded-[26px] transition-all shadow-xl"
                     >
                       {loading ? '...' : 'GỬI ĐƠN XÉT DUYỆT'}
                     </button>
                  </div>
               </div>

               {/* My History Section */}
               <div className="bg-white/80 dark:bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/5 shadow-xl max-h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest mb-6 px-1">Lịch sử cá nhân</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-white/10">
                     {myItems.map(item => (
                        <div key={item.id} className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 flex justify-between items-center group hover:bg-slate-100 dark:hover:bg-white/[0.08] transition-all">
                           <div className="text-left w-3/5">
                              <p className="text-slate-900 dark:text-white font-bold text-[11px] truncate uppercase">{leaveTypeOptions.find(t=>t.value===item.type)?.label}</p>
                           </div>
                           <StatusBadge status={item.status} />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* Center/Right Side: Approval Console */}
         <div className={showForm ? 'xl:col-span-8' : 'xl:col-span-12'}>
            {canReview ? (
               <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[48px] border border-black/5 dark:border-white/10 shadow-3xl flex flex-col h-full overflow-hidden min-h-[700px]">
                  {/* Header & Tabs */}
                  <div className="p-10 border-b border-black/5 dark:border-white/10 space-y-10">
                     <div className="flex items-center justify-between">
                        <div>
                           <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">PHÊ DUYỆT VẮNG MẶT</h3>
                           <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.3em] mt-1 italic">Hệ thống quản lý đơn từ tập trung</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-[24px] border border-black/5 dark:border-white/10">
                           <button 
                             onClick={() => setActiveTab('pending')}
                             className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'}`}
                           >
                              Chờ duyệt ({pendingItems.length})
                           </button>
                           <button 
                             onClick={() => setActiveTab('history')}
                             className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-emerald-500 text-slate-900 shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'}`}
                           >
                              Lịch sử ({reviewedItems.length})
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-x-auto text-slate-900 dark:text-white">
                     <table className="w-full border-collapse">
                        <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/40 text-slate-600 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                           <tr>
                              <th className="px-8 py-6 text-left rounded-tl-3xl whitespace-nowrap">NHÂN VIÊN</th>
                              <th className="px-8 py-6 text-left whitespace-nowrap text-center">LOẠI HÌNH</th>
                              <th className="px-8 py-6 text-left whitespace-nowrap text-center">THỜI GIAN</th>
                              <th className="px-8 py-6 text-left whitespace-nowrap text-center">TRẠNG THÁI</th>
                              {activeTab === 'pending' && <th className="px-8 py-6 text-right rounded-tr-3xl whitespace-nowrap">HÀNH ĐỘNG</th>}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5 bg-white/5">
                           {!currentDisplayItems.length && (
                              <tr>
                                 <td colSpan={5} className="py-32 text-center opacity-30 italic font-bold">
                                    Không có dữ liệu hiển thị.
                                 </td>
                              </tr>
                           )}
                           {currentDisplayItems.map(item => (
                              <tr key={item.id} className="group hover:bg-white/10 transition-colors">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-800 flex items-center justify-center text-white font-black text-sm uppercase">
                                          {item.employeeName?.charAt(0) || '?'}
                                       </div>
                                       <div>
                                          <p className="font-black uppercase text-xs tracking-tight">{item.employeeName}</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-white/60 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/10 uppercase tracking-widest">
                                       {leaveTypeOptions.find(t=>t.value===item.type)?.label}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="space-y-1">
                                       <p className="font-bold text-[11px] uppercase tracking-tighter">{formatDate(item.startDate)}</p>
                                       <p className="text-[9px] text-slate-400 dark:text-white/20 font-black uppercase tracking-[0.1em]">Đến {formatDate(item.endDate)}</p>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    {activeTab === 'pending' ? (
                                       <p className="text-[10px] italic font-medium line-clamp-1 max-w-[150px] uppercase opacity-50">&quot;{item.reason || '...'}&quot;</p>
                                    ) : (
                                       <StatusBadge status={item.status} />
                                    )}
                                 </td>
                                 {activeTab === 'pending' && (
                                    <td className="px-8 py-6 text-right">
                                       <div className="flex items-center justify-end gap-3 transition-all shrink-0">
                                          <button 
                                             onClick={() => void review(item.id, true)}
                                             className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all"
                                          >
                                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                          </button>
                                          <button 
                                             onClick={() => void review(item.id, false)}
                                             className="w-10 h-10 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex items-center justify-center border border-rose-500/20 active:scale-90 transition-all font-black text-xs"
                                          >
                                             ✕
                                          </button>
                                       </div>
                                    </td>
                                 )}
                              </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </div>
            ) : (
               <div className="bg-emerald-950/30 backdrop-blur-3xl rounded-[48px] border border-white/5 p-20 flex flex-col items-center text-center space-y-12 h-full justify-center">
                  <div className="w-32 h-32 bg-emerald-500/10 rounded-[40px] flex items-center justify-center text-emerald-400 shadow-3xl shadow-emerald-500/5 transform rotate-3 active:rotate-0 transition-transform">
                     <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Hồ sơ nghỉ phép</h2>
                     <p className="text-lg text-white/30 max-w-lg italic font-medium">Lịch sử và các yêu cầu vắng mặt cá nhân của bạn sẽ được hiển thị và quản lý tại đây.</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <div className="px-10 py-6 bg-white/5 rounded-[36px] border border-white/10">
                        <span className="block text-3xl font-black text-indigo-400">{myItems.length}</span>
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest mt-1">Đã nộp</span>
                     </div>
                     <div className="px-10 py-6 bg-white/5 rounded-[36px] border border-white/10">
                        <span className="block text-3xl font-black text-emerald-400">{myItems.filter(i=>i.status==='APPROVED').length}</span>
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest mt-1">Hợp lệ</span>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
   </div>
  );
}
