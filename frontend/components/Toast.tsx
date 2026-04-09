'use client';

import { useEffect } from 'react';

export type ToastKind = 'success' | 'error' | 'info';

export interface ToastState {
  show: boolean;
  kind: ToastKind;
  message: string;
}

export default function Toast({
  toast,
  onClose,
  duration = 3200,
}: {
  toast: ToastState;
  onClose: () => void;
  duration?: number;
}) {
  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(onClose, duration);
    return () => clearTimeout(timer);
  }, [toast.show, duration, onClose]);

  if (!toast.show) return null;

  const toastClass =
    toast.kind === 'success'
      ? 'border-emerald-400/30 bg-emerald-500/15 text-emerald-200'
      : toast.kind === 'error'
      ? 'border-rose-400/30 bg-rose-500/15 text-rose-200'
      : 'border-cyan-400/30 bg-cyan-500/15 text-cyan-200';

  return (
    <div className="fixed right-5 top-20 z-[9999]">
      <div className={`max-w-sm rounded-xl border px-4 py-3 shadow-2xl backdrop-blur-md ${toastClass}`}>
        <div className="flex items-start gap-3">
          <div className="text-sm font-medium leading-6">{toast.message}</div>
          <button onClick={onClose} className="ml-auto text-xs opacity-80 hover:opacity-100">
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
