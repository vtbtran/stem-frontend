"use client";

import { useState, useRef } from "react";
import { FirmwareUploader } from "@/lib/hardware/FirmwareUploader";

type LogEntry = {
    msg: string;
    type: "info" | "success" | "error" | "progress";
};

export default function FirmwareSetupPage() {
    const [isFlashing, setIsFlashing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isDone, setIsDone] = useState(false);
    const [hasError, setHasError] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);

    const addLog = (msg: string, type: LogEntry["type"] = "info") => {
        setLogs((prev) => [...prev, { msg, type }]);
        setTimeout(() => logEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    };

    const handleFlash = async () => {
        if (isFlashing) return;

        // Check browser support
        if (!("serial" in navigator)) {
            addLog("❌ Trình duyệt không hỗ trợ Web Serial API. Hãy dùng Chrome hoặc Edge.", "error");
            return;
        }

        setIsFlashing(true);
        setIsDone(false);
        setHasError(false);
        setProgress(0);
        setLogs([]);

        try {
            await FirmwareUploader.flashBaseFirmware(
                "/firmware/onyx_base.bin",
                (pct) => setProgress(pct),
                (msg) => {
                    const type = msg.includes("❌") || msg.includes("Lỗi")
                        ? "error"
                        : msg.includes("✅") || msg.includes("🎉")
                            ? "success"
                            : msg.includes("Đang")
                                ? "progress"
                                : "info";
                    addLog(msg, type);
                }
            );
            setIsDone(true);
            addLog("🎉 Hoàn tất! Bây giờ hãy kết nối WiFi 'Onyx_Setup' rồi vào 192.168.4.1 để cài đặt WiFi cho Robot.", "success");
        } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            addLog(`❌ ${msg}`, "error");
            setHasError(true);
        } finally {
            setIsFlashing(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-lg">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-violet-600 rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-blue-500/20">
                        <span className="text-4xl">🤖</span>
                    </div>
                    <h1 className="text-3xl font-extrabold text-white tracking-tight">Cài đặt Robot</h1>
                    <p className="text-slate-400 text-sm mt-2 max-w-sm mx-auto">
                        Nạp phần mềm điều khiển cho Robot Onyx trực tiếp từ trình duyệt. Không cần cài đặt phần mềm nào khác.
                    </p>
                </div>

                {/* Steps */}
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-6 mb-6 backdrop-blur-sm">
                    <h2 className="text-white font-bold text-sm mb-4 uppercase tracking-wider">Hướng dẫn</h2>
                    <div className="space-y-3">
                        {[
                            { step: "1", text: "Cắm cáp USB từ Robot vào máy tính", icon: "🔌" },
                            { step: "2", text: "Bấm nút bên dưới và chọn cổng USB", icon: "🖱️" },
                            { step: "3", text: "Chờ nạp phần mềm (~30 giây)", icon: "⏳" },
                            { step: "4", text: "Kết nối WiFi 'Onyx_Setup' để cài WiFi cho Robot", icon: "📶" },
                        ].map((item) => (
                            <div key={item.step} className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-lg flex-shrink-0">
                                    {item.icon}
                                </div>
                                <p className="text-slate-300 text-sm">{item.text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Flash Button */}
                <button
                    onClick={handleFlash}
                    disabled={isFlashing}
                    className={`w-full py-4 rounded-2xl font-bold text-lg transition-all duration-300 shadow-lg ${
                        isFlashing
                            ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                            : isDone
                                ? "bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-emerald-500/20 hover:shadow-emerald-500/40"
                                : hasError
                                    ? "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-red-500/20 hover:shadow-red-500/40"
                                    : "bg-gradient-to-r from-blue-500 to-violet-600 text-white shadow-blue-500/20 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                >
                    {isFlashing ? (
                        <span className="flex items-center justify-center gap-3">
                            <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            Đang nạp firmware... {progress}%
                        </span>
                    ) : isDone ? (
                        "✅ Hoàn tất! Bấm để nạp lại"
                    ) : hasError ? (
                        "🔄 Thử lại"
                    ) : (
                        "⚡ Bắt đầu nạp phần mềm"
                    )}
                </button>

                {/* Progress Bar */}
                {isFlashing && (
                    <div className="mt-3 h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                )}

                {/* Log Console */}
                {logs.length > 0 && (
                    <div className="mt-6 bg-slate-950/80 border border-slate-800 rounded-2xl p-4 max-h-60 overflow-y-auto font-mono text-xs">
                        <div className="flex items-center gap-2 mb-3">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                            <span className="text-slate-500 ml-2 text-[10px] uppercase tracking-wider">Console</span>
                        </div>
                        {logs.map((log, i) => (
                            <div
                                key={i}
                                className={`py-0.5 ${
                                    log.type === "error"
                                        ? "text-red-400"
                                        : log.type === "success"
                                            ? "text-emerald-400"
                                            : log.type === "progress"
                                                ? "text-blue-400"
                                                : "text-slate-400"
                                }`}
                            >
                                {log.msg}
                            </div>
                        ))}
                        <div ref={logEndRef} />
                    </div>
                )}

                {/* Back Link */}
                <div className="text-center mt-6">
                    <a
                        href="/"
                        className="text-slate-500 hover:text-slate-300 text-sm transition-colors"
                    >
                        ← Quay lại OnyxBlock
                    </a>
                </div>
            </div>
        </div>
    );
}
