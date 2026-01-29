"use client";

import { useEffect, useState, useRef } from "react";

type LogEntry = {
    type: "log" | "error";
    message: string;
    timestamp: number;
};

export default function Terminal() {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [mounted, setMounted] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(() => {
            setMounted(true);
        }, 0);
        const handleLog = (e: Event) => {
            // ... (code unchanged below, just adding the mounted check in return)
            const ce = e as CustomEvent<{ args: unknown[] }>;
            const message = ce.detail.args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(" ");

            setLogs((prev) => [...prev, { type: "log", message, timestamp: Date.now() }]);
        };

        const handleError = (e: Event) => {
            const ce = e as CustomEvent<{ error: string }>;
            setLogs((prev) => [...prev, { type: "error", message: ce.detail.error, timestamp: Date.now() }]);
        };

        const handleNewRun = () => {
            setLogs((prev) => {
                if (prev.length === 0) return [];
                return [{
                    type: "log",
                    message: "--- 🧹 Terminal đã được dọn dẹp - Bắt đầu chạy mới ---",
                    timestamp: Date.now()
                }];
            });
        };

        window.addEventListener("blockly:log", handleLog);
        window.addEventListener("blockly:error", handleError);
        window.addEventListener("blockly:run", handleNewRun);

        return () => {
            clearTimeout(timer);
            window.removeEventListener("blockly:log", handleLog);
            window.removeEventListener("blockly:error", handleError);
            window.removeEventListener("blockly:run", handleNewRun);
        };
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            const el = scrollRef.current;
            requestAnimationFrame(() => {
                el.scrollTop = el.scrollHeight;
            });
        }
    }, [logs]);

    if (!mounted) return <div className="h-full bg-transparent" />;

    return (
        <div className="flex h-full flex-col bg-transparent font-mono text-[12px] text-slate-200 overflow-hidden relative">
            <div className="flex items-center justify-between h-10 px-4 bg-[#0B0F14]/30 border-b border-slate-700/50 shrink-0 select-none">
                <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">Terminal</span>
                </div>
                <button
                    onClick={() => setLogs([])}
                    className="p-1.5 rounded hover:bg-slate-700/50 text-slate-500 hover:text-slate-300 transition-all group"
                    title="Clear Output"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-3 scroll-smooth
                    [&::-webkit-scrollbar]:w-1.5
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-slate-700
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    hover:[&::-webkit-scrollbar-thumb]:bg-slate-600"
            >
                {logs.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 select-none opacity-60 pb-10">
                        <svg className="w-12 h-12 mb-3 stroke-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <p className="text-sm font-medium">No output yet</p>
                        <p className="text-xs mt-1 text-slate-700">Press Run to execute your code</p>
                    </div>
                )}
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className={`mb-1.5 leading-relaxed break-words font-medium ${log.type === "error" ? "text-red-400 bg-red-900/10 -mx-3 px-3 py-1" : "text-emerald-400"
                            }`}
                    >
                        <span className="mr-3 text-slate-600 font-normal select-none text-[10px]">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                        </span>
                        {log.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
