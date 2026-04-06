'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { OTRequest } from '@/types';
import Toast, { ToastState } from '@/components/Toast';
import { formatDate } from '@/lib/utils';

function StatusBadge({ status }: { status: OTRequest['status'] }) {
  const map: Record<OTRequest['status'], string> = {
    PENDING: 'bg-amber-500/20 text-amber-500 border-amber-500/20',
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
  };
  const label: Record<OTRequest['status'], string> = {
    PENDING: 'Chờ duyệt',
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
  const [hours, setHours] = useState(1);
  const [reason, setReason] = useState('');
  const [myItems, setMyItems] = useState<OTRequest[]>([]);
  const [pendingItems, setPendingItems] = useState<OTRequest[]>([]);
  const [reviewedItems, setReviewedItems] = useState<OTRequest[]>([]);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [loading, setLoading] = useState(false);
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
    return fallback;
  };

  const loadData = useCallback(async () => {
    try {
      const tasks = [api.get<OTRequest[]>('/api/ot-requests/my')];
      if (canReview) {
        tasks.push(api.get<OTRequest[]>('/api/ot-requests/pending'));
        tasks.push(api.get<OTRequest[]>('/api/ot-requests/reviewed'));
      }
      
      const res = await Promise.all(tasks);
      setMyItems(res[0].data ?? []);
      if (canReview) {
        setPendingItems(res[1]?.data ?? []);
        setReviewedItems(res[2]?.data ?? []);
      }
    } catch {
      pushToast('error', 'Lỗi khi đồng bộ dữ liệu tăng ca.');
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
      pushToast('success', 'Đã nộp đơn OT thành công.');
      await loadData();
      if (isAdminOrHR) setShowForm(false);
    } catch {
      pushToast('error', 'Gửi đơn thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function review(id: string, approved: boolean) {
    try {
      await api.patch(`/api/ot-requests/${id}/${approved ? 'approve' : 'reject'}`);
      pushToast('success', approved ? 'Đã phê duyệt OT.' : 'Đã bác bỏ đơn.');
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
               Tăng ca<br/>& Overtime
            </h1>
            <div className="flex items-center gap-4 mt-6 ml-2">
               <span className="w-8 h-1 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
               <p className="text-sm font-bold uppercase tracking-[0.4em] italic text-white/80" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Phê duyệt & Ghi nhận ngoài giờ</p>
            </div>
         </div>
         
         {isAdminOrHR && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95"
            >
              {showForm ? 'Hủy' : 'Đăng ký tăng ca'}
            </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Left Side: Creation Form */}
         {showForm && (
            <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
               <div className="bg-white/80 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] p-8 border border-white/10 shadow-3xl">
                  <h3 className="text-lg font-black text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                     <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                     Ghi nhận ca
                  </h3>

                  <div className="space-y-6">
                     <div>
                       <label className="block text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Ngày thực hiện</label>
                       <input
                         type="date"
                         value={date}
                         onChange={(e) => setDate(e.target.value)}
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold outline-none shadow-inner"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Số giờ OT dự kiến</label>
                       <div className="flex items-center gap-4">
                         <input
                           type="range"
                           min={1}
                           max={12}
                           step={0.5}
                           value={hours}
                           onChange={(e) => setHours(parseFloat(e.target.value))}
                           className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                         />
                         <span className="w-16 text-center text-rose-400 font-black text-lg">{hours}h</span>
                       </div>
                     </div>

                     <div>
                       <label className="block text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Giải trình công việc</label>
                       <textarea
                         rows={4}
                         value={reason}
                         onChange={(e) => setReason(e.target.value)}
                         placeholder="VD: Fix bug gấp chuẩn bị release..."
                         className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold outline-none focus:ring-2 focus:ring-rose-500/50 resize-none shadow-inner"
                       />
                     </div>

                     <button
                       onClick={() => void submit()}
                       disabled={loading || !reason.trim()}
                       className="w-full py-5 bg-rose-600 hover:bg-rose-500 disabled:bg-white/10 disabled:text-white/20 text-white font-black uppercase tracking-[0.2em] rounded-[26px] transition-all shadow-xl shadow-rose-500/10"
                     >
                       {loading ? '...' : 'GỬI ĐƠN PHÊ DUYỆT'}
                     </button>
                  </div>
               </div>

               {/* My OT Statistics */}
               <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-white/5 shadow-3xl max-h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-6 px-1">Lịch sử cá nhân</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                     {myItems.map(item => (
                        <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all flex justify-between items-center group">
                           <div className="text-left w-2/3">
                              <p className="text-white font-bold text-[11px] truncate uppercase">{formatDate(item.date)}</p>
                              <p className="text-[10px] text-rose-400 font-black mt-0.5">{item.hours} GIỜ TĂNG CA</p>
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
                           <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Kiểm soát OT</h3>
                           <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.3em] mt-1 italic">Quản lý định mức làm việc ngoài giờ</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-[24px] border border-black/5 dark:border-white/10">
                           <button 
                             onClick={() => setActiveTab('pending')}
                             className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'}`}
                           >
                              Chưa duyệt ({pendingItems.length})
                           </button>
                           <button 
                             onClick={() => setActiveTab('history')}
                             className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-rose-600 text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'}`}
                           >
                              Đã xử lý ({reviewedItems.length})
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                     <table className="w-full border-collapse">
                        <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/40 text-slate-600 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-black/5 dark:border-white/5">
                           <tr>
                              <th className="px-8 py-6 text-left rounded-tl-3xl whitespace-nowrap">NHÂN VIÊN</th>
                              <th className="px-8 py-6 text-left whitespace-nowrap">CÔNG VIỆC</th>
                              <th className="px-8 py-6 text-left whitespace-nowrap text-center">ĐỊNH MỨC</th>
                              <th className="px-8 py-6 text-left whitespace-nowrap text-center">TRẠNG THÁI</th>
                              {activeTab === 'pending' && <th className="px-8 py-6 text-right rounded-tr-3xl whitespace-nowrap">HÀNH ĐỘNG</th>}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                           {!currentDisplayItems.length && (
                              <tr>
                                 <td colSpan={5} className="py-32 text-center opacity-30 italic font-bold text-slate-900 dark:text-white">
                                    Không có dữ liệu hiển thị.
                                 </td>
                              </tr>
                           )}
                           {currentDisplayItems.map(item => (
                              <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-800 flex items-center justify-center text-white font-black text-sm uppercase">
                                          {item.employeeName?.charAt(0) || '?'}
                                       </div>
                                       <div>
                                          <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{item.employeeName}</p>
                                          <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest mt-0.5">Nhân sự cấp dưới</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <p className="text-[11px] text-slate-600 dark:text-white/50 italic font-medium line-clamp-2 max-w-xs uppercase">&quot;{item.reason || '...'}&quot;</p>
                                 </td>
                                 <td className="px-8 py-6">
                                    <div className="space-y-1">
                                       <p className="text-slate-900 dark:text-white font-bold text-[11px] uppercase tracking-tighter">{formatDate(item.date)}</p>
                                       <p className="text-[9px] text-rose-500 font-bold uppercase tracking-[0.1em]">{item.hours} GIỜ</p>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <StatusBadge status={item.status} />
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
                                            className="w-10 h-10 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex items-center justify-center border border-rose-500/20 active:scale-90 transition-all"
                                          >
                                             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
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
               <div className="bg-rose-950/30 backdrop-blur-3xl rounded-[48px] border border-white/5 p-20 flex flex-col items-center text-center space-y-12 h-full justify-center">
                  <div className="w-32 h-32 bg-white/5 rounded-[40px] flex items-center justify-center text-rose-400 shadow-3xl transform -rotate-3 border border-white/5 group hover:rotate-0 transition-transform">
                     <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="space-y-4">
                     <h2 className="text-5xl font-black text-white uppercase tracking-tighter">Báo cáo OT</h2>
                     <p className="text-lg text-white/30 max-w-lg italic font-medium">Theo dõi và đăng ký các giờ làm việc ngoài giờ để được ghi nhận vào bảng lương.</p>
                  </div>
                  <div className="flex gap-4 pt-4 w-full max-w-md">
                     <div className="px-10 py-6 bg-white/5 rounded-[36px] border border-white/10 flex-1">
                        <span className="block text-3xl font-black text-indigo-400">{myItems.length}</span>
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest mt-1">Lượt đăng ký</span>
                     </div>
                     <div className="px-10 py-6 bg-white/5 rounded-[36px] border border-white/10 flex-1">
                        <span className="block text-3xl font-black text-rose-400">
                           {myItems.filter(i=>i.status==='APPROVED').reduce((acc,curr)=>acc+curr.hours, 0)}h
                        </span>
                        <span className="text-[10px] font-black text-white/10 uppercase tracking-widest mt-1">Đã tích lũy</span>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
