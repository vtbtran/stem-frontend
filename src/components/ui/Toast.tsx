"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";

export type ToastType = "success" | "error" | "info";

interface ToastProps {
  message: string;
  type?: ToastType;
  isVisible: boolean;
  onClose: () => void;
  duration?: number;
}

export default function Toast({
  message,
  type = "info",
  isVisible,
  onClose,
  duration = 3000,
}: ToastProps) {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [isVisible, duration, onClose]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl backdrop-blur-md border border-white/10 min-w-[300px] max-w-md"
          style={{
            background: type === "error" 
              ? "rgba(239, 68, 68, 0.9)" 
              : type === "success" 
                ? "rgba(34, 197, 94, 0.9)" 
                : "rgba(15, 23, 42, 0.9)",
            color: "white"
          }}
        >
          <div className="shrink-0">
            {type === "error" && <AlertCircle className="w-5 h-5 text-white" />}
            {type === "success" && <CheckCircle2 className="w-5 h-5 text-white" />}
            {type === "info" && <AlertCircle className="w-5 h-5 text-blue-400" />}
          </div>
          
          <div className="flex-1 text-sm font-medium leading-relaxed">
            {message}
          </div>

          <button 
            onClick={onClose}
            className="shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
