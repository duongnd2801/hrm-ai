'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { Apology } from '@/types';
import Toast, { ToastState } from '@/components/Toast';

const typeOptions = [
  { value: 'LATE', label: 'Đi muộn' },
  { value: 'FORGOT_CHECKIN', label: 'Quên check-in' },
  { value: 'FORGOT_CHECKOUT', label: 'Quên check-out' },
  { value: 'INSUFFICIENT_HOURS', label: 'Thiếu giờ làm' },
] as const;

function StatusBadge({ status }: { status: Apology['status'] }) {
  const map: Record<Apology['status'], string> = {
    PENDING: 'bg-amber-500/20 text-amber-500 border-amber-500/20',
    APPROVED: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/20',
    REJECTED: 'bg-rose-500/20 text-rose-400 border-rose-500/20',
  };
  const label: Record<Apology['status'], string> = {
    PENDING: 'Chờ duyệt',
    APPROVED: 'Đã phê duyệt',
    REJECTED: 'Bị từ chối',
  };
  return (
    <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest border ${map[status]}`}>
      {label[status]}
    </span>
  );
}

export default function ApologiesPage() {
  const { session } = useSession();
  const [attendanceDate, setAttendanceDate] = useState('');
  const [type, setType] = useState<(typeof typeOptions)[number]['value']>('LATE');
  const [reason, setReason] = useState('');
  const [myItems, setMyItems] = useState<Apology[]>([]);
  const [pendingItems, setPendingItems] = useState<Apology[]>([]);
  const [reviewedItems, setReviewedItems] = useState<Apology[]>([]);
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
    return fallback;
  };

  const loadData = useCallback(async () => {
    try {
      const tasks = [api.get<Apology[]>('/api/apologies/my')];
      if (canReview) {
        tasks.push(api.get<Apology[]>('/api/apologies/pending'));
        tasks.push(api.get<Apology[]>('/api/apologies/reviewed'));
      }
      
      const res = await Promise.all(tasks);
      setMyItems(res[0].data ?? []);
      if (canReview) {
        setPendingItems(res[1]?.data ?? []);
        setReviewedItems(res[2]?.data ?? []);
      }
    } catch {
      pushToast('error', 'Không thể tải danh sách đơn giải trình.');
    }
  }, [canReview]);

  useEffect(() => {
    if (session) {
      void loadData();
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setShowForm(!isAdminOrHR);
    }
  }, [session, loadData, isAdminOrHR]);

  async function submit() {
    if (!attendanceDate || !type || !reason.trim()) {
      pushToast('error', 'Vui lòng điền đầy đủ thông tin (ngày, loại, nội dung)');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/apologies', { attendanceDate, type, reason });
      setReason('');
      pushToast('success', 'Đã lưu đơn giải trình thành công.');
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
      await api.patch(`/api/apologies/${id}/${approved ? 'approve' : 'reject'}`, { note: '' });
      pushToast('success', approved ? 'Đã phê duyệt.' : 'Đã từ chối.');
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
      <div className="pt-10 mb-2 relative flex flex-col md:flex-row md:items-end justify-between gap-6">
         <div>
            <h1 className="text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-[0.8]" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.5)' }}>
              Trung tâm<br/>giải trình
            </h1>
            <div className="flex items-center gap-4 mt-6 ml-2">
               <span className="w-8 h-1 bg-indigo-500 rounded-full" />
               <p className="text-sm font-bold uppercase tracking-[0.4em] italic text-white/80" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Duyệt & Quản lý sai lệch chấm công</p>
            </div>
         </div>
         
         {isAdminOrHR && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl dark:shadow-none"
            >
              {showForm ? 'Hủy' : 'Viết đơn cá nhân'}
            </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         {/* Left Side: Creation Form */}
         {showForm && (
            <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
               <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white/90 uppercase tracking-widest mb-8 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                     Soạn thảo đơn
                  </h3>

                  <div className="space-y-6">
                     <div>
                       <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Thời gian gặp sự cố</label>
                       <input
                         type="date"
                         value={attendanceDate}
                         onChange={(e) => setAttendanceDate(e.target.value)}
                         className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none shadow-inner"
                       />
                     </div>
                     
                     <div>
                       <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Hình thức giải trình</label>
                       <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {typeOptions.map(opt => (
                            <button
                              key={opt.value}
                              type="button"
                              onClick={() => setType(opt.value)}
                              className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${type === opt.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-black/5 dark:bg-white/5 border-black/5 dark:border-white/10 text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'}`}
                            >
                              {opt.label}
                            </button>
                          ))}
                       </div>
                     </div>

                     <div>
                       <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Lý do giải trình</label>
                       <textarea
                         rows={4}
                         value={reason}
                         onChange={(e) => setReason(e.target.value)}
                         placeholder="Trình bày lý do của bạn..."
                         className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none shadow-inner"
                       />
                     </div>

                     <button
                       onClick={() => void submit()}
                       disabled={loading || !reason.trim()}
                       className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-black/5 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-white/20 text-white rounded-[26px] font-black uppercase tracking-[0.2em] transition-all"
                     >
                       {loading ? '...' : 'GỬI ĐƠN NGAY'}
                     </button>
                  </div>
               </div>

               {/* My History Section */}
               <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-white/5 shadow-3xl max-h-[350px] flex flex-col">
                  <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6 px-1">Phản hồi của tôi</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                     {myItems.map(item => (
                        <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 group hover:bg-white/10 transition-all cursor-default">
                           <div className="flex justify-between items-center mb-1">
                              <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">{new Date(item.attendanceDate).toLocaleDateString('vi-VN')}</p>
                              <StatusBadge status={item.status} />
                           </div>
                           <p className="text-white/80 dark:text-white/60 text-[11px] font-bold truncate uppercase">{typeOptions.find(t=>t.value===item.type)?.label}</p>
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
                           <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Duyệt giải trình</h3>
                           <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.3em] mt-1 italic">Phê duyệt các vấn đề phát sinh khi chấm công</p>
                        </div>
                        <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-[24px] border border-black/5 dark:border-white/10">
                           <button 
                             onClick={() => setActiveTab('pending')}
                             className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'pending' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'}`}
                           >
                              Cần xử lý ({pendingItems.length})
                           </button>
                           <button 
                             onClick={() => setActiveTab('history')}
                             className={`px-8 py-3 rounded-[18px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-900 dark:hover:text-white'}`}
                           >
                              Lịch sử ({reviewedItems.length})
                           </button>
                        </div>
                     </div>
                  </div>

                  <div className="flex-1 overflow-x-auto">
                     <table className="w-full border-collapse">
                        <thead>
                           <tr className="border-b border-black/5 dark:border-white/5 bg-slate-50/30 dark:bg-white/[0.02]">
                              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.2em] w-1/4">Nhân viên</th>
                              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.2em] w-1/5">Sự cố</th>
                              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.2em] w-1/5">Ngày ghi nhận</th>
                              <th className="px-8 py-6 text-left text-[10px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.2em]">Nội dung giải trình</th>
                              {activeTab === 'pending' && <th className="px-8 py-6 text-right text-[10px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.2em]">Tác vụ</th>}
                           </tr>
                        </thead>
                        <tbody className="divide-y divide-black/5 dark:divide-white/5">
                           {!currentDisplayItems.length && (
                              <tr>
                                 <td colSpan={5} className="py-32 text-center opacity-30 italic font-bold text-slate-900 dark:text-white">
                                    Không có đơn nào cần hiển thị.
                                 </td>
                              </tr>
                           )}
                           {currentDisplayItems.map(item => (
                              <tr key={item.id} className="group hover:bg-slate-50/50 dark:hover:bg-white/[0.03] transition-colors">
                                 <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                       <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center text-white font-black text-sm uppercase">
                                          {item.employeeName?.charAt(0) || '?'}
                                       </div>
                                       <div>
                                          <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight">{item.employeeName}</p>
                                          <p className="text-[10px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest mt-0.5">Thành viên Team</p>
                                       </div>
                                    </div>
                                 </td>
                                 <td className="px-8 py-6">
                                    <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-500/10 uppercase tracking-widest">
                                       {typeOptions.find(t=>t.value===item.type)?.label}
                                    </span>
                                 </td>
                                 <td className="px-8 py-6">
                                    <p className="text-slate-900 dark:text-white font-bold text-[11px] uppercase tracking-tighter">
                                       {new Date(item.attendanceDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                                    </p>
                                 </td>
                                 <td className="px-8 py-6">
                                    {activeTab === 'pending' ? (
                                       <p className="text-[11px] text-slate-600 dark:text-white/50 italic font-medium line-clamp-2 max-w-xs uppercase">&quot;{item.reason || '...'}&quot;</p>
                                    ) : (
                                       <StatusBadge status={item.status} />
                                    )}
                                 </td>
                                 {activeTab === 'pending' && (
                                    <td className="px-8 py-6 text-right">
                                       <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button 
                                            onClick={() => void review(item.id, true)}
                                            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center shadow-lg active:scale-90 transition-all font-black"
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
               <div className="bg-indigo-900/40 backdrop-blur-3xl rounded-[48px] border border-white/5 p-16 flex flex-col items-center text-center space-y-8 h-full justify-center">
                  <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center text-indigo-400 shadow-3xl border border-white/5">
                     <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Trung tâm<br/>giải trình cá nhân</h2>
                  <p className="text-lg text-slate-500 dark:text-white/40 max-w-sm italic">Mọi sai sót chấm công của bạn sẽ được đội ngũ nhân sự kiểm tra và phản hồi.</p>
                  
                  <div className="w-full max-w-sm pt-4">
                     <div className="flex gap-4 items-center justify-center">
                        <div className="px-8 py-5 bg-white/5 rounded-[30px] border border-white/10 flex-1">
                           <span className="block text-2xl font-black text-indigo-400">{myItems.length}</span>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Đơn đã gửi</span>
                        </div>
                        <div className="px-8 py-5 bg-white/5 rounded-[30px] border border-white/10 flex-1">
                           <span className="block text-2xl font-black text-emerald-400">{myItems.filter(i=>i.status==='APPROVED').length}</span>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest mt-1">Đã chấp nhận</span>
                        </div>
                     </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
