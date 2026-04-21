'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { OTRequest } from '@/types';
import Toast, { ToastState } from '@/components/Toast';
import { formatDate } from '@/lib/utils';
import { LayoutGrid, List } from 'lucide-react';

function StatusBadge({ status }: { status: OTRequest['status'] }) {
  const map: Record<OTRequest['status'], string> = {
    PENDING: 'bg-amber-500 text-white border-transparent',
    APPROVED: 'bg-emerald-500 text-white border-transparent',
    REJECTED: 'bg-rose-500 text-white border-transparent',
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
  const [myViewMode, setMyViewMode] = useState<'card' | 'table'>('card');
  const [personalPage, setPersonalPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [reviewedPage, setReviewedPage] = useState(1);
  const itemsPerPage = 8;

  const permissions = session?.permissions ?? [];
  const canView = permissions.includes('OT_VIEW');
  const canCreate = permissions.includes('OT_CREATE');
  const canApproveByPermission = permissions.includes('OT_APPROVE');
  const isReviewer = canApproveByPermission;
  const canReview = canApproveByPermission;
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
    if (!canView) return;
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
  }, [canReview, canView]);

  useEffect(() => {
    if (session) {
      if (canView) {
        void loadData();
      }
      setDate(new Date().toISOString().split('T')[0]);
      setShowForm(canCreate && !isReviewer);
    }
  }, [session, loadData, isReviewer, canCreate, canView]);

  async function submit() {
    if (!canCreate) {
      pushToast('error', 'Bạn không có quyền tạo đơn tăng ca');
      return;
    }
    setLoading(true);
    try {
      await api.post('/api/ot-requests', { date, hours, reason });
      setReason('');
      pushToast('success', 'Đã nộp đơn OT thành công.');
      await loadData();
      if (isReviewer) setShowForm(false);
    } catch {
      pushToast('error', 'Gửi đơn thất bại.');
    } finally {
      setLoading(false);
    }
  }

  async function review(id: string, approved: boolean) {
    if (!canReview) {
      pushToast('error', 'Bạn không có quyền duyệt đơn tăng ca');
      return;
    }
    try {
      await api.patch(`/api/ot-requests/${id}/${approved ? 'approve' : 'reject'}`);
      pushToast('success', approved ? 'Đã phê duyệt OT.' : 'Đã bác bỏ đơn.');
      await loadData();
    } catch {
      pushToast('error', 'Xử lý đơn thất bại.');
    }
  }

  if (!session) return null;
  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="max-w-lg w-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-10 text-center shadow-sm">
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Không có quyền truy cập</h1>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-white/50">Tài khoản hiện tại chưa được gán quyền xem module tăng ca.</p>
        </div>
      </div>
    );
  }

  const currentDisplayItems = activeTab === 'pending' ? pendingItems : reviewedItems;

  return (
    <div className="space-y-12 pb-24">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Header - Synced with Payroll Style */}
      <div className="pt-10 mb-8 relative flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div>
          <h1 className="text-5xl md:text-7xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>
            Tăng ca<br />& Overtime
          </h1>
          <p className="text-lg font-bold uppercase tracking-[0.3em] mt-6 ml-1 text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
             Phê duyệt & Ghi nhận ngoài giờ
          </p>
        </div>

        {canCreate && isReviewer && (
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-2xl mt-6 md:mt-0">
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-10 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${showForm ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-rose-600 text-white shadow-xl shadow-rose-600/40 hover:bg-rose-500'}`}
            >
              {showForm ? 'HỦY' : 'ĐĂNG KÝ TĂNG CA'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Side: Creation Form */}
        {showForm && canCreate && (
          <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
            <div className="bg-white/90 dark:bg-slate-900/40 backdrop-blur-3xl rounded-[40px] p-8 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-3xl">
              <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-widest mb-8 flex items-center gap-3">
                <div className="w-1.5 h-6 bg-rose-500 rounded-full" />
                Ghi nhận ca
              </h3>

              <div className="space-y-6">
                <div>
                  <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Ngày thực hiện</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-rose-500/50 shadow-inner transition-all"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Số giờ OT dự kiến</label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min={1}
                      max={12}
                      step={0.5}
                      value={hours}
                      onChange={(e) => setHours(parseFloat(e.target.value))}
                      className="flex-1 h-2 bg-slate-200 dark:bg-white/10 rounded-lg appearance-none cursor-pointer accent-rose-500"
                    />
                    <span className="w-16 text-center text-rose-500 dark:text-rose-400 font-black text-lg">{hours}h</span>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-white/30 font-black uppercase text-[10px] tracking-widest mb-3 ml-1">Giải trình công việc</label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="VD: Fix bug gấp chuẩn bị release..."
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 font-bold outline-none focus:ring-2 focus:ring-rose-500/50 resize-none shadow-inner transition-all"
                  />
                </div>

                <button
                  onClick={() => void submit()}
                  disabled={loading || !reason.trim()}
                  className="w-full py-5 bg-rose-600 hover:bg-rose-500 disabled:bg-slate-100 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-white/20 text-white font-black uppercase tracking-[0.2em] rounded-[26px] transition-all shadow-xl shadow-rose-500/20"
                >
                  {loading ? '...' : 'GỬI ĐƠN PHÊ DUYỆT'}
                </button>
              </div>
            </div>

            {/* My OT History */}
            <div className="bg-slate-50 dark:bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-3xl max-h-[350px] flex flex-col">
              <h3 className="text-[10px] font-black text-rose-500 dark:text-rose-400 uppercase tracking-widest mb-6 px-1">Lịch sử cá nhân</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                {myItems.map(item => (
                  <div key={item.id} className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group hover:bg-slate-50 dark:hover:bg-white/10 transition-all flex justify-between items-center">
                    <div className="text-left w-2/3">
                      <p className="text-slate-700 dark:text-white font-bold text-[11px] truncate uppercase">{formatDate(item.date)}</p>
                      <p className="text-[10px] text-rose-500 dark:text-rose-400 font-black mt-0.5">{item.hours} GIỜ TĂNG CA</p>
                    </div>
                    <StatusBadge status={item.status} />
                  </div>
                ))}
                {myItems.length === 0 && (
                  <p className="text-slate-400 dark:text-white/20 text-xs text-center py-8 font-bold uppercase tracking-widest">Chưa có dữ liệu</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Center/Right Side */}
        <div className={showForm ? 'xl:col-span-8' : 'xl:col-span-12'}>
          {canReview ? (
            /* ── MANAGER/HR/ADMIN: Approval Console (Table) ── */
            <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl flex flex-col h-full overflow-hidden min-h-[700px]">
              <div className="p-10 border-b border-slate-100 dark:border-white/10 space-y-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Kiểm soát OT</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] mt-1 italic">Quản lý định mức làm việc ngoài giờ</p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-[24px] border border-slate-200 dark:border-white/10">
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

              <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-rose-500/10 dark:scrollbar-thumb-white/5 pb-4">
                <table className="min-w-[1000px] w-full border-collapse">
                  <thead className="text-[11px] uppercase tracking-[0.2em] bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left rounded-tl-3xl whitespace-nowrap min-w-[200px]">Nhân viên</th>
                      <th className="px-8 py-6 text-left whitespace-nowrap">Công việc / Lý do</th>
                      <th className="px-8 py-6 text-left whitespace-nowrap text-center">Định mức thời gian</th>
                      <th className="px-8 py-6 text-left whitespace-nowrap text-center">Trạng thái</th>
                      {activeTab === 'pending' && <th className="px-8 py-6 text-right rounded-tr-3xl whitespace-nowrap">Hành động</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {!currentDisplayItems.length && (
                      <tr>
                        <td colSpan={5} className="py-32 text-center text-slate-400 dark:text-white/30 italic font-bold">
                          Không có dữ liệu hiển thị.
                        </td>
                      </tr>
                    )}
                    {(activeTab === 'pending' 
                         ? pendingItems.slice((pendingPage-1)*itemsPerPage, pendingPage*itemsPerPage) 
                         : reviewedItems.slice((reviewedPage-1)*itemsPerPage, reviewedPage*itemsPerPage)
                       ).map(item => (
                       <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                         <td className="px-8 py-6">
                           <div className="flex items-center gap-4 max-w-[250px]">
                             <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-rose-800 flex items-center justify-center text-white font-black text-sm uppercase shrink-0">
                               {item.employeeName?.charAt(0) || '?'}
                             </div>
                             <div className="min-w-0">
                               <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight break-words whitespace-normal leading-tight">{item.employeeName}</p>
                               <p className="text-[9px] text-slate-400 dark:text-white/20 font-bold uppercase tracking-widest mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">Nhân sự cấp dưới</p>
                             </div>
                           </div>
                         </td>
                         <td className="px-8 py-6">
                           <p className="text-[11px] text-slate-500 dark:text-white/50 italic font-medium max-w-xs uppercase break-words whitespace-normal leading-relaxed">"{item.reason || '...'}"</p>
                         </td>
                         <td className="px-8 py-6">
                           <div className="space-y-1 text-center">
                             <p className="text-slate-900 dark:text-white font-bold text-[11px] uppercase tracking-tighter whitespace-nowrap">{formatDate(item.date)}</p>
                             <p className="text-[9px] text-rose-500 font-bold uppercase tracking-[0.1em] whitespace-nowrap">{item.hours} GIỜ</p>
                           </div>
                         </td>
                         <td className="px-8 py-6 text-center">
                           <StatusBadge status={item.status} />
                         </td>
                         {activeTab === 'pending' && (
                           <td className="px-8 py-6 text-right min-w-[150px]">
                             <div className="flex items-center justify-end gap-3 transition-all shrink-0">
                               <button
                                 onClick={() => void review(item.id, true)}
                                 className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-all shrink-0"
                               >
                                 <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                               </button>
                               <button
                                 onClick={() => void review(item.id, false)}
                                 className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-500/20 active:scale-95 transition-all shrink-0"
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

              {/* Pagination for Manager */}
              {((activeTab === 'pending' ? pendingItems.length : reviewedItems.length) > itemsPerPage) && (
                 <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">
                       Trang {(activeTab === 'pending' ? pendingPage : reviewedPage)} / {Math.ceil((activeTab === 'pending' ? pendingItems.length : reviewedItems.length) / itemsPerPage)}
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         disabled={(activeTab === 'pending' ? pendingPage : reviewedPage) === 1}
                         onClick={() => activeTab === 'pending' ? setPendingPage(p => p - 1) : setReviewedPage(p => p - 1)}
                         className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 disabled:opacity-20"
                       >
                         &larr;
                       </button>
                       <button 
                         disabled={(activeTab === 'pending' ? pendingPage : reviewedPage) === Math.ceil((activeTab === 'pending' ? pendingItems.length : reviewedItems.length) / itemsPerPage)}
                         onClick={() => activeTab === 'pending' ? setPendingPage(p => p + 1) : setReviewedPage(p => p + 1)}
                         className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 disabled:opacity-20"
                       >
                         &rarr;
                       </button>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            /* ── EMPLOYEE: My OT with Card/Table toggle ── */
            <div className="space-y-6">
              {/* Stats + Toggle header */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="px-6 py-4 bg-white/80 dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-center">
                    <span className="block text-2xl font-black text-rose-500 dark:text-rose-400">{myItems.length}</span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Đã đăng ký</span>
                  </div>
                  <div className="px-6 py-4 bg-white/80 dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-center">
                    <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {myItems.filter(i => i.status === 'APPROVED').reduce((acc, curr) => acc + curr.hours, 0)}h
                    </span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Đã tích lũy</span>
                  </div>
                </div>

                <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl flex gap-1 border border-slate-200 dark:border-white/5">
                  <button
                    onClick={() => setMyViewMode('card')}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${myViewMode === 'card' ? 'bg-white dark:bg-white/10 text-rose-500 dark:text-rose-400 shadow-sm' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMyViewMode('table')}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${myViewMode === 'table' ? 'bg-white dark:bg-white/10 text-rose-500 dark:text-rose-400 shadow-sm' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {myItems.length === 0 ? (
                <div className="bg-white/80 dark:bg-rose-950/30 backdrop-blur-3xl rounded-[48px] border border-slate-200 dark:border-white/5 p-20 flex flex-col items-center text-center space-y-8 justify-center">
                  <div className="w-32 h-32 bg-slate-100 dark:bg-white/5 rounded-[40px] flex items-center justify-center text-rose-400 shadow-xl transform -rotate-3 border border-slate-200 dark:border-white/5 hover:rotate-0 transition-transform">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Báo cáo OT</h2>
                    <p className="text-lg text-slate-500 dark:text-white/30 max-w-lg italic font-medium">Theo dõi và đăng ký các giờ làm việc ngoài giờ để được ghi nhận vào bảng lương.</p>
                  </div>
                </div>
              ) : myViewMode === 'card' ? (
                /* Card view */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                   {myItems.slice((personalPage - 1) * itemsPerPage, personalPage * itemsPerPage).map(item => (
                     <div key={item.id} className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-[28px] border border-slate-200 dark:border-white/5 p-6 hover:border-rose-300 dark:hover:border-rose-500/30 transition-all duration-500 group relative overflow-hidden shadow-sm dark:shadow-none">
                       <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl -mr-10 -mt-10 group-hover:bg-rose-500/10 transition-all duration-700" />
                       <div className="flex justify-between items-start mb-4">
                         <div>
                           <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-1">{formatDate(item.date)}</p>
                           <p className="text-2xl font-black text-rose-500 dark:text-rose-400">{item.hours}<span className="text-sm ml-1">giờ</span></p>
                         </div>
                         <StatusBadge status={item.status} />
                       </div>
                       <p className="text-slate-500 dark:text-white/40 text-xs italic font-medium border-l-2 border-rose-400/50 pl-3 break-words whitespace-normal leading-relaxed">
                         "{item.reason || '...'}"
                       </p>
                     </div>
                   ))}
                  </div>
              ) : (
                /* Table view */
                <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm dark:shadow-none">
                  <div className="overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-rose-500/10 dark:scrollbar-thumb-white/5">
                    <table className="min-w-[800px] w-full border-collapse">
                      <thead className="text-[11px] uppercase tracking-[0.2em] bg-slate-50 dark:bg-black/30 text-slate-500 dark:text-white/50 font-black border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-8 py-5 text-left whitespace-nowrap">Ngày thực hiện</th>
                          <th className="px-8 py-5 text-center whitespace-nowrap">Số giờ đã nộp</th>
                          <th className="px-8 py-5 text-left whitespace-nowrap min-w-[300px]">Chi tiết công việc</th>
                          <th className="px-8 py-5 text-center whitespace-nowrap">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                         {myItems.slice((personalPage - 1) * itemsPerPage, personalPage * itemsPerPage).map(item => (
                           <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
                             <td className="px-8 py-5">
                               <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tight whitespace-nowrap">{formatDate(item.date)}</span>
                             </td>
                             <td className="px-8 py-5 text-center">
                               <span className="text-rose-500 dark:text-rose-400 font-black text-sm whitespace-nowrap">{item.hours}h</span>
                             </td>
                             <td className="px-8 py-5 max-w-[400px]">
                               <p className="text-slate-500 dark:text-white/40 text-[11px] italic font-medium break-words whitespace-normal leading-relaxed">"{item.reason || '...'}"</p>
                             </td>
                             <td className="px-8 py-5 text-center">
                               <StatusBadge status={item.status} />
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 </div>
              )}

              {/* Personal Pagination */}
               {myItems.length > itemsPerPage && (
                  <div className="mt-8 flex justify-center items-center gap-4">
                     <button 
                       disabled={personalPage === 1}
                       onClick={() => setPersonalPage(p => p - 1)}
                       className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-20"
                     >
                        &larr;
                     </button>
                     <div className="px-6 py-2 bg-rose-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/30">
                        Trang {personalPage} / {Math.ceil(myItems.length / itemsPerPage)}
                     </div>
                     <button 
                       disabled={personalPage === Math.ceil(myItems.length / itemsPerPage)}
                       onClick={() => setPersonalPage(p => p + 1)}
                       className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/10 text-white disabled:opacity-20"
                     >
                        &rarr;
                     </button>
                  </div>
               )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
