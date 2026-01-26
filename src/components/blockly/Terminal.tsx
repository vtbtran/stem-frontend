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

    if (!mounted) return <div className="h-full bg-[#1e1e1e]" />;

    return (
        <div className="flex h-full flex-col bg-[#1e1e1e] font-mono text-[11px] text-white overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-2 py-1 bg-[#252526] shrink-0">
                <span className="font-bold uppercase tracking-wider text-zinc-500">Terminal</span>
                <button
                    onClick={() => setLogs([])}
                    className="text-zinc-500 hover:text-white transition-colors text-[10px]"
                >
                    Clear
                </button>
            </div>

            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 shadow-inner
                    [&::-webkit-scrollbar]:w-2
                    [&::-webkit-scrollbar-track]:bg-transparent
                    [&::-webkit-scrollbar-thumb]:bg-zinc-800
                    [&::-webkit-scrollbar-thumb]:rounded-full
                    hover:[&::-webkit-scrollbar-thumb]:bg-zinc-700"
            >
                {logs.length === 0 && (
                    <div className="text-zinc-600 italic">No output yet. Press Run to see results...</div>
                )}
                {logs.map((log, i) => (
                    <div
                        key={i}
                        className={`mb-1 whitespace-pre-wrap ${log.type === "error" ? "text-red-400" : "text-emerald-400"
                            }`}
                    >
                        <span className="mr-2 text-zinc-600 opacity-50">[{new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}]</span>
                        {log.message}
                    </div>
                ))}
            </div>
        </div>
    );
}
