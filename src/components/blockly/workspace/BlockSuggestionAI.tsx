"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/vi";
import { aiExplainWorkspace, aiExplainAndFixWorkspace, aiFixWorkspace, aiGenerateBlocksWithAllowlist, aiGetChallenge } from "@/lib/ai/api";
import { TOOLBOX_CONFIG } from "./toolboxConfig";
import { OnyxTheme } from "./BlocklyTheme";
import { defineMotionBlocks } from "../blocks/motion";
import { defineControlBlocks } from "../blocks/control";
import { defineSoundBlocks } from "../blocks/sound";
import { defineLooksBlocks } from "../blocks/looks";
import { defineHardwareBlocks } from "../blocks/hardware";

// Ensure custom blocks are registered for the preview workspace
defineMotionBlocks();
defineControlBlocks();
defineSoundBlocks();
defineLooksBlocks();
defineHardwareBlocks();

function safeClone<T>(value: T): T {
    // Prefer structuredClone when available (modern browsers)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sc = (globalThis as any).structuredClone;
    if (typeof sc === "function") return sc(value);
    return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Blockly serialization loader sẽ ném lỗi nếu gặp input VALUE "rỗng" kiểu:
 *   inputs: { SOME_VALUE: {} }
 * hoặc inputs: { SOME_VALUE: null }
 * => sanitize để preview/apply không bị crash.
 */
function sanitizeBlocklySerialization(workspace: unknown): unknown {
    const root = safeClone(workspace);

    const visit = (node: unknown) => {
        if (!node || typeof node !== "object") return;
        if (Array.isArray(node)) {
            node.forEach(visit);
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const obj: any = node;

        // Fix common malformed inputs (empty connection objects)
        if (obj.inputs && typeof obj.inputs === "object" && !Array.isArray(obj.inputs)) {
            for (const [k, v] of Object.entries(obj.inputs)) {
                if (v == null || typeof v !== "object") {
                    delete obj.inputs[k];
                    continue;
                }
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const iv: any = v;
                const hasConn = Object.prototype.hasOwnProperty.call(iv, "block") || Object.prototype.hasOwnProperty.call(iv, "shadow");
                const connEmpty =
                    (!hasConn) ||
                    ((iv.block == null || iv.block === false) && (iv.shadow == null || iv.shadow === false));
                if (connEmpty) delete obj.inputs[k];
            }
        }

        // Fix specific blocks
        if (obj.type === "control_wait") {
            obj.fields = obj.fields && typeof obj.fields === "object" ? obj.fields : {};
            if (obj.fields.DURATION == null || obj.fields.DURATION === "") {
                obj.fields.DURATION = 1;
            }
            // In case AI mistakenly put DURATION under inputs
            if (obj.inputs && typeof obj.inputs === "object") {
                delete obj.inputs.DURATION;
            }
        }

        // Recurse
        for (const val of Object.values(obj)) visit(val);
    };

    visit(root);
    return root;
}

interface BlockSuggestionAIProps {
    isOpen: boolean;
    onClose: () => void;
}

type AIMode = "generate" | "fix" | "explain" | "explainFix" | "challenge";

type ChatMessage = {
    id: string;
    role: "user" | "ai";
    content: string;
    timestamp: number;
    mode?: AIMode;
};

export default function BlockSuggestionAI({ isOpen, onClose }: BlockSuggestionAIProps) {
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);
    const [workspaceJson, setWorkspaceJson] = useState<unknown>(null);
    const [aiMessage, setAiMessage] = useState<string>("");
    const [mode, setMode] = useState<AIMode>("generate");
    const [previewWorkspace, setPreviewWorkspace] = useState<{ workspace: unknown; source: string; explanation?: string } | null>(null);
    const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    const allowedBlockTypes = useMemo(() => {
        const types: string[] = [];
        const visit = (node: unknown) => {
            if (!node || typeof node !== "object") return;
            if (Array.isArray(node)) return node.forEach(visit);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const n: any = node;
            if (n.kind === "block" && typeof n.type === "string") types.push(n.type);
            if (n.contents) visit(n.contents);
            if (n.inputs) visit(n.inputs);
            if (n.block) visit(n.block);
            if (n.shadow) visit(n.shadow);
        };
        visit((TOOLBOX_CONFIG as unknown as { contents: unknown }).contents);
        return [...new Set(types)];
    }, []);

    const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

    // Scroll chat to bottom
    const scrollToBottom = () => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    };

    // Auto scroll khi có tin nhắn mới
    useEffect(() => {
        scrollToBottom();
    }, [chatHistory]);

    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text) return;

        // Thêm tin nhắn user vào lịch sử ngay lập tức
        const userMsg: ChatMessage = {
            id: generateId(),
            role: "user",
            content: text,
            timestamp: Date.now(),
            mode
        };
        setChatHistory(prev => [...prev, userMsg]);
        setIsThinking(true);
        setAiMessage("");

        try {
            let aiContent = "";

            if (mode === "challenge") {
                const res = await aiGetChallenge();
                aiContent = res.text;
            } else if (mode === "generate") {
                const res = await aiGenerateBlocksWithAllowlist(text, allowedBlockTypes);
                const payload = {
                    workspace: sanitizeBlocklySerialization(res.blocklyJson),
                    source: "ai-generate",
                    preview: true
                };
                setPreviewWorkspace(payload);
                window.dispatchEvent(new CustomEvent("blockly:workspace_load", {
                    detail: { workspace: payload.workspace, isPreview: true, source: "ai-generate" }
                }));
                window.dispatchEvent(new CustomEvent("blockly:review", { detail: payload }));
                aiContent = "✅ AI đã tạo khối. Xem ngay trên workspace! Dùng Review panel để Accept/Reject hoặc Undo/Redo.";
            } else if (mode === "fix") {
                if (!workspaceJson) aiContent = "Chưa lấy được workspace. Hãy kéo vài khối vào rồi thử lại.";
                else {
                    const res = await aiFixWorkspace(workspaceJson, allowedBlockTypes, text);
                    const payload = {
                        workspace: sanitizeBlocklySerialization(res.blocklyJson),
                        source: "ai-fix",
                        preview: true
                    };
                    setPreviewWorkspace(payload);
                    window.dispatchEvent(new CustomEvent("blockly:workspace_load", {
                        detail: { workspace: payload.workspace, isPreview: true, source: "ai-fix" }
                    }));
                    window.dispatchEvent(new CustomEvent("blockly:review", { detail: payload }));
                    aiContent = "🛠️ AI đã sửa khối. Xem ngay trên workspace! Dùng Review panel để Accept/Reject hoặc Undo/Redo.";
                }
            } else if (mode === "explain") {
                if (!workspaceJson) aiContent = "Chưa lấy được workspace. Hãy kéo vài khối vào rồi thử lại.";
                else {
                    const res = await aiExplainWorkspace(workspaceJson);
                    aiContent = res.text;
                }
            } else {
                // explainFix
                if (!workspaceJson) aiContent = "Chưa lấy được workspace. Hãy kéo vài khối vào rồi thử lại.";
                else {
                    const res = await aiExplainAndFixWorkspace(workspaceJson, allowedBlockTypes, text);
                    const payload = {
                        workspace: sanitizeBlocklySerialization(res.blocklyJson),
                        source: "ai-explain-fix",
                        explanation: res.explanation,
                        preview: true
                    };
                    setPreviewWorkspace(payload);
                    window.dispatchEvent(new CustomEvent("blockly:workspace_load", {
                        detail: { workspace: payload.workspace, isPreview: true, source: "ai-explain-fix" }
                    }));
                    window.dispatchEvent(new CustomEvent("blockly:review", { detail: payload }));
                    aiContent = res.explanation + "\n\n✅ AI đã sửa khối. Xem ngay trên workspace! Dùng Review panel để Accept/Reject hoặc Undo/Redo.";
                }
            }

            setAiMessage(aiContent);

            // Thêm tin nhắn AI vào lịch sử
            const aiMsg: ChatMessage = {
                id: generateId(),
                role: "ai",
                content: aiContent,
                timestamp: Date.now(),
                mode
            };
            setChatHistory(prev => [...prev, aiMsg]);

        } catch (e: unknown) {
            const msg = e instanceof Error ? e.message : String(e);
            const errorContent = `Có lỗi khi gọi AI: ${msg}`;
            setAiMessage(errorContent);

            // Thêm tin nhắn lỗi vào lịch sử
            const errorMsg: ChatMessage = {
                id: generateId(),
                role: "ai",
                content: errorContent,
                timestamp: Date.now(),
                mode
            };
            setChatHistory(prev => [...prev, errorMsg]);
        } finally {
            setInputValue("");
            setIsThinking(false);
        }
    };

    // previewWorkspace is still stored so the modal can show a lightweight status,
    // but the actual visual preview/review is now handled by WorkspaceReviewPanel.

    useEffect(() => {
        const onWs = (e: Event) => {
            const ce = e as CustomEvent<{ workspace: unknown }>;
            setWorkspaceJson(ce.detail?.workspace ?? null);
        };
        window.addEventListener("blockly:workspace", onWs as EventListener);
        return () => window.removeEventListener("blockly:workspace", onWs as EventListener);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[150]"
                        onClick={onClose}
                    />

                    {/* Panel - đảm bảo hiển thị đầy đủ không bị cắt */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -20 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="fixed inset-4 md:inset-8 lg:inset-12 flex flex-col bg-white rounded-2xl shadow-[0_40px_140px_rgba(0,0,0,0.30)] border border-slate-200 overflow-hidden z-[151]"
                    >
                        {/* Top Bar */}
                        <div className="px-6 py-4 bg-white border-b border-slate-100">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-50 to-violet-50 border border-slate-200 flex items-center justify-center text-xl shadow-sm shrink-0">
                                        🤖
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-extrabold text-slate-900 text-base leading-none tracking-tight">AI Trợ lý</h3>
                                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                                                Beta
                                            </span>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1 font-medium truncate">
                                            Tạo khối • Fix khối • Giải thích • Giao bài tập
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {chatHistory.length > 0 && (
                                        <button
                                            onClick={() => setChatHistory([])}
                                            className="h-9 px-3 rounded-xl hover:bg-red-50 text-slate-500 hover:text-red-600 transition-colors text-xs font-medium"
                                            title="Xóa lịch sử chat"
                                        >
                                            🗑️ Xóa chat
                                        </button>
                                    )}
                                    <button
                                        onClick={onClose}
                                        className="w-9 h-9 rounded-xl hover:bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-700 transition-colors border border-transparent hover:border-slate-200"
                                        title="Đóng"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Mode selector */}
                            <div className="mt-3 flex gap-2">
                                {[
                                    { id: "generate", label: "Tạo khối", icon: "✨" },
                                    { id: "fix", label: "Fix", icon: "🔧" },
                                    { id: "explain", label: "Giải thích", icon: "📖" },
                                    { id: "explainFix", label: "Giải thích + Sửa", icon: "🧠" },
                                    { id: "challenge", label: "Bài tập", icon: "🎯" },
                                ].map((m) => {
                                    const active = mode === (m.id as AIMode);
                                    return (
                                        <button
                                            key={m.id}
                                            onClick={() => setMode(m.id as AIMode)}
                                            className={`h-9 px-3 rounded-xl text-xs font-bold transition-all border ${active
                                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                                : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                                }`}
                                        >
                                            <span className="mr-1.5">{m.icon}</span>
                                            {m.label}
                                        </button>
                                    );
                                })}
                                <div className="flex-1" />
                                <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-500">
                                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full border ${workspaceJson ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-slate-50 border-slate-200"}`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${workspaceJson ? "bg-emerald-500" : "bg-slate-400"}`} />
                                        Workspace: {workspaceJson ? "OK" : "chưa có"}
                                    </span>
                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-50 border border-slate-200">
                                        Allowed blocks: <span className="font-semibold text-slate-700">{allowedBlockTypes.length}</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 min-h-0 bg-white">
                            {/* Chat / Output - Full Width */}
                            <div className="h-full flex flex-col">
                                <div
                                    ref={chatContainerRef}
                                    className="flex-1 min-h-0 p-5 overflow-y-auto space-y-4"
                                >
                                    {chatHistory.length === 0 ? (
                                        // Welcome message khi chưa có chat
                                        <div className="h-full flex flex-col items-center justify-center text-center p-8">
                                            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-50 to-violet-50 border border-slate-200 flex items-center justify-center text-4xl shadow-sm mb-4">
                                                🤖
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800 mb-2">AI Trợ lý Lập trình</h4>
                                            <p className="text-sm text-slate-500 max-w-md">
                                                Chọn chế độ ở trên, nhập yêu cầu và bấm Gửi.
                                                AI sẽ giúp bạn tạo khối, sửa lỗi, giải thích code hoặc giao bài tập.
                                            </p>
                                            <div className="flex flex-wrap gap-2 mt-6 justify-center">
                                                {["Tạo chương trình in ra 1-10", "Sửa lỗi vòng lặp vô hạn", "Giải thích code này", "Cho bài tập về if-else"].map((suggestion, i) => (
                                                    <button
                                                        key={i}
                                                        onClick={() => {
                                                            setInputValue(suggestion);
                                                            // Focus textarea
                                                            const textarea = document.querySelector('textarea');
                                                            textarea?.focus();
                                                        }}
                                                        className="px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-full transition-colors"
                                                    >
                                                        {suggestion}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        // Chat history
                                        chatHistory.map((msg) => (
                                            <div
                                                key={msg.id}
                                                className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                                            >
                                                {/* Avatar */}
                                                <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center text-lg border shadow-sm ${msg.role === "user"
                                                        ? "bg-slate-800 border-slate-700 text-white"
                                                        : "bg-white border-slate-200"
                                                    }`}>
                                                    {msg.role === "user" ? "👤" : "🤖"}
                                                </div>

                                                {/* Message bubble */}
                                                <div className={`max-w-[75%] ${msg.role === "user" ? "text-right" : ""}`}>
                                                    <div className={`inline-block rounded-2xl px-4 py-3 text-sm whitespace-pre-wrap leading-relaxed ${msg.role === "user"
                                                            ? "bg-slate-800 text-white text-left"
                                                            : "bg-slate-100 text-slate-800 text-left border border-slate-200"
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                    <p className="text-[10px] text-slate-400 mt-1">
                                                        {new Date(msg.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
                                                        {msg.role === "user" && msg.mode && (
                                                            <span className="ml-2 opacity-60">
                                                                {msg.mode === "generate" && "✨ Tạo khối"}
                                                                {msg.mode === "fix" && "🔧 Fix"}
                                                                {msg.mode === "explain" && "📖 Giải thích"}
                                                                {msg.mode === "explainFix" && "🧠 Giải thích + Sửa"}
                                                                {msg.mode === "challenge" && "🎯 Bài tập"}
                                                            </span>
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        ))
                                    )}

                                    {/* Typing indicator */}
                                    {isThinking && (
                                        <div className="flex gap-3">
                                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-lg shadow-sm">
                                                🤖
                                            </div>
                                            <div className="bg-slate-100 border border-slate-200 rounded-2xl px-4 py-3">
                                                <div className="flex gap-1">
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Input */}
                                <div className="p-4 border-t border-slate-100 bg-white">
                                    <div className="flex items-end gap-3">
                                        <div className="flex-1">
                                            <textarea
                                                value={inputValue}
                                                onChange={(e) => setInputValue(e.target.value)}
                                                placeholder={
                                                    mode === "generate" ? "Ví dụ: đi thẳng 2s rồi rẽ phải" :
                                                        mode === "fix" ? "Ví dụ: chương trình chạy mãi, hãy dừng sau 3 lần" :
                                                            mode === "explain" ? "Ví dụ: giải thích chương trình hiện tại" :
                                                                mode === "explainFix" ? "Ví dụ: giải thích và sửa để robot đi hình vuông" :
                                                                    "Ví dụ: cho em một bài tập về vòng lặp"
                                                }
                                                rows={2}
                                                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 transition-all"
                                                onKeyDown={(e) => {
                                                    if (e.key === "Enter" && !e.shiftKey) {
                                                        e.preventDefault();
                                                        if (!isThinking) handleSend();
                                                    }
                                                }}
                                                disabled={isThinking}
                                            />
                                            <p className="mt-2 text-[11px] text-slate-400">
                                                Enter để gửi • Shift+Enter xuống dòng
                                            </p>
                                        </div>
                                        <button
                                            onClick={handleSend}
                                            disabled={!inputValue.trim() || isThinking}
                                            className="h-11 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed text-white text-sm font-extrabold transition-all shadow-sm"
                                        >
                                            {isThinking ? "Đang nghĩ..." : "Gửi"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
