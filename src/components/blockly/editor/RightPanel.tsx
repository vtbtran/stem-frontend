"use client";

import { useState } from "react";
import Terminal from "./Terminal";
import { AIPanel } from "../ai";

type TabType = "terminal" | "ai";

interface RightPanelProps {
    code: string;
    language: "js" | "py" | "cpp";
    selectedCode?: string;
    terminalLogs: string[];
    onApplyCode?: (code: string) => void;
    onInsertCode?: (code: string) => void;
    activeTab?: TabType;
    onTabChange?: (tab: TabType) => void;
}

export default function RightPanel({
    code,
    language,
    selectedCode,
    terminalLogs,
    onApplyCode,
    onInsertCode,
    activeTab: externalActiveTab,
    onTabChange,
}: RightPanelProps) {
    const [internalActiveTab, setInternalActiveTab] = useState<TabType>("terminal");

    const activeTab = externalActiveTab ?? internalActiveTab;
    const setActiveTab = (tab: TabType) => {
        setInternalActiveTab(tab);
        onTabChange?.(tab);
    };

    const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
        {
            id: "terminal",
            label: "Terminal",
            icon: (
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
        },
        {
            id: "ai",
            label: "AI",
            icon: <span className="text-sm">🤖</span>,
        },
    ];

    const aiContext = {
        code,
        language,
        selectedCode,
        terminalLogs,
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0F14] overflow-hidden">
            {/* Tab Bar */}
            <div className="flex items-center h-10 bg-[#0B0F14]/30 border-b border-slate-700/50 shrink-0">
                {tabs.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-1.5 px-4 h-full text-[10px] font-bold uppercase tracking-wider transition-all border-b-2 ${isActive
                                ? "text-slate-200 border-blue-500 bg-[#0F172A]/50"
                                : "text-slate-500 border-transparent hover:text-slate-400 hover:bg-slate-800/30"
                                }`}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    );
                })}

                {/* Spacer */}
                <div className="flex-1" />

                {/* AI Badge (when not on AI tab) */}
                {activeTab !== "ai" && (
                    <button
                        onClick={() => setActiveTab("ai")}
                        className="mr-2 px-2 py-1 flex items-center gap-1 text-[10px] font-bold rounded-md bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 transition-all"
                        title="Mở AI Assistant"
                    >
                        <span>🤖</span>
                        <span>AI</span>
                    </button>
                )}
            </div>

            {/* Tab Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
                {activeTab === "terminal" && <Terminal />}
                {activeTab === "ai" && (
                    <AIPanel
                        context={aiContext}
                        onApplyCode={onApplyCode}
                        onInsertCode={onInsertCode}
                    />
                )}
            </div>
        </div>
    );
}
