'use client';

import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import api from '@/lib/api';
import { useSession } from '@/components/AuthProvider';
import type { Apology } from '@/types';
import Toast, { ToastState } from '@/components/Toast';
import { LayoutGrid, List } from 'lucide-react';

const typeOptions = [
  { value: 'LATE', label: 'Đi muộn' },
  { value: 'FORGOT_CHECKIN', label: 'Quên check-in' },
  { value: 'FORGOT_CHECKOUT', label: 'Quên check-out' },
  { value: 'INSUFFICIENT_HOURS', label: 'Thiếu giờ làm' },
] as const;

function StatusBadge({ status }: { status: Apology['status'] }) {
  const map: Record<Apology['status'], string> = {
    PENDING: 'bg-amber-500 text-white border-transparent',
    APPROVED: 'bg-emerald-500 text-white border-transparent',
    REJECTED: 'bg-rose-500 text-white border-transparent',
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
  const [myViewMode, setMyViewMode] = useState<'card' | 'table'>('card');
  const [personalPage, setPersonalPage] = useState(1);
  const [pendingPage, setPendingPage] = useState(1);
  const [reviewedPage, setReviewedPage] = useState(1);
  const itemsPerPage = 8;

  const permissions = session?.permissions ?? [];
  const canView = permissions.includes('APOLOGY_VIEW');
  const canCreate = permissions.includes('APOLOGY_CREATE');
  const canApproveByPermission = permissions.includes('APOLOGY_APPROVE');
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
  }, [canReview, canView]);

  useEffect(() => {
    if (session) {
      if (canView) {
        void loadData();
      }
      setAttendanceDate(new Date().toISOString().split('T')[0]);
      setShowForm(canCreate && !isReviewer);
    }
  }, [session, loadData, isReviewer, canCreate, canView]);

  async function submit() {
    if (!canCreate) {
      pushToast('error', 'Bạn không có quyền tạo đơn giải trình');
      return;
    }
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
      if (isReviewer) setShowForm(false);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, 'Gửi đơn thất bại.'));
    } finally {
      setLoading(false);
    }
  }

  async function review(id: string, approved: boolean) {
    if (!canReview) {
      pushToast('error', 'Bạn không có quyền duyệt đơn giải trình');
      return;
    }
    try {
      await api.patch(`/api/apologies/${id}/${approved ? 'approve' : 'reject'}`, { note: '' });
      pushToast('success', approved ? 'Đã phê duyệt.' : 'Đã từ chối.');
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
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-white/50">Tài khoản hiện tại chưa được gán quyền xem module giải trình.</p>
        </div>
      </div>
    );
  }

  const currentDisplayItems = activeTab === 'pending' ? pendingItems : reviewedItems;

  return (
    <div className="space-y-12 pb-24">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Header - Synced with Payroll Style */}
      <div className="pt-10 mb-8 relative flex flex-col xl:flex-row xl:items-end justify-between gap-6 md:gap-8">
        <div className="max-w-full overflow-hidden">
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-[1.1] md:leading-none break-words" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>
            Trung tâm<br className="hidden sm:block" />giải trình
          </h1>
          <p className="text-base sm:text-lg font-bold uppercase tracking-[0.2em] sm:tracking-[0.3em] mt-4 md:mt-6 ml-1 text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
            Duyệt & Quản lý sai lệch chấm công
          </p>
        </div>

        {canCreate && isReviewer && (
          <div className="flex items-center gap-3 bg-white/10 backdrop-blur-2xl p-2 md:p-3 rounded-[24px] md:rounded-[32px] border border-white/10 shadow-2xl w-fit">
            <button
              onClick={() => setShowForm(!showForm)}
              className={`px-6 md:px-10 py-3 md:py-4 rounded-xl md:rounded-2xl text-[10px] md:text-[11px] font-black uppercase tracking-widest transition-all active:scale-95 ${showForm ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40 hover:bg-indigo-500'}`}
            >
              {showForm ? 'HỦY' : 'VIẾT ĐƠN CÁ NHÂN'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
        {/* Left Side: Creation Form */}
        {showForm && canCreate && (
          <div className="xl:col-span-4 space-y-8 animate-in fade-in slide-in-from-left-4">
            <div className="bg-white/90 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-8 border border-slate-200 dark:border-white/10 shadow-xl dark:shadow-none">
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
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 shadow-inner transition-all"
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
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all duration-300 ${type === opt.value ? 'bg-indigo-600 border-indigo-500 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-500 dark:text-white/30 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'}`}
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
                    className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-4 text-slate-900 dark:text-white placeholder:text-slate-300 dark:placeholder:text-white/20 font-bold outline-none focus:ring-2 focus:ring-indigo-500/50 resize-none shadow-inner transition-all"
                  />
                </div>

                <button
                  onClick={() => void submit()}
                  disabled={loading || !reason.trim()}
                  className="w-full py-5 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-100 dark:disabled:bg-white/10 disabled:text-slate-400 dark:disabled:text-white/20 text-white rounded-[26px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-indigo-500/20"
                >
                  {loading ? '...' : 'GỬI ĐƠN NGAY'}
                </button>
              </div>
            </div>

            {/* My History Section */}
            <div className="bg-slate-50 dark:bg-slate-950/40 backdrop-blur-3xl rounded-[40px] p-8 border border-slate-200 dark:border-white/5 shadow-xl dark:shadow-3xl max-h-[350px] flex flex-col">
              <h3 className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest mb-6 px-1">Phản hồi của tôi</h3>
              <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-white/10">
                {myItems.map(item => (
                  <div key={item.id} className="p-4 bg-white dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group hover:bg-slate-50 dark:hover:bg-white/10 transition-all cursor-default">
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-[9px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">{new Date(item.attendanceDate).toLocaleDateString('vi-VN')}</p>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-slate-700 dark:text-white/60 text-[11px] font-bold truncate uppercase">{typeOptions.find(t => t.value === item.type)?.label}</p>
                  </div>
                ))}
                {myItems.length === 0 && (
                  <p className="text-slate-400 dark:text-white/20 text-xs text-center py-8 font-bold uppercase tracking-widest">Chưa có đơn nào</p>
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
                    <h3 className="text-3xl font-black uppercase tracking-tighter text-slate-900 dark:text-white">Duyệt giải trình</h3>
                    <p className="text-xs font-bold text-slate-400 dark:text-white/30 uppercase tracking-[0.3em] mt-1 italic">Phê duyệt các vấn đề phát sinh khi chấm công</p>
                  </div>
                  <div className="flex bg-slate-100 dark:bg-white/5 p-1.5 rounded-[24px] border border-slate-200 dark:border-white/10">
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

              <div className="flex-1 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10 dark:scrollbar-thumb-white/5 pb-4">
                <table className="min-w-[1000px] w-full border-collapse">
                  <thead className="text-[11px] uppercase tracking-[0.2em] bg-slate-50 dark:bg-black/20 text-slate-500 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-slate-100 dark:border-white/5">
                    <tr>
                      <th className="px-8 py-6 text-left rounded-tl-3xl whitespace-nowrap min-w-[200px]">Nhân viên</th>
                      <th className="px-8 py-6 text-left whitespace-nowrap">Sự cố</th>
                      <th className="px-8 py-6 text-left whitespace-nowrap text-center">Ngày ghi nhận</th>
                      <th className="px-8 py-6 text-left whitespace-nowrap text-center">Nội dung giải trình</th>
                      {activeTab === 'pending' && <th className="px-8 py-6 text-right rounded-tr-3xl whitespace-nowrap">Tác vụ</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                    {!currentDisplayItems.length && (
                      <tr>
                        <td colSpan={5} className="py-32 text-center text-slate-400 dark:text-white/30 italic font-bold">
                          Không có đơn nào cần hiển thị.
                        </td>
                      </tr>
                    )}
                    {(activeTab === 'pending' 
                        ? pendingItems.slice((pendingPage - 1) * itemsPerPage, pendingPage * itemsPerPage)
                        : reviewedItems.slice((reviewedPage - 1) * itemsPerPage, reviewedPage * itemsPerPage)
                     ).map(item => (
                      <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-4 max-w-[250px]">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-800 flex items-center justify-center text-white font-black text-sm uppercase shrink-0">
                              {item.employeeName?.charAt(0) || '?'}
                            </div>
                            <p className="text-slate-900 dark:text-white font-black uppercase text-xs tracking-tight break-words whitespace-normal leading-tight">{item.employeeName}</p>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/10 uppercase tracking-widest whitespace-nowrap">
                            {typeOptions.find(t => t.value === item.type)?.label}
                          </span>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <p className="text-slate-900 dark:text-white font-bold text-[11px] uppercase tracking-tighter whitespace-nowrap">
                            {new Date(item.attendanceDate).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                          </p>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex justify-center">
                            {activeTab === 'pending' ? (
                              <p className="text-[10px] text-slate-500 dark:text-white/50 italic font-medium max-w-[300px] uppercase break-words whitespace-normal leading-relaxed text-center">"{item.reason || '...'}"</p>
                            ) : (
                              <StatusBadge status={item.status} />
                            )}
                          </div>
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
                                className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-500/20 active:scale-90 transition-all font-black text-xs"
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
                 <div className="mt-auto pt-6 border-t border-slate-100 dark:border-white/10 flex items-center justify-between">
                    <div className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">
                       Trang {(activeTab === 'pending' ? pendingPage : reviewedPage)} / {Math.ceil((activeTab === 'pending' ? pendingItems.length : reviewedItems.length) / itemsPerPage)}
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                         disabled={(activeTab === 'pending' ? pendingPage : reviewedPage) === 1}
                         onClick={() => activeTab === 'pending' ? setPendingPage(p => p - 1) : setReviewedPage(p => p - 1)}
                         className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 disabled:opacity-20"
                       >
                         &larr;
                       </button>
                       <button 
                         disabled={(activeTab === 'pending' ? pendingPage : reviewedPage) === Math.ceil((activeTab === 'pending' ? pendingItems.length : reviewedItems.length) / itemsPerPage)}
                         onClick={() => activeTab === 'pending' ? setPendingPage(p => p + 1) : setReviewedPage(p => p + 1)}
                         className="w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 dark:bg-white/5 text-slate-400 disabled:opacity-20"
                       >
                         &rarr;
                       </button>
                    </div>
                 </div>
               )}
            </div>
          ) : (
            /* ── EMPLOYEE: My Apologies with Card/Table toggle ── */
            <div className="space-y-6">
              {/* Stats + Toggle header */}
              <div className="flex items-center justify-between">
                <div className="flex gap-4">
                  <div className="px-6 py-4 bg-white/80 dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-center">
                    <span className="block text-2xl font-black text-indigo-600 dark:text-indigo-400">{myItems.length}</span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Đã gửi</span>
                  </div>
                  <div className="px-6 py-4 bg-white/80 dark:bg-white/5 rounded-[24px] border border-slate-200 dark:border-white/10 shadow-sm dark:shadow-none text-center">
                    <span className="block text-2xl font-black text-emerald-600 dark:text-emerald-400">{myItems.filter(i => i.status === 'APPROVED').length}</span>
                    <span className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Đã chấp nhận</span>
                  </div>
                </div>

                <div className="bg-slate-100 dark:bg-white/5 p-1 rounded-2xl flex gap-1 border border-slate-200 dark:border-white/5">
                  <button
                    onClick={() => setMyViewMode('card')}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${myViewMode === 'card' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'}`}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setMyViewMode('table')}
                    className={`p-2.5 rounded-xl transition-all duration-300 ${myViewMode === 'table' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-white/30 hover:text-slate-600 dark:hover:text-white/60'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {myItems.length === 0 ? (
                <div className="bg-white/80 dark:bg-indigo-900/40 backdrop-blur-3xl rounded-[48px] border border-slate-200 dark:border-white/5 p-16 flex flex-col items-center text-center space-y-8 h-full justify-center">
                  <div className="w-32 h-32 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center text-indigo-500 dark:text-indigo-400 shadow-xl border border-slate-200 dark:border-white/5">
                    <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  </div>
                  <h2 className="text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">Trung tâm<br />giải trình cá nhân</h2>
                  <p className="text-lg text-slate-500 dark:text-white/40 max-w-sm italic">Mọi sai sót chấm công của bạn sẽ được đội ngũ nhân sự kiểm tra và phản hồi.</p>
                </div>
              ) : myViewMode === 'card' ? (
                /* Card view */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {myItems.slice((personalPage - 1) * itemsPerPage, personalPage * itemsPerPage).map(item => (
                    <div key={item.id} className="bg-white/90 dark:bg-white/5 backdrop-blur-sm rounded-[28px] border border-slate-200 dark:border-white/5 p-6 hover:border-indigo-300 dark:hover:border-indigo-500/30 transition-all duration-500 group relative overflow-hidden shadow-sm dark:shadow-none">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 blur-2xl -mr-10 -mt-10 group-hover:bg-indigo-500/10 transition-all duration-700" />
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest mb-1">
                            {new Date(item.attendanceDate).toLocaleDateString('vi-VN')}
                          </p>
                          <p className="text-sm font-black text-slate-700 dark:text-white/80 uppercase tracking-tight">
                            {typeOptions.find(t => t.value === item.type)?.label}
                          </p>
                        </div>
                        <StatusBadge status={item.status} />
                      </div>
                      <p className="text-slate-500 dark:text-white/40 text-xs italic font-medium border-l-2 border-indigo-400/50 pl-3 line-clamp-2">
                        "{item.reason || '...'}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                /* Table view */
                <div className="bg-white/90 dark:bg-white/5 backdrop-blur-sm border border-slate-200 dark:border-white/5 rounded-[32px] overflow-hidden shadow-sm dark:shadow-none">
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead className="text-[11px] uppercase tracking-[0.2em] bg-slate-50 dark:bg-black/30 text-slate-500 dark:text-white/50 font-black border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-8 py-5 text-left whitespace-nowrap">Ngày</th>
                          <th className="px-8 py-5 text-left whitespace-nowrap">Hình thức</th>
                          <th className="px-8 py-5 text-left whitespace-nowrap">Lý do</th>
                          <th className="px-8 py-5 text-center whitespace-nowrap">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        {myItems.slice((personalPage - 1) * itemsPerPage, personalPage * itemsPerPage).map(item => (
                          <tr key={item.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
                            <td className="px-8 py-5">
                              <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tight">
                                {new Date(item.attendanceDate).toLocaleDateString('vi-VN')}
                              </span>
                            </td>
                            <td className="px-8 py-5">
                              <span className="text-[10px] font-black bg-slate-100 dark:bg-white/5 text-indigo-600 dark:text-indigo-400 px-3 py-1.5 rounded-lg border border-indigo-200 dark:border-indigo-500/10 uppercase tracking-widest">
                                {typeOptions.find(t => t.value === item.type)?.label}
                              </span>
                            </td>
                            <td className="px-8 py-5 max-w-[280px]">
                              <p className="text-slate-500 dark:text-white/40 text-[11px] italic font-medium line-clamp-2">"{item.reason || '...'}"</p>
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
                     <div className="px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest">
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
