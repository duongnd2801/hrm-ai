'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useSession } from '@/components/AuthProvider';
import { LeaveRequestDTO, LeaveType, ApologyStatus } from '@/types';
import { leaveApi } from '@/lib/leaveApi';
import Toast, { ToastState } from '@/components/Toast';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { LayoutGrid, List, History, Inbox } from 'lucide-react';

export default function LeavePage() {
  const { session } = useSession();
  const [leaves, setLeaves] = useState<LeaveRequestDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [viewMode, setViewMode] = useState<'card' | 'table'>('table'); // Ưu tiên bảng
  const [activeSubTab, setActiveSubTab] = useState<'pending' | 'history'>('pending');

  const pushToast = (kind: ToastState['kind'], message: string) => setToast({ show: true, kind, message });
  const permissions = session?.permissions ?? [];
  const canView = permissions.includes('LEAVE_VIEW');
  const canCreate = permissions.includes('LEAVE_CREATE');
  const canApprove = permissions.includes('LEAVE_APPROVE');
  const [tab, setTab] = useState<'MY' | 'REVIEW'>(canApprove ? 'REVIEW' : 'MY');

  // Form state
  const [formData, setFormData] = useState({
    type: 'ANNUAL' as LeaveType,
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(), 'yyyy-MM-dd'),
    reason: '',
  });

  useEffect(() => {
    if (!canView) {
      setLeaves([]);
      setLoading(false);
      return;
    }
    void fetchData();
  }, [tab, canView]);

  useEffect(() => {
    if (!canApprove && tab === 'REVIEW') {
      setTab('MY');
    }
  }, [canApprove, tab]);

  const fetchData = async () => {
    if (!canView) return;
    setLoading(true);
    try {
      const data = tab === 'MY' ? await leaveApi.getMyLeaves() : await leaveApi.getAllLeaves();
      setLeaves(data);
    } catch (err) {
      pushToast('error', 'Lỗi khi tải danh sách nghỉ phép');
    } finally {
      setLoading(false);
    }
  };

  // Phân loại danh sách dựa trên Sub-tab
  const filteredDisplayLeaves = useMemo(() => {
    if (activeSubTab === 'pending') {
      return leaves.filter(l => l.status === 'PENDING');
    }
    return leaves.filter(l => l.status !== 'PENDING');
  }, [leaves, activeSubTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canCreate) {
      pushToast('error', 'Bạn không có quyền tạo đơn nghỉ phép');
      return;
    }
    try {
      await leaveApi.createLeave(formData);
      pushToast('success', 'Gửi đơn nghỉ phép thành công');
      setIsDialogOpen(false);
      fetchData();
    } catch (err) {
      pushToast('error', 'Lỗi khi gửi đơn');
    }
  };

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    if (!canApprove) {
      pushToast('error', 'Bạn không có quyền duyệt đơn nghỉ phép');
      return;
    }
    try {
      if (action === 'approve') await leaveApi.approveLeave(id);
      else await leaveApi.rejectLeave(id);
      pushToast('success', `${action === 'approve' ? 'Duyệt' : 'Từ chối'} thành công`);
      fetchData();
    } catch (err) {
      pushToast('error', 'Lỗi khi xử lý đơn');
    }
  };

  const getStatusColor = (status: ApologyStatus) => {
    switch (status) {
      case 'APPROVED': return 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-400/10 border-emerald-200 dark:border-emerald-400/20';
      case 'REJECTED': return 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-400/10 border-rose-200 dark:border-rose-400/20';
      default: return 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-400/10 border-amber-200 dark:border-amber-400/20';
    }
  };

  const getStatusText = (status: ApologyStatus) => {
    switch (status) {
      case 'APPROVED': return 'Đã duyệt';
      case 'REJECTED': return 'Từ chối';
      default: return 'Chờ duyệt';
    }
  };

  const getLeaveTypeText = (type: LeaveType) => {
    switch (type) {
      case 'ANNUAL': return 'Nghỉ phép năm';
      case 'SICK': return 'Nghỉ ốm';
      case 'UNPAID': return 'Nghỉ không lương';
      case 'HALF_DAY_AM': return 'Nghỉ nửa sáng';
      case 'HALF_DAY_PM': return 'Nghỉ nửa chiều';
      default: return 'Nghỉ bù';
    }
  };

  if (!session) return null;

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-[420px]">
        <div className="max-w-lg w-full bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[32px] p-10 text-center shadow-sm">
          <h1 className="text-2xl font-black uppercase tracking-widest text-slate-900 dark:text-white">Không có quyền truy cập</h1>
          <p className="mt-4 text-sm font-medium text-slate-500 dark:text-white/50">Tài khoản hiện tại chưa được gán quyền xem module nghỉ phép.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 h-full max-w-[1400px] mx-auto pb-20">
      <Toast toast={toast} onClose={() => setToast((prev) => ({ ...prev, show: false }))} />

      {/* Hero Header - Synced with Payroll Style */}
      <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-8 pt-10">
        <div>
          <h1 className="text-6xl md:text-8xl font-black text-white px-1 tracking-tighter mix-blend-overlay uppercase leading-none" style={{ textShadow: '0 2px 15px rgba(0,0,0,0.4)' }}>
            Nghỉ phép
          </h1>
          <p className="text-lg font-bold uppercase tracking-[0.3em] mt-6 ml-1 text-white/90" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.6)' }}>
            Quản lý & Đăng ký thời gian nghỉ
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/10 backdrop-blur-2xl p-3 rounded-[32px] border border-white/10 shadow-2xl">
          {canApprove && (
            <div className="flex bg-white/5 p-1 rounded-[20px] border border-white/10">
              <button
                onClick={() => setTab('MY')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'MY' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'text-white/40 hover:text-white/80'}`}
              >
                Của tôi
              </button>
              <button
                onClick={() => setTab('REVIEW')}
                className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'REVIEW' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/40' : 'text-white/40 hover:text-white/80'}`}
              >
                Cần duyệt
              </button>
            </div>
          )}

          {canCreate && (
            <button
              onClick={() => setIsDialogOpen(true)}
              className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl shadow-emerald-500/40 active:scale-95 transition-all"
            >
              <svg fill="none" viewBox="0 0 24 24" strokeWidth={3} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              ĐĂNG KÝ NGHỈ
            </button>
          )}
        </div>
      </div>

      {/* Control Console */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/50 dark:bg-white/5 p-4 rounded-[32px] border border-slate-200 dark:border-white/5 backdrop-blur-sm shadow-sm">
        <div className="flex bg-slate-100 dark:bg-black/20 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
          <button
            onClick={() => setActiveSubTab('pending')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'pending' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white'}`}
          >
            <Inbox className="w-3.5 h-3.5" />
            Chờ xử lý ({leaves.filter(l => l.status === 'PENDING').length})
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeSubTab === 'history' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 dark:text-white/30 hover:text-slate-700 dark:hover:text-white'}`}
          >
            <History className="w-3.5 h-3.5" />
            Lịch sử ({leaves.filter(l => l.status !== 'PENDING').length})
          </button>
        </div>

        <div className="flex items-center gap-1 bg-slate-100 dark:bg-black/20 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
          <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'table' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-white/30'}`}><List className="w-4 h-4" /></button>
          <button onClick={() => setViewMode('card')} className={`p-2.5 rounded-xl transition-all ${viewMode === 'card' ? 'bg-white dark:bg-white/10 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-400 dark:text-white/30'}`}><LayoutGrid className="w-4 h-4" /></button>
        </div>
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {loading ? (
          <div className="flex items-center justify-center p-20 bg-white/60 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/5">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
          </div>
        ) : filteredDisplayLeaves.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white/60 dark:bg-white/5 rounded-[40px] border border-slate-200 dark:border-white/5 text-center">
            <p className="text-slate-300 dark:text-white/10 font-black uppercase tracking-[0.2em] italic">Không có dữ liệu trong mục này</p>
          </div>
        ) : viewMode === 'table' ? (
          <div className="bg-white/80 dark:bg-white/5 backdrop-blur-3xl rounded-[40px] p-10 border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl">
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/20 text-slate-600 dark:text-white/70 font-black border-b border-black/5 dark:border-white/5 sticky top-0 z-20 backdrop-blur-md">
                  <tr>
                    <th className="px-10 py-6 text-left whitespace-nowrap">Nhân viên</th>
                    <th className="px-8 py-6 text-left whitespace-nowrap">Loại nghỉ</th>
                    <th className="px-8 py-6 text-left whitespace-nowrap">Từ ngày</th>
                    <th className="px-8 py-6 text-left whitespace-nowrap">Đến ngày</th>
                    <th className="px-8 py-6 text-left whitespace-nowrap">Lý do</th>
                    <th className="px-8 py-6 text-center whitespace-nowrap">Trạng thái</th>
                    {canApprove && tab === 'REVIEW' && activeSubTab === 'pending' && <th className="px-10 py-6 text-right whitespace-nowrap">Tác vụ</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                  {filteredDisplayLeaves.map((leave) => (
                    <tr key={leave.id} className="group hover:bg-slate-50 dark:hover:bg-white/5 transition-all duration-300">
                      <td className="px-10 py-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white font-black text-xs uppercase shrink-0">
                            {leave.employeeName?.charAt(0) || '?'}
                          </div>
                          <span className="text-slate-900 dark:text-white font-black text-xs uppercase tracking-tight">{leave.employeeName}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <span className="text-slate-700 dark:text-white/80 font-bold text-xs uppercase tracking-widest">{getLeaveTypeText(leave.type)}</span>
                      </td>
                      <td className="px-8 py-5 text-slate-900 dark:text-white font-bold text-xs">{format(new Date(leave.startDate), 'dd/MM/yyyy')}</td>
                      <td className="px-8 py-5 text-slate-900 dark:text-white font-bold text-xs">{format(new Date(leave.endDate), 'dd/MM/yyyy')}</td>
                      <td className="px-8 py-5 max-w-[200px]"><p className="text-slate-500 dark:text-white/40 text-[11px] italic font-medium line-clamp-1">"{leave.reason || '...'}"</p></td>
                      <td className="px-8 py-5 text-center">
                        <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border ${getStatusColor(leave.status)}`}>
                          {getStatusText(leave.status)}
                        </span>
                      </td>
                      {canApprove && tab === 'REVIEW' && activeSubTab === 'pending' && (
                        <td className="px-10 py-5 text-right">
                          <div className="flex items-center justify-end gap-2">
                             <button onClick={() => handleAction(leave.id, 'reject')} className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex items-center justify-center border border-rose-200 dark:border-rose-500/20 active:scale-90 transition-all">✕</button>
                             <button onClick={() => handleAction(leave.id, 'approve')} className="w-10 h-10 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl flex items-center justify-center active:scale-90 transition-all shadow-lg shadow-emerald-500/20">✓</button>
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {filteredDisplayLeaves.map((leave) => (
              <div key={leave.id} className="bg-white/80 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[32px] p-8 group transition-all hover:bg-white dark:hover:bg-white/[0.08] shadow-sm">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${getStatusColor(leave.status)}`}>{getStatusText(leave.status)}</span>
                    <h3 className="text-xl font-black text-slate-900 dark:text-white mt-2 uppercase">{getLeaveTypeText(leave.type)}</h3>
                  </div>
                  {canApprove && tab === 'REVIEW' && activeSubTab === 'pending' && (
                    <div className="flex gap-2">
                       <button onClick={() => handleAction(leave.id, 'reject')} className="w-10 h-10 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl">✕</button>
                       <button onClick={() => handleAction(leave.id, 'approve')} className="w-10 h-10 bg-emerald-500 text-white rounded-xl shadow-lg shadow-emerald-500/20">✓</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase">Bắt đầu</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{format(new Date(leave.startDate), 'dd MMM, yyyy', { locale: vi })}</p>
                  </div>
                  <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl">
                    <p className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase">Kết thúc</p>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">{format(new Date(leave.endDate), 'dd MMM, yyyy', { locale: vi })}</p>
                  </div>
                </div>
                <p className="text-slate-500 dark:text-white/60 text-sm italic border-l-2 border-indigo-500/50 pl-4 leading-relaxed">"{leave.reason}"</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Dialog */}
      {isDialogOpen && canCreate && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-6 bg-slate-950/70 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl rounded-[40px] border border-slate-200 dark:border-white/10 overflow-hidden shadow-2xl">
            <div className="p-10 space-y-8">
              <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-6">
                <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-widest">Đăng ký <span className="text-indigo-600 dark:text-indigo-400">nghỉ phép</span></h2>
                <button onClick={() => setIsDialogOpen(false)} className="text-slate-400 hover:text-indigo-600 font-black uppercase text-xs tracking-widest transition-colors">đóng</button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Loại hình</label>
                  <select value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value as LeaveType })} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white font-bold appearance-none outline-none">
                    <option value="ANNUAL">Nghỉ phép năm</option>
                    <option value="SICK">Nghỉ ốm</option>
                    <option value="UNPAID">Nghỉ không lương</option>
                    <option value="HALF_DAY_AM">Nghỉ nửa sáng</option>
                    <option value="HALF_DAY_PM">Nghỉ nửa chiều</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Từ ngày</label>
                    <input type="date" value={formData.startDate} onChange={(e) => setFormData({ ...formData, startDate: e.target.value })} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white font-bold outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Đến ngày</label>
                    <input type="date" value={formData.endDate} onChange={(e) => setFormData({ ...formData, endDate: e.target.value })} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white font-bold outline-none" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Lý do</label>
                  <textarea value={formData.reason} onChange={(e) => setFormData({ ...formData, reason: e.target.value })} rows={4} className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white font-medium resize-none outline-none" />
                </div>
                <button type="submit" className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-500/40 hover:bg-indigo-500 active:scale-95 transition-all">Gửi đơn phê duyệt</button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
