"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Position = { x: number; y: number };

type DraggableModalProps = {
  title: string;
  onClose: () => void;
  children: ReactNode;
  widthClassName?: string;
};

export default function DraggableModal({
  title,
  onClose,
  children,
  widthClassName = "max-w-md",
}: DraggableModalProps) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const startRef = useRef<Position>({ x: 0, y: 0 });
  const originRef = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging) return;
      const dx = e.clientX - startRef.current.x;
      const dy = e.clientY - startRef.current.y;
      setPosition({ x: originRef.current.x + dx, y: originRef.current.y + dy });
    }

    function onUp() {
      setDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging]);

  function onHeaderMouseDown(e: React.MouseEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(true);
    startRef.current = { x: e.clientX, y: e.clientY };
    originRef.current = position;
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] bg-black/60 dark:bg-black/70 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        className={`absolute left-1/2 top-1/2 w-[92vw] ${widthClassName} rounded-[32px] glass-dark shadow-3xl overflow-hidden animate-in fade-in zoom-in duration-200`}
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      >
        <div
          className="flex items-center justify-between border-b border-black/5 dark:border-white/10 px-8 py-5 cursor-move select-none bg-black/[0.02] dark:bg-white/[0.02]"
          onMouseDown={onHeaderMouseDown}
        >
          <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter leading-none">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-slate-400 dark:text-white/20 hover:text-rose-500 hover:bg-rose-500/10 transition-all font-black"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>,
    document.body
  );
}
