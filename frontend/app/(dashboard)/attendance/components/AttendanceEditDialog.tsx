'use client';

import { useState, useEffect } from 'react';
import { X, Save, Clock, FileText } from 'lucide-react';
import api from '@/lib/api';

interface AttendanceEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employeeId: string;
  employeeName: string;
  date: string;
  record?: any; // The full attendance record if it exists
}

export default function AttendanceEditDialog({
  isOpen,
  onClose,
  onSuccess,
  employeeId,
  employeeName,
  date,
  record,
}: AttendanceEditDialogProps) {
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Helper to format any date-time representation to HH:mm
    const toTime = (iso?: any) => {
      if (!iso) return '';

      // 1. Handle Spring Boot default array format [year, month, day, hour, minute, ...]
      if (Array.isArray(iso)) {
        if (iso.length >= 5) {
          return `${String(iso[3]).padStart(2, '0')}:${String(iso[4]).padStart(2, '0')}`;
        }
        // If it's a time-only array [hour, minute]
        if (iso.length >= 2) {
          return `${String(iso[0]).padStart(2, '0')}:${String(iso[1]).padStart(2, '0')}`;
        }
        return '';
      }

      // 2. Handle Object format { hour, minute }
      if (typeof iso === 'object') {
        const h = iso.hour ?? iso.hours ?? iso.hh;
        const m = iso.minute ?? iso.minutes ?? iso.mm;
        if (h !== undefined && m !== undefined) {
          return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
        }
      }
      
      // 3. Handle String format (Regex HH:mm)
      if (typeof iso === 'string') {
        const match = iso.match(/(\d{2}):(\d{2})/);
        if (match) return `${match[1]}:${match[2]}`;
      }
      
      return '';
    };

    // Try multiple property names to be safe (checkIn vs check_in)
    const rawCheckIn = record?.checkIn ?? record?.check_in;
    const rawCheckOut = record?.checkOut ?? record?.check_out;
    const rawNote = record?.note ?? record?.notes ?? '';

    setCheckIn(toTime(rawCheckIn));
    setCheckOut(toTime(rawCheckOut));
    setNote(rawNote || '');
  }, [record, isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      // Build Local ISO string (YYYY-MM-DDTHH:mm:00) to avoid UTC conversion issues
      const buildLocalISO = (time: string) => {
        if (!time) return null;
        const [h, m] = time.split(':');
        return `${date}T${h.padStart(2, '0')}:${m.padStart(2, '0')}:00`;
      };

      await api.post('/api/attendance/manual', {
        employeeId,
        date,
        checkIn: buildLocalISO(checkIn),
        checkOut: buildLocalISO(checkOut),
        note,
      });
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to update attendance', error);
      alert('Không thể cập nhật chấm công. Vui lòng kiểm tra lại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose} />
      
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-[40px] border border-white/20 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="p-8 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Sửa chấm công</h3>
            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mt-1">{employeeName} — {date}</p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-all">
            <X size={20} className="text-slate-400" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Giờ vào (HH:mm)
            </label>
            <input 
              type="time" 
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full h-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
              <Clock size={12} /> Giờ ra (HH:mm)
            </label>
            <input 
              type="time" 
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full h-14 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-6 text-slate-900 dark:text-white font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-widest flex items-center gap-2">
              <FileText size={12} /> Ghi chú
            </label>
            <textarea 
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Nhập lý do sửa hoặc ghi chú..."
              className="w-full h-24 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 text-slate-900 dark:text-white font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none"
            />
          </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/5 flex gap-4">
          <button 
            onClick={onClose}
            className="flex-1 h-14 rounded-2xl text-[12px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          >
            Hủy
          </button>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="flex-1 h-14 bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white rounded-2xl text-[12px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
          >
            {loading ? 'Đang lưu...' : <><Save size={16} /> Lưu thay đổi</>}
          </button>
        </div>
      </div>
    </div>
  );
}
