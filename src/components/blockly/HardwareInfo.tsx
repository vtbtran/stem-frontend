"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function HardwareInfo() {
    const [isOpen, setIsOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 transition-colors"
                title="Quy tắc quy đổi Hardware"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                    className="w-4 h-4"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
                    />
                </svg>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden"
                    >
                        <div className="bg-zinc-50 px-4 py-2 border-b border-zinc-100 flex justify-between items-center">
                            <span className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                                Hardware Protocol
                            </span>
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>

                        <div className="p-4 space-y-4 text-xs text-zinc-600">
                            <div className="space-y-1">
                                <div className="font-semibold text-zinc-800">1. Di chuyển (Bước)</div>
                                <div className="flex justify-between border-b border-dashed pb-1">
                                    <span>1 Bước (Step)</span>
                                    <span className="font-mono text-blue-600">≈ 20ms</span>
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                    Lệnh gửi: <code>M,150,Duration</code>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="font-semibold text-zinc-800">2. Quay (Độ)</div>
                                <div className="flex justify-between border-b border-dashed pb-1">
                                    <span>1 Độ (Degree)</span>
                                    <span className="font-mono text-purple-600">≈ 10ms</span>
                                </div>
                                <div className="text-[10px] text-zinc-400">
                                    Lệnh gửi: <code>T,150,Duration</code>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <div className="font-semibold text-zinc-800">3. Thời gian & Tốc độ</div>
                                <div className="flex justify-between border-b border-dashed pb-1">
                                    <span>Tốc độ mặc định</span>
                                    <span className="font-mono text-orange-600">150</span>
                                </div>
                                <div className="text-[10px] text-zinc-400 pt-1 italic">
                                    * Tốc độ động cơ DC từ 0 - 255.
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
