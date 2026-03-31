'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [showForm, setShowForm] = useState(false);

  const role = session?.role ?? null;
  const isAdminOrHR = role === 'HR' || role === 'ADMIN';
  const canReview = role === 'MANAGER' || role === 'HR' || role === 'ADMIN';
  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });

  const loadData = useCallback(async () => {
    try {
      const tasks: Promise<any>[] = [api.get<Apology[]>('/api/apologies/my')];
      if (canReview) tasks.push(api.get<Apology[]>('/api/apologies/pending'));
      
      const [myRes, pendingRes] = await Promise.all(tasks);
      setMyItems(myRes.data ?? []);
      if (canReview && pendingRes) setPendingItems(pendingRes.data ?? []);
    } catch {
      pushToast('error', 'Không thể tải danh sách đơn giải trình.');
    }
  }, [canReview]);

  useEffect(() => {
    if (session) {
      void loadData();
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      // Admins don't see form by default
      setShowForm(!isAdminOrHR);
    }
  }, [session, loadData, isAdminOrHR]);

  async function submit() {
    // D23: Complete form validation
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
    } catch (err: any) {
      pushToast('error', err.response?.data || 'Gửi đơn thất bại.');
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
               <p className="text-sm font-bold uppercase tracking-[0.4em] italic" style={{ color: '#ffffff', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>Duyệt & Quản lý sai lệch chấm công</p>
            </div>
         </div>
         
         {isAdminOrHR && (
            <button 
              onClick={() => setShowForm(!showForm)}
              className="px-8 py-4 bg-white/80 dark:bg-white/5 hover:bg-white dark:hover:bg-white/10 rounded-2xl border border-black/5 dark:border-white/10 text-slate-900 dark:text-white font-black uppercase tracking-widest text-xs transition-all active:scale-95 shadow-xl dark:shadow-none"
            >
              {showForm ? 'Hủy viết đơn' : 'Viết đơn cá nhân'}
            </button>
         )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
         
         {/* Left Side: Creation Form (Only if shown) */}
         {showForm && (
            <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
               <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl hover:bg-white/90 dark:hover:bg-white/[0.07] transition-all">
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
                         className="w-full bg-black/5 dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner"
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
                       className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-black/5 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-white/20 text-white rounded-[26px] font-black uppercase tracking-[0.2em] transition-all shadow-2xl shadow-indigo-500/20 active:scale-95"
                     >
                       {loading ? '...' : 'GỬI ĐƠN NGAY'}
                     </button>
                  </div>
               </div>

               {/* My History Section (Mini) */}
               <div className="bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-white/5 shadow-3xl max-h-[300px] flex flex-col">
                  <h3 className="text-lg font-black text-emerald-400 uppercase tracking-widest mb-6 px-1 text-xs">Phản hồi gần đây</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-white/10">
                     {myItems.slice(0, 5).map(item => (
                        <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                           <div className="flex justify-between items-center mb-1">
                              <p className="text-[9px] font-black text-white/30 uppercase">{new Date(item.attendanceDate).toLocaleDateString('vi-VN')}</p>
                              <StatusBadge status={item.status} />
                           </div>
                           <p className="text-white/60 text-[10px] font-bold truncate">{item.reason}</p>
                        </div>
                     ))}
                  </div>
               </div>
            </div>
         )}

         {/* Center/Right Side: Approval Console (Full width if no form) */}
         <div className={showForm ? 'xl:col-span-8' : 'xl:col-span-12'}>
            {canReview ? (
               <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[48px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl flex flex-col h-full overflow-hidden min-h-[600px]">
                  <div className="p-10 border-b border-black/5 dark:border-white/10 flex items-center justify-between bg-white/[0.02]">
                     <div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">PHÊ DUYỆT ĐƠN</h3>
                        <p className="text-xs font-bold text-slate-500 dark:text-white/30 uppercase tracking-[0.3em] mt-1">Danh sách nhân viên đang chờ quyết định</p>
                     </div>
                     <div className="px-6 py-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20 flex items-center gap-4">
                        <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                        <span className="text-indigo-600 dark:text-indigo-400 font-black text-sm tracking-widest">{pendingItems.length} ĐƠN CẦN XỬ LÝ</span>
                     </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-10 space-y-6 scrollbar-thin scrollbar-thumb-white/10">
                     {!pendingItems.length && (
                        <div className="flex flex-col items-center justify-center py-32 opacity-30 dark:opacity-20">
                           <svg className="w-20 h-20 mb-6 text-slate-400 dark:text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                           <p className="text-xl font-black uppercase tracking-widest text-center text-slate-400 dark:text-white">Tất cả hồ sơ<br/>đã được duyệt xong</p>
                        </div>
                     )}
                     
                     <div className={`grid grid-cols-1 ${!showForm ? 'md:grid-cols-2 gap-8' : 'gap-6'}`}>
                        {pendingItems.map(item => (
                          <div key={item.id} className="group relative bg-white/80 dark:bg-slate-900/60 p-8 rounded-[40px] border border-black/5 dark:border-white/10 hover:border-indigo-500/50 transition-all duration-500 flex flex-col gap-8 animate-in fade-in slide-in-from-bottom-4">
                             <div className="flex-1 space-y-6">
                                <div className="flex items-center gap-5">
                                   <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center text-white font-black text-lg shadow-xl ring-2 ring-white/5">
                                      {item.employeeName?.charAt(0) || '?'}
                                   </div>
                                   <div>
                                      <h4 className="text-2xl font-black text-slate-900 dark:text-white leading-none mb-2 group-hover:text-indigo-400 transition-colors uppercase tracking-tight">{item.employeeName}</h4>
                                      <div className="flex items-center gap-3">
                                         <span className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest px-2 py-0.5 bg-amber-500/10 rounded-md border border-amber-500/20">
                                            {typeOptions.find(t=>t.value===item.type)?.label}
                                         </span>
                                         <span className="text-[10px] font-bold text-slate-500 dark:text-white/30 uppercase tracking-widest italic">{new Date(item.attendanceDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}</span>
                                      </div>
                                   </div>
                                </div>
                                
                                <p className="text-base text-slate-600 dark:text-white/60 italic leading-relaxed py-5 px-6 bg-slate-900/5 dark:bg-white/5 rounded-[28px] border border-black/5 dark:border-white/5 flex-1 min-h-[100px]">
                                   "{item.reason || 'Không có lý do chi tiết.'}"
                                </p>
                             </div>
                             
                             <div className="flex flex-row gap-4 shrink-0">
                                <button 
                                  onClick={() => void review(item.id, true)}
                                  className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm uppercase tracking-[0.15em] rounded-[22px] transition-all shadow-xl shadow-emerald-500/10 active:scale-95 flex items-center justify-center gap-2"
                                >
                                   DUYỆT
                                </button>
                                <button 
                                  onClick={() => void review(item.id, false)}
                                  className="flex-1 py-5 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white border border-rose-500/20 text-sm font-black uppercase tracking-[0.15em] rounded-[22px] transition-all active:scale-95 flex items-center justify-center gap-2"
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
               <div className="bg-indigo-900/40 backdrop-blur-3xl rounded-[48px] border border-white/5 p-16 flex flex-col items-center text-center space-y-8 h-full justify-center">
                  <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center text-indigo-400">
                     <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Hồ sơ cá nhân</h2>
                  <p className="text-lg text-slate-500 dark:text-white/40 max-w-sm italic">Mọi yêu cầu của bạn sẽ được ban lãnh đạo xem xét và phản hồi sớm nhất.</p>
                  
                  <div className="w-full max-w-sm pt-10">
                    <h4 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6">Lịch sử của bạn</h4>
                    <div className="space-y-3">
                       {myItems.map(item => (
                          <div key={item.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                             <div className="text-left">
                                <p className="text-white font-bold text-xs">{typeOptions.find(t=>t.value===item.type)?.label}</p>
                                <p className="text-[9px] text-white/30 font-black uppercase tracking-widest mt-0.5">{new Date(item.attendanceDate).toLocaleDateString('vi-VN')}</p>
                             </div>
                             <StatusBadge status={item.status} />
                          </div>
                       ))}
                    </div>
                  </div>
               </div>
            )}
         </div>
      </div>
    </div>
  );
}
