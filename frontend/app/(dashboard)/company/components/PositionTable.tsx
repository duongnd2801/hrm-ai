"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import DraggableModal from "@/components/DraggableModal";
import Toast, { ToastState } from "@/components/Toast";
import { Position } from "@/types";
import { Pencil, Trash2 } from "lucide-react";

type PositionForm = {
  name: string;
  description: string;
  multiPerDept: boolean;
  standalone: boolean;
};

function getErrorMessage(err: unknown, fallback: string): string {
  if (!axios.isAxiosError(err)) return fallback;
  const data = err.response?.data;
  if (typeof data === "string") return data;
  return (data as { message?: string } | undefined)?.message || fallback;
}

const EMPTY_FORM: PositionForm = {
  name: "",
  description: "",
  multiPerDept: true,
  standalone: true,
};

interface PositionTableProps {
  canManage?: boolean;
  canToggleLock?: boolean;
}

export default function PositionTable({ canManage = false, canToggleLock = false }: PositionTableProps) {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<ToastState>({ show: false, kind: 'info', message: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const pushToast = (kind: ToastState['kind'], message: string) =>
    setToast({ show: true, kind, message });

  const [showFormModal, setShowFormModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [targetDelete, setTargetDelete] = useState<Position | null>(null);

  const [formData, setFormData] = useState<PositionForm>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function fetchPositions() {
    try {
      const res = await api.get("/api/company/positions");
      setPositions(res.data as Position[]);
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, "Không thể tải danh sách chức vụ."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPositions();
  }, []);

  function openCreateModal() {
    if (!canManage) return;
    setEditingPosition(null);
    setFormData(EMPTY_FORM);
    setError("");
    setShowFormModal(true);
  }

  function openEditModal(position: Position) {
    if (!canManage) return;
    if (position.isLocked) {
      pushToast('error', "Vị trí này đã bị khóa, không thể chỉnh sửa.");
      return;
    }
    setEditingPosition(position);
    setFormData({
      name: position.name,
      description: position.description || "",
      multiPerDept: position.multiPerDept ?? true,
      standalone: position.standalone ?? true,
    });
    setError("");
    setShowFormModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canManage) return;
    if (!formData.name.trim()) {
      setError("Tên chức vụ không được để trống.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      if (editingPosition) {
        await api.put(`/api/company/positions/${editingPosition.id}`, {
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
      } else {
        await api.post("/api/company/positions", {
          ...formData,
          name: formData.name.trim(),
          description: formData.description.trim(),
        });
      }
      setShowFormModal(false);
      await fetchPositions();
    } catch (err: unknown) {
      setError(getErrorMessage(err, "Không thể lưu chức vụ."));
    } finally {
      setSubmitting(false);
    }
  }

  function openDeleteModal(position: Position) {
    if (!canManage) return;
    if (position.isLocked) {
      pushToast('error', "Vị trí này đã bị khóa, không thể xóa.");
      return;
    }
    setTargetDelete(position);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!targetDelete || !canManage) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/company/positions/${targetDelete.id}`);
      setShowDeleteModal(false);
      setTargetDelete(null);
      await fetchPositions();
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, "Không thể xóa chức vụ."));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLock(id: string, currentLock: boolean) {
    if (!canToggleLock) return;
    try {
      await api.patch(`/api/company/positions/${id}/lock?locked=${!currentLock}`);
      await fetchPositions();
    } catch (err: unknown) {
      pushToast('error', getErrorMessage(err, "Không thể cập nhật trạng thái khóa."));
    }
  }

  return (
    <div className="space-y-8">
      <Toast toast={toast} onClose={() => setToast(p => ({ ...p, show: false }))} />
      <div className="flex items-center justify-between px-2 lg:px-6 pt-4">
        <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none italic">Danh mục vị trí</h3>
        {canManage && (
          <button
            onClick={openCreateModal}
            className="px-8 py-3.5 rounded-2xl bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 hover:scale-105 active:scale-95 text-white text-xs font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/30 transition-all duration-300"
          >
            + Thêm chức vụ mới
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-slate-500/60 dark:text-white/50 font-black uppercase tracking-widest animate-pulse">Đang nạp dữ liệu phân cấp...</div>
      ) : (
        <div className="overflow-x-auto rounded-[32px] border border-black/5 dark:border-white/10 shadow-xl dark:shadow-3xl bg-white/80 dark:bg-white/5 backdrop-blur-3xl mx-2 lg:mx-6 overflow-hidden">
          <table className="min-w-full divide-y divide-black/5 dark:divide-white/5 text-slate-900 dark:text-white">
            <thead className="text-[11px] uppercase tracking-[0.2em] bg-white/90 dark:bg-black/40 text-slate-600 dark:text-white/70 font-black sticky top-0 z-20 backdrop-blur-md border-b border-black/5 dark:border-white/5">
              <tr>
                <th className="px-8 py-6 rounded-tl-3xl text-left whitespace-nowrap">CHỨC VỤ & VỊ TRÍ</th>
                <th className="px-8 py-6 text-center whitespace-nowrap">TRẠNG THÁI KHÓA</th>
                <th className="px-8 py-6 text-right pr-10 rounded-tr-3xl whitespace-nowrap">QUẢN LÝ THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-8 py-10 text-center text-slate-500/60 dark:text-white/50 font-bold uppercase text-xs italic tracking-[0.2em] animate-pulse">Hệ thống chưa thiết lập danh mục vị trí</td>
                </tr>
              ) : (
                positions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage).map((position) => (
                  <tr key={position.id} className={`group hover:bg-indigo-500/[0.05] dark:bg-slate-900/40 dark:hover:bg-indigo-500/10 transition-all duration-300 ${position.isLocked ? "bg-slate-50 dark:bg-slate-900/60 opacity-60" : ""}`}>
                    <td className="px-8 py-3">
                       <span className={`text-[12px] font-black uppercase tracking-tight ${position.isLocked ? "text-slate-400 dark:text-white/30" : "text-slate-900 dark:text-white"}`}>{position.name}</span>
                    </td>
                    <td className="px-8 py-3 text-center">
                      {canToggleLock ? (
                        <button
                          onClick={() => void toggleLock(position.id, position.isLocked)}
                          className={`px-5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${
                            position.isLocked 
                              ? "bg-rose-700 text-white shadow-xl shadow-rose-700/40" 
                              : "bg-emerald-500 text-white shadow-xl shadow-emerald-500/20"
                          }`}
                        >
                          {position.isLocked ? "Bị khóa" : "Sẵn dụng"}
                        </button>
                      ) : (
                        <span className={`px-5 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${position.isLocked ? "bg-rose-700 text-white" : "bg-emerald-500 text-white"}`}>
                          {position.isLocked ? "Bị khóa" : "Sẵn dụng"}
                        </span>
                      )}
                    </td>
                    <td className="px-8 py-3 text-right space-x-2">
                      {canManage && !position.isLocked ? (
                        <>
                          <button onClick={() => openEditModal(position)} className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-amber-500 text-white hover:bg-amber-600 shadow-lg transition-all active:scale-95" title="Sửa vị trí">
                             <Pencil className="w-5 h-5" />
                          </button>
                          <button onClick={() => openDeleteModal(position)} className="w-10 h-10 inline-flex items-center justify-center rounded-xl bg-rose-500 text-white hover:bg-rose-600 shadow-lg transition-all active:scale-95" title="Xóa vị trí">
                             <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      ) : position.isLocked ? (
                         <span className="text-[10px] font-black text-rose-700 uppercase tracking-widest underline decoration-wavy decoration-rose-700/30">Hệ thống khóa</span>
                      ) : (
                         <span className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest">Read only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {positions.length > itemsPerPage && (
        <div className="flex items-center justify-between px-6 pb-4">
          <div className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">
            Tổng {positions.length} vị trí
          </div>
          <div className="flex items-center gap-2">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(p => p - 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 disabled:opacity-20 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            >
              &larr;
            </button>
            <div className="px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/30">
                Trang {currentPage} / {Math.ceil(positions.length / itemsPerPage)}
            </div>
            <button 
              disabled={currentPage === Math.ceil(positions.length / itemsPerPage)}
              onClick={() => setCurrentPage(p => p + 1)}
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-100 dark:bg-white/5 text-slate-400 disabled:opacity-20 hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
            >
              &rarr;
            </button>
          </div>
        </div>
      )}

      {canManage && showFormModal && (
        <DraggableModal
          title={editingPosition ? "Sửa chức vụ" : "Thêm chức vụ"}
          onClose={() => setShowFormModal(false)}
          widthClassName="max-w-xl"
        >
          <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-6">
                <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 mb-2 ml-1">Tên vị trí công việc</label>
                <input
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all font-bold text-sm tracking-tight uppercase"
                    placeholder="Ví dụ: Giám đốc, Lập trình viên, Kế toán trưởng..."
                />
                </div>
                <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 mb-2 ml-1">Mô tả chi tiết</label>
                <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    className="w-full bg-black/[0.03] dark:bg-white/5 border border-black/5 dark:border-white/10 rounded-2xl py-4 px-6 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-white/20 focus:outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500/50 transition-all font-bold text-sm resize-none"
                    placeholder="Mô tả trách nhiệm hoặc yêu cầu công việc..."
                />
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-black/[0.02] dark:bg-black/20 p-6 rounded-3xl border border-black/5 dark:border-white/5">
              <label className="flex items-center gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.multiPerDept}
                  onChange={(e) => setFormData((prev) => ({ ...prev, multiPerDept: e.target.checked }))}
                  className="w-5 h-5 rounded-md border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                />
                <span className="text-[11px] font-black text-slate-500 dark:text-white/60 uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">Đa nhiệm/Phòng</span>
              </label>
              <label className="flex items-center gap-4 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={formData.standalone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, standalone: e.target.checked }))}
                  className="w-5 h-5 rounded-md border-black/10 dark:border-white/10 bg-white dark:bg-white/5 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                />
                <span className="text-[11px] font-black text-slate-500 dark:text-white/60 uppercase tracking-widest group-hover:text-indigo-600 dark:group-hover:text-white transition-colors">Chạy độc lập</span>
              </label>
            </div>

            {error && (
              <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 dark:text-rose-400 text-xs font-black uppercase tracking-widest animate-shake">
                {error}
              </div>
            )}
            
            <div className="flex justify-between items-center pt-8">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-indigo-600 dark:bg-indigo-500 hover:bg-indigo-500 dark:hover:bg-indigo-400 text-white shadow-2xl shadow-indigo-500/30 transition-all disabled:opacity-30 active:scale-95 duration-300"
              >
                {submitting ? "Đang nộp..." : editingPosition ? "Cập nhật vị trí" : "Xác nhận tạo mới"}
              </button>
            </div>
          </form>
        </DraggableModal>
      )}

      {canManage && showDeleteModal && targetDelete && (
        <DraggableModal title="Loại bỏ vị trí" onClose={() => setShowDeleteModal(false)}>
           <div className="text-center py-4">
              <div className="w-20 h-20 bg-rose-500/10 rounded-3xl flex items-center justify-center text-rose-500 mx-auto mb-8 animate-bounce">
                 <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </div>
              <p className="text-sm font-bold text-slate-500 dark:text-white/60 mb-10 leading-relaxed uppercase tracking-widest italic">
                Bạn có chắc chắn muốn xóa vị trí <br/> 
                <span className="font-black text-slate-900 dark:text-white mt-4 block text-3xl tracking-tighter mix-blend-overlay animate-pulse ring-1 ring-amber-500/20 py-4 rounded-2xl bg-amber-500/5">{targetDelete.name}</span> <br/>
                Hành động này sẽ gỡ bỏ vị trí khỏi danh mục chung.
              </p>
              <div className="flex justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30 hover:text-slate-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-all"
                >
                  Hủy thao tác
                </button>
                <button
                  type="button"
                  onClick={() => void confirmDelete()}
                  disabled={submitting}
                  className="px-12 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest bg-rose-600 hover:bg-rose-500 text-white shadow-2xl shadow-rose-500/30 transition-all active:scale-95 duration-300"
                >
                  {submitting ? "Äang xÃ³a..." : "XÃ¡c nháº­n xÃ³a"}
                </button>
              </div>
           </div>
        </DraggableModal>
      )}
    </div>
  );
}
