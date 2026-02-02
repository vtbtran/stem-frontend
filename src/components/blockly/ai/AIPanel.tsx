"use client";

import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

type AIMode = "generate" | "fix" | "explain";

interface AIContext {
    code: string;
    language: "js" | "py" | "cpp";
    selectedCode?: string;
    terminalLogs?: string[];
}

interface AIMessage {
    role: "user" | "assistant";
    content: string;
    codeBlock?: string;
    timestamp: number;
}

interface AIResult {
    text: string;
    codeBlock?: string;
    applied?: boolean;
}

const QUICK_PROMPTS = [
    { label: "Đi thẳng 2s", prompt: "Tạo code cho robot đi thẳng 2 giây" },
    { label: "Rẽ trái 90°", prompt: "Tạo code cho robot rẽ trái 90 độ" },
    { label: "Lặp 3 lần", prompt: "Tạo vòng lặp thực hiện 3 lần" },
    { label: "Dừng lại", prompt: "Tạo code cho robot dừng lại" },
    { label: "Tránh vật cản", prompt: "Tạo code cho robot tránh vật cản" },
];

interface AIContextType {
    code: string;
    language: "js" | "py" | "cpp";
    selectedCode?: string;
    terminalLogs: string[];
}

interface AIContextIndicatorProps {
    context: AIContextType;
}

function AIContextIndicator({ context }: AIContextIndicatorProps) {
    const items: string[] = [];
    if (context.code) items.push("Code");
    if (context.selectedCode) items.push("Selection");
    if (context.terminalLogs?.length) items.push("Logs");

    if (items.length === 0) return null;

    return (
        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>AI đang dùng: {items.join(" + ")}</span>
        </div>
    );
}

interface AICodePreviewProps {
    code: string;
    onApply: () => void;
    onInsert: () => void;
    onCopy: () => void;
    applied: boolean;
}

function AICodePreview({ code, onApply, onInsert, onCopy, applied }: AICodePreviewProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        onCopy();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="rounded-lg bg-[#1E293B] border border-slate-700 overflow-hidden">
            {/* Code Preview Header */}
            <div className="flex items-center justify-between px-3 py-2 bg-[#0F172A] border-b border-slate-700">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Preview</span>
                <div className="flex gap-1">
                    {!applied && (
                        <>
                            <button
                                onClick={onApply}
                                className="px-2 py-1 text-[10px] font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                            >
                                Áp dụng
                            </button>
                            <button
                                onClick={onInsert}
                                className="px-2 py-1 text-[10px] font-bold rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
                            >
                                Chèn
                            </button>
                        </>
                    )}
                    <button
                        onClick={handleCopy}
                        className="px-2 py-1 text-[10px] font-bold rounded bg-slate-700 hover:bg-slate-600 text-slate-300 transition-colors"
                    >
                        {copied ? "Đã sao chép!" : "Sao chép"}
                    </button>
                </div>
            </div>
            {/* Code Content */}
            <pre className="p-3 text-xs font-mono text-slate-300 overflow-x-auto max-h-48">
                <code>{code}</code>
            </pre>
            {applied && (
                <div className="px-3 py-2 bg-emerald-900/30 border-t border-emerald-800/50 text-emerald-400 text-[10px] font-bold flex items-center gap-1.5">
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    Đã áp dụng vào Editor
                </div>
            )}
        </div>
    );
}

interface AIResultType {
    text: string;
    codeBlock?: string;
    applied?: boolean;
}

interface AIPanelProps {
    context: AIContextType;
    onApplyCode?: (code: string) => void;
    onInsertCode?: (code: string) => void;
}

export default function AIPanel({ context, onApplyCode, onInsertCode }: AIPanelProps) {
    const [mode, setMode] = useState<AIMode>("generate");
    const [prompt, setPrompt] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<AIResultType | null>(null);
    const [history, setHistory] = useState<Array<{ prompt: string; result: AIResultType }>>([]);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const resultRef = useRef<HTMLDivElement>(null);

    const placeholders: Record<AIMode, string> = {
        generate: "Mô tả hành vi của xe... VD: Đi thẳng rồi rẽ phải",
        fix: "Nhấn gửi để AI phân tích lỗi từ Terminal",
        explain: "Nhấn gửi để AI giải thích code đang chọn",
    };

    const modeConfig = {
        generate: { icon: "✨", label: "Tạo mới", color: "emerald" },
        fix: { icon: "🔧", label: "Sửa lỗi", color: "amber" },
        explain: { icon: "📖", label: "Giải thích", color: "blue" },
    };

    const handleSubmit = async () => {
        if (isLoading) return;

        setIsLoading(true);
        setResult(null);

        // Simulate AI response (replace with actual API call)
        setTimeout(() => {
            let mockResult: AIResultType;

            if (mode === "generate") {
                mockResult = {
                    text: `Đây là code ${context.language.toUpperCase()} để thực hiện: "${prompt || 'hành động mặc định'}"`,
                    codeBlock: generateMockCode(context.language, prompt),
                };
            } else if (mode === "fix") {
                const hasErrors = context.terminalLogs?.some(log => log.toLowerCase().includes("error"));
                mockResult = {
                    text: hasErrors
                        ? "Tôi đã phân tích lỗi trong Terminal. Đây là cách sửa:"
                        : "Không tìm thấy lỗi nào trong Terminal.",
                    codeBlock: hasErrors ? generateFixCode(context.language) : undefined,
                };
            } else {
                mockResult = {
                    text: context.selectedCode
                        ? `Đoạn code này thực hiện: ${explainCode(context.selectedCode)}`
                        : `Code hiện tại sử dụng ngôn ngữ ${context.language.toUpperCase()}. ${explainCode(context.code)}`,
                };
            }

            setResult(mockResult);
            setHistory(prev => [...prev, { prompt: prompt || `[${modeConfig[mode].label}]`, result: mockResult }]);
            setIsLoading(false);
        }, 1500);
    };

    const handleQuickPrompt = (quickPrompt: string) => {
        setPrompt(quickPrompt);
        setMode("generate");
        inputRef.current?.focus();
    };

    const handleApply = () => {
        if (result?.codeBlock && onApplyCode) {
            onApplyCode(result.codeBlock);
            setResult({ ...result, applied: true });
        }
    };

    const handleInsert = () => {
        if (result?.codeBlock && onInsertCode) {
            onInsertCode(result.codeBlock);
            setResult({ ...result, applied: true });
        }
    };

    const handleCopy = () => {
        if (result?.codeBlock) {
            navigator.clipboard.writeText(result.codeBlock);
        }
    };

    const handleStop = () => {
        setIsLoading(false);
    };

    useEffect(() => {
        if (result && resultRef.current) {
            resultRef.current.scrollTop = resultRef.current.scrollHeight;
        }
    }, [result]);

    return (
        <div className="flex flex-col h-full bg-[#0B0F14] text-slate-200 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between h-10 px-4 bg-[#0B0F14]/30 border-b border-slate-700/50 shrink-0">
                <div className="flex items-center gap-2">
                    <span className="text-lg">🤖</span>
                    <span className="font-bold uppercase tracking-wider text-slate-500 text-[10px]">AI Assistant</span>
                </div>
                <AIContextIndicator context={context} />
            </div>

            {/* Mode Selector */}
            <div className="flex gap-1 p-2 bg-[#0F172A] border-b border-slate-800">
                {(Object.keys(modeConfig) as AIMode[]).map((m) => {
                    const config = modeConfig[m];
                    const isActive = mode === m;
                    return (
                        <button
                            key={m}
                            onClick={() => setMode(m)}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${isActive
                                    ? `bg-${config.color}-600/20 text-${config.color}-400 ring-1 ring-${config.color}-500/50`
                                    : "text-slate-500 hover:text-slate-300 hover:bg-slate-800"
                                }`}
                        >
                            <span>{config.icon}</span>
                            <span>{config.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Quick Prompts (Generate mode only) */}
            <AnimatePresence>
                {mode === "generate" && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-b border-slate-800"
                    >
                        <div className="flex flex-wrap gap-1.5 p-2 bg-[#0F172A]/50">
                            {QUICK_PROMPTS.map((qp, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleQuickPrompt(qp.prompt)}
                                    className="px-2.5 py-1 text-[10px] font-medium rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-200 transition-colors"
                                >
                                    {qp.label}
                                </button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Result Area */}
            <div ref={resultRef} className="flex-1 overflow-y-auto p-3 space-y-3">
                {/* History */}
                {history.map((item, i) => (
                    <div key={i} className="space-y-2 opacity-60">
                        <div className="text-xs text-slate-500">
                            <span className="font-bold">Bạn:</span> {item.prompt}
                        </div>
                        <div className="text-xs text-slate-400 bg-slate-800/50 rounded-lg p-2">
                            {item.result.text}
                        </div>
                    </div>
                ))}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                        <div className="relative w-5 h-5">
                            <div className="absolute inset-0 border-2 border-slate-600 rounded-full" />
                            <div className="absolute inset-0 border-2 border-t-blue-500 rounded-full animate-spin" />
                        </div>
                        <span className="text-sm text-slate-400">AI đang suy nghĩ...</span>
                        <button
                            onClick={handleStop}
                            className="ml-auto px-2 py-1 text-[10px] font-bold rounded bg-red-600/20 text-red-400 hover:bg-red-600/30 transition-colors"
                        >
                            Dừng
                        </button>
                    </div>
                )}

                {/* Current Result */}
                {result && !isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                    >
                        <div className="text-sm text-slate-300 leading-relaxed">
                            {result.text}
                        </div>
                        {result.codeBlock && (
                            <AICodePreview
                                code={result.codeBlock}
                                onApply={handleApply}
                                onInsert={handleInsert}
                                onCopy={handleCopy}
                                applied={!!result.applied}
                            />
                        )}
                    </motion.div>
                )}

                {/* Empty State */}
                {!isLoading && !result && history.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center opacity-50 pb-10">
                        <span className="text-4xl mb-3">🤖</span>
                        <p className="text-sm font-medium text-slate-500">AI Assistant sẵn sàng</p>
                        <p className="text-xs text-slate-600 mt-1">Chọn chế độ và nhập yêu cầu</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#0F172A] border-t border-slate-800">
                <div className="flex gap-2">
                    <textarea
                        ref={inputRef}
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit();
                            }
                        }}
                        placeholder={placeholders[mode]}
                        rows={2}
                        className="flex-1 bg-[#1E293B] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 resize-none focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-all"
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold text-sm rounded-lg transition-all flex items-center gap-1.5"
                    >
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                                </svg>
                                Gửi
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Mock functions for demo
function generateMockCode(language: string, prompt: string): string {
    if (language === "py") {
        return `# ${prompt || "Robot movement"}
import time

def move_forward(speed=150, duration=2):
    """Di chuyển robot tiến về phía trước"""
    robot.set_motor(speed, speed)
    time.sleep(duration)
    robot.stop()

def turn_right(speed=100, duration=0.5):
    """Rẽ phải"""
    robot.set_motor(speed, -speed)
    time.sleep(duration)
    robot.stop()

# Thực thi
move_forward()
turn_right()
`;
    } else if (language === "cpp") {
        return `// ${prompt || "Robot movement"}
#include <Arduino.h>

void moveForward(int speed = 150, int duration = 2000) {
  // Di chuyển robot tiến về phía trước
  setMotor(speed, speed);
  delay(duration);
  stopMotor();
}

void turnRight(int speed = 100, int duration = 500) {
  // Rẽ phải
  setMotor(speed, -speed);
  delay(duration);
  stopMotor();
}

void setup() {
  moveForward();
  turnRight();
}
`;
    }
    return `// ${prompt || "Robot movement"}
async function moveForward(speed = 150, duration = 2) {
  // Di chuyển robot tiến về phía trước
  await robot.move(speed, speed);
  await sleep(duration * 1000);
  await robot.stop();
}

async function turnRight(speed = 100, duration = 0.5) {
  // Rẽ phải
  await robot.move(speed, -speed);
  await sleep(duration * 1000);
  await robot.stop();
}

// Thực thi
await moveForward();
await turnRight();
`;
}

function generateFixCode(language: string): string {
    if (language === "py") {
        return `# Đã sửa lỗi
def fixed_function():
    # Thêm xử lý ngoại lệ
    try:
        robot.move(150, 150)
    except Exception as e:
        print(f"Lỗi: {e}")
        robot.stop()
`;
    }
    return `// Đã sửa lỗi
async function fixedFunction() {
  try {
    await robot.move(150, 150);
  } catch (error) {
    console.error("Lỗi:", error);
    await robot.stop();
  }
}
`;
}

function explainCode(code: string): string {
    if (!code || code.trim().length === 0) {
        return "Chưa có code để giải thích. Vui lòng viết hoặc chọn một đoạn code.";
    }

    if (code.includes("move") || code.includes("motor")) {
        return "Code này điều khiển động cơ của robot để di chuyển. Thường bao gồm các hàm để tiến, lùi và rẽ.";
    }

    if (code.includes("for") || code.includes("while")) {
        return "Code này sử dụng vòng lặp để thực hiện một tác vụ nhiều lần.";
    }

    if (code.includes("if") || code.includes("else")) {
        return "Code này sử dụng điều kiện để quyết định hành động dựa trên trạng thái.";
    }

    return "Code này thực hiện các tác vụ cơ bản của robot. Hãy chọn một phần cụ thể để được giải thích chi tiết hơn.";
}
