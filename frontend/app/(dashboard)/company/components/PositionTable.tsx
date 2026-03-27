"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import api from "@/lib/api";
import DraggableModal from "@/components/DraggableModal";
import { Position } from "@/types";

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

export default function PositionTable() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);

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
      alert(getErrorMessage(err, "Không thể tải danh sách chức vụ."));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchPositions();
  }, []);

  function openCreateModal() {
    setEditingPosition(null);
    setFormData(EMPTY_FORM);
    setError("");
    setShowFormModal(true);
  }

  function openEditModal(position: Position) {
    if (position.isLocked) {
      alert("Vị trí này - b- khóa, không thể chọnh sa.");
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
    if (!formData.name.trim()) {
      setError("Tn chức vụ không c - trêng.");
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
    if (position.isLocked) {
      alert("Vị trí này - b- khóa, không thể xóa.");
      return;
    }
    setTargetDelete(position);
    setShowDeleteModal(true);
  }

  async function confirmDelete() {
    if (!targetDelete) return;
    setSubmitting(true);
    try {
      await api.delete(`/api/company/positions/${targetDelete.id}`);
      setShowDeleteModal(false);
      setTargetDelete(null);
      await fetchPositions();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Không thể xóa chức vụ."));
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleLock(id: string, currentLock: boolean) {
    try {
      await api.patch(`/api/company/positions/${id}/lock?locked=${!currentLock}`);
      await fetchPositions();
    } catch (err: unknown) {
      alert(getErrorMessage(err, "Không thể cập nhật trạng thái khóa."));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">Danh sách chức vụ</h3>
        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium"
        >
          + Thêm chức vụ
        </button>
      </div>

      {loading ? (
        <div className="py-6 text-center text-gray-300">Đang tải...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full divide-y divide-gray-700 bg-white/5">
            <thead>
              <tr className="bg-black/40 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                <th className="px-6 py-4">Chức vụ</th>
                <th className="px-6 py-4">M- t</th>
                <th className="px-6 py-4 text-center">Khóa</th>
                <th className="px-6 py-4 text-right">Thao tc</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {positions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-6 text-center text-gray-500">Chưa có dữ liệu</td>
                </tr>
              ) : (
                positions.map((position) => (
                  <tr key={position.id} className={`hover:bg-white/5 transition-colors ${position.isLocked ? "opacity-80" : ""}`}>
                    <td className="px-6 py-4 text-sm font-medium text-white">{position.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">{position.description || "-"}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => void toggleLock(position.id, position.isLocked)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          position.isLocked ? "bg-red-500/20 text-red-400" : "bg-green-500/20 text-green-400"
                        }`}
                      >
                        {position.isLocked ? "- khóa" : "Hot ng"}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium space-x-4">
                      {!position.isLocked && (
                        <>
                          <button onClick={() => openEditModal(position)} className="text-blue-400 hover:text-blue-300">
                            Sửa
                          </button>
                          <button onClick={() => openDeleteModal(position)} className="text-red-400 hover:text-red-300">
                            Xóa
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showFormModal && (
        <DraggableModal
          title={editingPosition ? "Sửa chức vụ" : "Thêm chức vụ"}
          onClose={() => setShowFormModal(false)}
          widthClassName="max-w-lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-gray-300 mb-1">Tn chức vụ</label>
              <input
                value={formData.name}
                onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-300 mb-1">M- t</label>
              <input
                value={formData.description}
                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full bg-white/10 border border-white/20 rounded-md p-2 text-white"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.multiPerDept}
                  onChange={(e) => setFormData((prev) => ({ ...prev, multiPerDept: e.target.checked }))}
                />
                Cho phép nhiu người/phòng ban
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.standalone}
                  onChange={(e) => setFormData((prev) => ({ ...prev, standalone: e.target.checked }))}
                />
                C- thể dùng c lp
              </label>
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50"
              >
                {submitting ? "ang lưu..." : editingPosition ? "Cập nhật" : "Thêm mới"}
              </button>
            </div>
          </form>
        </DraggableModal>
      )}

      {showDeleteModal && targetDelete && (
        <DraggableModal title="Xc nhơn xóa" onClose={() => setShowDeleteModal(false)}>
          <p className="text-sm text-gray-300 mb-5">
            Bạn c- chắc muốn xóa chức vụ <span className="font-semibold text-white">{targetDelete.name}</span> không?
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-white"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={() => void confirmDelete()}
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white disabled:opacity-50"
            >
              {submitting ? "ang xóa..." : "Xóa"}
            </button>
          </div>
        </DraggableModal>
      )}
    </div>
  );
}
