"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

export type ReviewPayload = {
  workspace: unknown;
  source: string;
  explanation?: string;
  preview?: boolean;
};

type Props = {
  isOpen: boolean;
  payload: ReviewPayload | null;
  onClose: () => void;
  onAccept: (payload: ReviewPayload) => void;
  onReject: () => void;
  onUndo: () => void;
  onRedo: () => void;
};

export default function WorkspaceReviewPanel({ isOpen, payload, onClose, onAccept, onReject, onUndo, onRedo }: Props) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // Update visibility when isOpen changes
  useEffect(() => {
    setIsVisible(isOpen);
  }, [isOpen]);

  // Listen for review_close event (triggered when undo from preview)
  useEffect(() => {
    const onReviewClose = () => {
      setIsVisible(false);
      onClose();
    };
    window.addEventListener("blockly:review_close", onReviewClose as EventListener);
    return () => window.removeEventListener("blockly:review_close", onReviewClose as EventListener);
  }, [onClose]);

  // Handle Accept - giữ lại thay đổi
  const handleAccept = () => {
    if (payload) {
      window.dispatchEvent(new CustomEvent("blockly:accept_preview"));
      onAccept(payload);
    }
  };

  // Handle Reject - hoàn tác về trước đó
  const handleReject = () => {
    window.dispatchEvent(new CustomEvent("blockly:reject_preview"));
    onReject();
  };

  // Handle Undo/Redo với notification
  const handleUndo = () => {
    onUndo();
  };

  const handleRedo = () => {
    onRedo();
  };

  if (!payload) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop - không đóng khi click để tránh vô tình mất panel */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/5 backdrop-blur-[1px] z-[140] pointer-events-none"
          />

          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="fixed right-4 bottom-4 z-[141] w-[400px] max-w-[calc(100vw-32px)] rounded-2xl overflow-hidden border border-slate-200 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.25)]"
          >
            <div className="px-4 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-extrabold text-slate-900">Review thay đổi AI</span>
                  <span className="text-[10px] font-bold text-white bg-gradient-to-r from-blue-500 to-purple-500 px-2 py-0.5 rounded-full">
                    {payload.source}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                  Xem trên workspace chính • Accept để giữ • Reject/Undo để hoàn tác
                </p>
              </div>

              <button
                onClick={handleReject}
                className="w-8 h-8 rounded-xl hover:bg-red-100 flex items-center justify-center text-slate-500 hover:text-red-600 transition-colors"
                title="Từ chối và hoàn tác (Reject)"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3">
              {/* Status Banner */}
              <div className="rounded-xl border border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50 p-3">
                <div className="flex items-start gap-2">
                  <span className="text-lg">👁️</span>
                  <div>
                    <p className="text-xs font-bold text-slate-800">Đang xem trước</p>
                    <p className="text-[11px] text-slate-600 mt-0.5">
                      Các khối AI đã được tải vào workspace. Hãy kiểm tra trên màn hình chính!
                    </p>
                  </div>
                </div>
              </div>

              {payload.explanation && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <span>📝</span> Giải thích từ AI
                  </p>
                  <p className="text-xs text-slate-700 mt-1.5 whitespace-pre-wrap leading-relaxed">{payload.explanation}</p>
                </div>
              )}

              {/* Accept / Reject */}
              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  className="flex-1 h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-extrabold transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                  Accept
                </button>
                <button
                  onClick={handleReject}
                  className="flex-1 h-11 rounded-xl bg-white border-2 border-slate-300 hover:border-red-400 hover:text-red-600 text-slate-700 text-sm font-extrabold transition-all flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Reject
                </button>
              </div>

              {/* Undo / Redo */}
              <div className="flex gap-2">
                <button
                  onClick={handleUndo}
                  className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  title="Hoàn tác (Ctrl+Z)"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                  Undo
                </button>
                <button
                  onClick={handleRedo}
                  className="flex-1 h-10 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                  title="Làm lại (Ctrl+Y)"
                >
                  Redo
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6" />
                  </svg>
                </button>
              </div>

              {/* Keyboard hints */}
              <p className="text-[10px] text-slate-400 text-center">
                Phím tắt: Ctrl+Z = Undo • Ctrl+Y = Redo • ESC = Reject
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
