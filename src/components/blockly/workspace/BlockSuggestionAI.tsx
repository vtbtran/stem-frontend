"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface BlockSuggestion {
    id: string;
    label: string;
    description: string;
    blockType: string;
    icon: string;
}

interface BlockSuggestionAIProps {
    isOpen: boolean;
    onClose: () => void;
    onAddBlock?: (blockType: string) => void;
    currentBlocks?: string[];
}

// Pre-defined suggestions based on context
const SUGGESTIONS: Record<string, BlockSuggestion[]> = {
    empty: [
        { id: "start", label: "Bắt đầu", description: "Khối bắt đầu chương trình", blockType: "event_start", icon: "🚀" },
        { id: "forever", label: "Lặp lại mãi", description: "Lặp các hành động liên tục", blockType: "control_forever", icon: "🔄" },
    ],
    hasStart: [
        { id: "forward", label: "Đi tới", description: "Di chuyển xe về phía trước", blockType: "motion_forward", icon: "⬆️" },
        { id: "backward", label: "Đi lùi", description: "Di chuyển xe về phía sau", blockType: "motion_backward", icon: "⬇️" },
        { id: "left", label: "Xoay trái", description: "Xoay xe sang trái", blockType: "motion_left", icon: "↩️" },
        { id: "right", label: "Xoay phải", description: "Xoay xe sang phải", blockType: "motion_right", icon: "↪️" },
        { id: "forever", label: "Lặp lại mãi", description: "Lặp các hành động liên tục", blockType: "control_forever", icon: "🔄" },
        { id: "wait", label: "Đợi", description: "Dừng một khoảng thời gian", blockType: "control_wait", icon: "⏱️" },
    ],
    hasForever: [
        { id: "forward", label: "Đi tới", description: "Di chuyển xe về phía trước", blockType: "motion_forward", icon: "⬆️" },
        { id: "backward", label: "Đi lùi", description: "Di chuyển xe về phía sau", blockType: "motion_backward", icon: "⬇️" },
        { id: "left", label: "Xoay trái", description: "Xoay xe sang trái", blockType: "motion_left", icon: "↩️" },
        { id: "right", label: "Xoay phải", description: "Xoay xe sang phải", blockType: "motion_right", icon: "↪️" },
        { id: "stop", label: "Dừng lại", description: "Dừng xe ngay lập tức", blockType: "control_stop", icon: "🛑" },
        { id: "wait", label: "Đợi", description: "Dừng một khoảng thời gian", blockType: "control_wait", icon: "⏱️" },
    ],
};

const QUICK_ACTIONS = [
    { id: "patrol", label: "Tuần tra", steps: ["Đi thẳng 2s", "Xoay phải 90°", "Lặp lại"], icon: "🚔" },
    { id: "dance", label: "Nhảy múa", steps: ["Xoay trái", "Xoay phải", "Lặp lại"], icon: "💃" },
    { id: "square", label: "Đi vuông", steps: ["Đi thẳng", "Xoay 90°", "x4 lần"], icon: "⬜" },
];

export default function BlockSuggestionAI({ isOpen, onClose, onAddBlock, currentBlocks = [] }: BlockSuggestionAIProps) {
    const [suggestions, setSuggestions] = useState<BlockSuggestion[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isThinking, setIsThinking] = useState(false);

    const handleSend = () => {
        if (!inputValue.trim()) return;
        setIsThinking(true);
        // Mock sending to AI
        setTimeout(() => {
             console.log("AI Input:", inputValue);
             setInputValue("");
             setIsThinking(false);
        }, 1000);
    };

    // Determine context and update suggestions
    useEffect(() => {
        if (currentBlocks.includes("control_forever")) {
            setSuggestions(SUGGESTIONS.hasForever);
        } else if (currentBlocks.includes("event_start")) {
            setSuggestions(SUGGESTIONS.hasStart);
        } else {
            setSuggestions(SUGGESTIONS.empty);
        }
    }, [currentBlocks]);

    const handleAddBlock = (blockType: string) => {
        onAddBlock?.(blockType);
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[100]"
                        onClick={onClose}
                    />

                    {/* Panel */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: -10 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                        className="fixed top-24 left-1/2 -translate-x-1/2 w-[480px] max-h-[600px] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-[101]"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-xl shadow-sm">
                                    🤖
                                </div>
                                <div className="flex flex-col">
                                    <h3 className="font-semibold text-slate-800 text-base leading-none">AI Trợ lý</h3>
                                    <p className="text-xs text-slate-500 mt-1 font-medium">Gợi ý khối thông minh cho bạn</p>
                                </div>
                            </div>
                            <button
                                onClick={onClose}
                                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Content Scrollable */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            
                            {/* Tips - Toned down */}
                            <div className="bg-amber-50/60 border border-amber-100 rounded-xl p-3 flex items-start gap-3">
                                <span className="text-lg mt-0.5">💡</span>
                                <div>
                                    <p className="text-sm font-semibold text-amber-800">Mẹo nhỏ</p>
                                    <p className="text-xs text-amber-700/80 mt-0.5 leading-relaxed">
                                        Dùng khối <strong>Lặp lại mãi</strong> để robot chạy liên tục. Nếu không có, robot sẽ chỉ chạy lệnh một lần rồi dừng!
                                    </p>
                                </div>
                            </div>

                            {/* Quick Actions - Pills/Chips */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Hành động nhanh</p>
                                <div className="flex flex-wrap gap-2">
                                    {QUICK_ACTIONS.map((action) => (
                                        <button
                                            key={action.id}
                                            className="h-9 px-4 rounded-full bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 text-slate-600 hover:text-blue-600 text-sm font-medium transition-all flex items-center gap-2 hover:shadow-sm"
                                            title={action.steps.join(" → ")}
                                        >
                                            <span className="text-base">{action.icon}</span>
                                            <span>{action.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Suggested Blocks - Cards with CTA */}
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Gợi ý phù hợp</p>
                                <div className="grid grid-cols-1 gap-3">
                                    {suggestions.map((suggestion) => (
                                        <div
                                            key={suggestion.id}
                                            className="group flex items-center justify-between p-3 rounded-xl border border-slate-200 hover:border-blue-300 hover:bg-blue-50/30 hover:shadow-sm transition-all bg-white"
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-xl group-hover:scale-110 transition-transform">
                                                    {suggestion.icon}
                                                </div>
                                                <div>
                                                    <h4 className="font-semibold text-slate-700 text-sm group-hover:text-blue-700">{suggestion.label}</h4>
                                                    <p className="text-xs text-slate-500 line-clamp-1">{suggestion.description}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleAddBlock(suggestion.blockType)}
                                                className="w-8 h-8 rounded-lg bg-white border border-slate-200 text-slate-400 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 flex items-center justify-center transition-all shadow-sm"
                                                title="Thêm vào canvas"
                                            >
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                                </svg>
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Input Area - Chat style */}
                        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Bạn muốn robot làm gì..."
                                    className="w-full h-11 pl-4 pr-12 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 text-sm text-slate-800 placeholder:text-slate-400 bg-white transition-all shadow-sm"
                                    onKeyDown={(e) => e.key === "Enter" && !isThinking && handleSend()}
                                    disabled={isThinking}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={!inputValue.trim() || isThinking}
                                    className="absolute right-1 top-1 bottom-1 w-9 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-sm active:scale-95"
                                >
                                    {isThinking ? (
                                        <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
