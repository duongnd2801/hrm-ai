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
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm">
      <button
        type="button"
        aria-label="Close modal backdrop"
        className="absolute inset-0 h-full w-full cursor-default"
        onClick={onClose}
      />
      <div
        className={`absolute left-1/2 top-1/2 w-[92vw] ${widthClassName} rounded-2xl border border-white/10 bg-[#0f172a] shadow-2xl`}
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
        }}
      >
        <div
          className="flex items-center justify-between border-b border-white/10 px-5 py-3 cursor-move select-none"
          onMouseDown={onHeaderMouseDown}
        >
          <h4 className="text-lg font-semibold text-white">{title}</h4>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md px-2 py-1 text-sm text-gray-300 hover:bg-white/10"
          >
            x
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>,
    document.body
  );
}
