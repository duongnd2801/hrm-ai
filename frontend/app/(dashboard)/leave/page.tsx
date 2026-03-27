'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [showForm, setShowForm] = useState(false);

  const role = session?.role ?? null;
  const isAdminOrHR = role === 'HR' || role === 'ADMIN';
  const canReview = role === 'MANAGER' || role === 'HR' || role === 'ADMIN';
  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const loadData = useCallback(async () => {
    try {
      const [myRes, pendingRes] = await Promise.all([
        api.get<LeaveRequest[]>('/api/leave-requests/my'),
        canReview ? api.get<LeaveRequest[]>('/api/leave-requests/pending') : Promise.resolve({ data: [] as LeaveRequest[] }),
      ]);
      setMyItems(myRes.data ?? []);
      setPendingItems(pendingRes.data ?? []);
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
      // Admin defaults to hidden form to focus on approval
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
    } catch (err: any) {
      pushToast('error', err.response?.data || 'Gửi đơn thất bại.');
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

  return (
    <div className="space-y-12 pb-24">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Header */}
      <div className="pt-10 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-[0.8]">
              Nghỉ phép<br/>& Công tác
            </h1>
            <div className="flex items-center gap-4 mt-6 ml-2">
               <span className="w-8 h-1 bg-emerald-500 rounded-full" />
               <p className="text-sm font-bold text-white/40 uppercase tracking-[0.4em] italic">Đăng ký & Phê duyệt vắng mặt</p>
            </div>
         </div>
         
         {isAdminOrHR && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              {showForm ? 'Hủy' : 'Đăng ký nghỉ cá nhân'}
            </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Left Side: Registration Form */}
         {showForm && (
            <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
               <div className="bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                     Đăng ký nghỉ
                  </h3>

                  <div className="space-y-6">
                     <div>
                       <label className="block text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Loại hình nghỉ</label>
                       <div className="relative">
                          <select
                            value={type}
                            onChange={(e) => setType(e.target.value as LeaveType)}
                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none shadow-inner select-none"
                          >
                            {leaveTypeOptions.map((option) => (
                              <option key={option.value} value={option.value} className="bg-slate-900">
                                {option.label}
                              </option>
                            ))}
                          </select>
                          <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-white/30">
                             <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" /></svg>
                          </div>
                       </div>
                     </div>
                     
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                       <div>
                         <label className="block text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Bắt đầu</label>
                         <input
                           type="date"
                           value={startDate}
                           onChange={(e) => setStartDate(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                         />
                       </div>
                       <div>
                         <label className="block text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Kết thúc</label>
                         <input
                           type="date"
                           value={endDate}
                           onChange={(e) => setEndDate(e.target.value)}
                           className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 shadow-inner"
                         />
                       </div>
                     </div>

                     <div>
                       <label className="block text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Lý do cụ thể</label>
                       <textarea
                         rows={4}
                         value={reason}
                         onChange={(e) => setReason(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500/50 resize-none shadow-inner"
                       />
                     </div>

                     <button
                       onClick={() => void submit()}
                       disabled={loading || !reason.trim()}
                       className="w-full py-5 bg-emerald-500 hover:bg-emerald-400 disabled:bg-white/10 disabled:text-white/20 text-slate-950 font-black uppercase tracking-[0.2em] rounded-[26px] transition-all shadow-2xl active:scale-95"
                     >
                       {loading ? '...' : 'GỬI ĐƠN XÉT DUYỆT'}
                     </button>
                  </div>
               </div>

               {/* Snapshot Section */}
               <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-white/5 shadow-3xl max-h-[300px] flex flex-col">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 px-1">Lịch sử cá nhân</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                     {myItems.map(item => (
                        <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/[0.08] transition-all">
                           <div className="text-left">
                              <p className="text-white font-bold text-[10px] truncate w-32">{leaveTypeOptions.find(t=>t.value===item.type)?.label}</p>
                              <p className="text-[9px] text-white/30 font-black tracking-widest mt-0.5">{formatDate(item.startDate)}</p>
                           </div>
                           <StatusBadge status={item.status} />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* Center/Right Side: Approval Console (Full width if no form) */}
         <div className={showForm ? 'xl:col-span-8' : 'xl:col-span-12'}>
            {canReview ? (
               <div className="bg-white/5 backdrop-blur-3xl rounded-[48px] border border-white/10 shadow-3xl flex flex-col h-full overflow-hidden min-h-[600px]">
                  <div className="p-10 border-b border-white/10 flex items-center justify-between bg-white-[0.02]">
                     <div>
                        <h3 className="text-3xl font-black text-white uppercase tracking-tighter">Phê duyệt vắng mặt</h3>
                        <p className="text-xs font-bold text-white/30 uppercase tracking-[0.3em] mt-1">Đơn đăng ký nghỉ phép của nhân viên</p>
                     </div>
                     <div className="px-6 py-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20 flex items-center gap-4">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                        <span className="text-emerald-400 font-black text-sm tracking-widest">{pendingItems.length} ĐƠN CHỜ DUYỆT</span>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-thin scrollbar-thumb-white/10">
                     {!pendingItems.length && (
                        <div className="flex flex-col items-center justify-center py-32 opacity-20">
                           <svg className="w-20 h-20 mb-6 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M5 13l4 4L19 7" /></svg>
                           <p className="text-xl font-black uppercase tracking-widest text-center">Không có đơn nghỉ phép<br/>nào cần xử lý</p>
                        </div>
                     )}

                     <div className={`grid grid-cols-1 ${!showForm ? 'md:grid-cols-2 gap-8' : 'gap-6'}`}>
                        {pendingItems.map(item => (
                          <div key={item.id} className="group relative bg-slate-900/60 p-8 rounded-[48px] border border-white/10 hover:border-emerald-500/50 transition-all duration-500 flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4">
                             <div className="space-y-6 flex-1">
                                <div className="flex items-center gap-6">
                                   <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-emerald-500 to-teal-800 flex items-center justify-center text-slate-900 font-black text-2xl shadow-xl shadow-emerald-500/10">
                                      {item.employeeName?.charAt(0) || '?'}
                                   </div>
                                   <div>
                                      <h4 className="text-2xl font-black text-white leading-none mb-2 group-hover:text-emerald-400 transition-colors uppercase tracking-tight">{item.employeeName}</h4>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest px-2.5 py-1 bg-emerald-500/10 rounded-lg border border-emerald-500/20 shadow-sm">
                                            {leaveTypeOptions.find(t=>t.value===item.type)?.label}
                                         </span>
                                         <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.1em]">{formatDate(item.startDate)} — {formatDate(item.endDate)}</span>
                                      </div>
                                   </div>
                                </div>
                                
                                <blockquote className="text-base text-white/50 italic leading-relaxed py-6 px-8 bg-white/5 rounded-[32px] border border-white/5 relative min-h-[120px] shadow-inner">
                                   <span className="absolute -left-2 -top-2 text-4xl text-white/5">"</span>
                                   {item.reason || 'Nhân viên không để lại lý do chi tiết.'}
                                </blockquote>
                             </div>
                             
                             <div className="flex flex-row gap-4 shrink-0">
                                <button 
                                  onClick={() => void review(item.id, true)}
                                  className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase tracking-[0.15em] rounded-[24px] transition-all shadow-xl shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
                                >
                                   PHÊ DUYỆT
                                </button>
                                <button 
                                  onClick={() => void review(item.id, false)}
                                  className="flex-1 py-5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-sm font-black uppercase tracking-[0.15em] rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                   TỪ CHỐI
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
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
