'use client';

import { useCallback, useEffect, useState } from 'react';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { OTRequest } from '@/types';
import Toast, { ToastState } from '@/components/Toast';
import { formatDate } from '@/lib/utils';

function StatusBadge({ status }: { status: OTRequest['status'] }) {
  const map: Record<OTRequest['status'], string> = {
    PENDING: 'bg-amber-500/20 text-amber-500 border-amber-500/10',
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/10',
    REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/10',
  };
  const label: Record<OTRequest['status'], string> = {
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

export default function OTPage() {
  const { session } = useSession();
  const [date, setDate] = useState('');
  const [hours, setHours] = useState(2);
  const [reason, setReason] = useState('');
  const [myItems, setMyItems] = useState<OTRequest[]>([]);
  const [pendingItems, setPendingItems] = useState<OTRequest[]>([]);
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
        api.get<OTRequest[]>('/api/ot-requests/my'),
        canReview ? api.get<OTRequest[]>('/api/ot-requests/pending') : Promise.resolve({ data: [] as OTRequest[] }),
      ]);
      setMyItems(myRes.data ?? []);
      setPendingItems(pendingRes.data ?? []);
    } catch {
      pushToast('error', 'Không thể đồng bộ dữ liệu tăng ca.');
    }
  }, [canReview]);

  useEffect(() => {
    if (session) {
      void loadData();
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(!isAdminOrHR);
    }
  }, [session, loadData, isAdminOrHR]);

  async function submit() {
    setLoading(true);
    try {
      await api.post('/api/ot-requests', { date, hours, reason });
      setReason('');
      pushToast('success', 'Đã nộp đơn đăng ký OT thành công.');
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
      await api.patch(`/api/ot-requests/${id}/${approved ? 'approve' : 'reject'}`);
      pushToast('success', approved ? 'Đã phê duyệt OT.' : 'Đã bác bỏ đơn OT.');
      await loadData();
    } catch {
      pushToast('error', 'Xử lý đơn thất bại.');
    }
  }

  if (!session) return null;

  return (
    <div className="space-y-12 pb-24 text-white">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Header */}
      <div className="pt-10 mb-2 flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-[0.8]">
              Tăng ca<br/>& Overtime
            </h1>
            <div className="flex items-center gap-4 mt-6 ml-2">
               <span className="w-8 h-1 bg-amber-500 rounded-full" />
               <p className="text-sm font-bold uppercase tracking-[0.4em] italic" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Đăng ký làm thêm & Phê duyệt</p>
            </div>
         </div>
         
         {isAdminOrHR && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-4 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-2xl border border-black/5 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl dark:shadow-amber-500/5 items-center gap-2 flex"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              {showForm ? 'Hủy bỏ' : 'Đăng ký OT cá nhân'}
            </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Left Side: Registration Form */}
         {showForm && (
            <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
               <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-amber-500 rounded-full" />
                     Đăng ký OT
                  </h3>

                  <div className="space-y-6">
                     <div>
                       <label className="block text-slate-400 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Ngày làm thêm</label>
                       <input
                         type="date"
                         value={date}
                         onChange={(e) => setDate(e.target.value)}
                         className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-slate-400 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Số giờ (dự kiến)</label>
                       <input
                         type="number"
                         step={0.5}
                         value={hours}
                         onChange={(e) => setHours(Number(e.target.value))}
                         className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50 shadow-inner"
                       />
                     </div>

                     <div>
                       <label className="block text-slate-400 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Mục tiêu công việc</label>
                       <textarea
                         rows={4}
                         value={reason}
                         onChange={(e) => setReason(e.target.value)}
                         placeholder="Nêu rõ công việc sẽ thực hiện..."
                         className="w-full bg-slate-900/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-amber-500/50 resize-none shadow-inner"
                       />
                     </div>

                     <button
                       onClick={() => void submit()}
                       disabled={loading || !reason.trim()}
                       className="w-full py-5 bg-amber-500 hover:bg-amber-400 disabled:bg-slate-900/10 dark:disabled:bg-white/10 disabled:text-slate-900/20 dark:disabled:text-white/20 text-slate-950 font-black uppercase tracking-[0.2em] rounded-[26px] transition-all shadow-2xl active:scale-95"
                     >
                       {loading ? '...' : 'GỬI ĐĂNG KÝ'}
                     </button>
                  </div>
               </div>

               {/* Snapshot Section */}
               <div className="bg-slate-900/5 dark:bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/5 shadow-xl dark:shadow-3xl max-h-[300px] flex flex-col items-center justify-center opacity-60 italic text-[10px] text-slate-400 dark:text-white/20 space-y-4">
                  <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  <p className="text-center font-black uppercase tracking-widest">Đơn OT cá nhân sẽ hiển thị tại đây</p>
               </div>
            </div>
         )}

         {/* Center/Right Side: Approval Console (Full width if no form) */}
         <div className={showForm ? 'xl:col-span-8' : 'xl:col-span-12'}>
            {canReview ? (
               <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[48px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl flex flex-col h-full overflow-hidden min-h-[600px]">
                  <div className="p-10 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/[0.02]">
                     <div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">PHÊ DUYỆT TĂNG CA</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.3em] mt-1">Đơn đăng ký OT của nhân viên</p>
                     </div>
                     <div className="px-6 py-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 flex items-center gap-4">
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping" />
                        <span className="text-amber-600 dark:text-amber-500 font-black text-sm tracking-widest uppercase">{pendingItems.length} ĐƠN ĐANG CHỜ</span>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-thin scrollbar-thumb-slate-900/10 dark:scrollbar-thumb-white/10">
                     {!pendingItems.length && (
                        <div className="flex flex-col items-center justify-center py-32 opacity-20">
                           <svg className="w-20 h-20 mb-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           <p className="text-xl font-black uppercase tracking-widest text-center">Tất cả đơn tăng ca<br/>đã được xử lý</p>
                        </div>
                     )}

                     <div className={`grid grid-cols-1 ${!showForm ? 'md:grid-cols-2 gap-8' : 'gap-6'}`}>
                        {pendingItems.map(item => (
                          <div key={item.id} className="group relative bg-white/80 dark:bg-slate-900/60 p-8 rounded-[48px] border border-black/5 dark:border-white/10 hover:border-amber-500/50 transition-all duration-500 flex flex-col gap-10 animate-in fade-in slide-in-from-bottom-4 shadow-xl">
                             <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-6">
                                   <div className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-amber-500 to-amber-800 flex items-center justify-center text-slate-950 font-black text-2xl shadow-xl shadow-amber-500/20 ring-2 ring-white/5">
                                      {item.employeeName?.charAt(0) || '?'}
                                   </div>
                                   <div>
                                      <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors uppercase tracking-tight">{item.employeeName}</h4>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/20 shadow-sm">
                                            {item.hours} GIỜ OT
                                         </span>
                                         <span className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.1em] italic">{formatDate(item.date)}</span>
                                      </div>
                                   </div>
                                </div>
                                
                                <p className="text-base text-slate-600 dark:text-white/60 italic leading-relaxed py-6 px-8 bg-slate-900/5 dark:bg-white/10 rounded-[32px] border border-black/5 dark:border-white/10 flex-1 shadow-inner min-h-[80px]">
                                   "{item.reason || 'Mục tiêu hoàn thành công việc hệ thống.'}"
                                </p>
                             </div>
                             
                             <div className="flex flex-row gap-4 shrink-0">
                                <button 
                                  onClick={() => void review(item.id, true)}
                                  className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-black text-sm uppercase tracking-[0.15em] rounded-[24px] transition-all shadow-xl shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
                                >
                                   XÁC NHẬN
                                </button>
                                <button 
                                  onClick={() => void review(item.id, false)}
                                  className="flex-1 py-5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-sm font-black uppercase tracking-[0.15em] rounded-[24px] transition-all active:scale-95 flex items-center justify-center gap-2"
                                >
                                   BÁC BỎ
                                </button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
            ) : (
               <div className="bg-amber-950/20 backdrop-blur-3xl rounded-[48px] border border-white/5 p-20 flex flex-col items-center text-center space-y-12 h-full justify-center opacity-90">
                  <div className="w-32 h-32 bg-amber-500/10 rounded-[40px] flex items-center justify-center text-amber-500 shadow-3xl shadow-amber-500/5 rotate-6 active:rotate-0 transition-transform">
                     <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="space-y-4 px-6 md:px-0">
                     <h2 className="text-5xl font-black text-white uppercase tracking-tighter leading-none">Cống hiến & Nỗ lực</h2>
                     <p className="text-lg text-white/30 max-w-sm italic font-medium mx-auto">Mọi giờ làm thêm của bạn đều giúp dự án tiến xa hơn và sẽ được ghi nhận xứng đáng.</p>
                  </div>
                  <div className="flex gap-4 pt-4">
                     <div className="px-10 py-6 bg-white/5 rounded-[36px] border border-white/10 min-w-[140px]">
                        <span className="block text-3xl font-black text-amber-500">{myItems.length}</span>
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest mt-1">Đã nộp</span>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
