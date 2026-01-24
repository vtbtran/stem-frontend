"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useRef } from "react";
import CodePanel from "./CodePanel";
import Terminal from "./Terminal";
import Stage from "./Stage";
import RunnerIframe from "./RunnerIframe";
import { motion, useDragControls } from "framer-motion";
import { synth } from "@/lib/audio/SimpleSynth";

const BlocklyWorkspace = dynamic(() => import("./BlocklyWorkspace"), { ssr: false });

export default function BlocklyEditor() {
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<"js" | "py">("js");
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [simState, setSimState] = useState<{ w: number; h: number }>({
    w: 256, // mặc định w-64
    h: 192, // mặc định h-48
  });
  const [isMounted, setIsMounted] = useState(false);
  // const dragControls = useDragControls();
  const simElementRef = useRef<HTMLDivElement>(null);
  const activeAreaRef = useRef<HTMLDivElement>(null);


  const getSimBoundaries = useCallback(() => {
    if (typeof window === 'undefined') return { maxWidth: 1000, maxHeight: 800 };
    const container = simElementRef.current?.parentElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      return {
        maxWidth: Math.max(160, rect.width - 64), 
        maxHeight: Math.max(120, rect.height - 112) 
      };
    }
    return { maxWidth: window.innerWidth - 64, maxHeight: window.innerHeight - 112 };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsMounted(true);
      const saved = localStorage.getItem("sim-pos");
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          const { maxWidth, maxHeight } = getSimBoundaries();
          setSimState({
            w: Math.min(maxWidth, parsed.w || 256),
            h: Math.min(maxHeight, parsed.h || 192)
          });
        } catch (e) { }
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [getSimBoundaries]);

  useEffect(() => {
    const handleResize = () => {
      const { maxWidth, maxHeight } = getSimBoundaries();
      setSimState(prev => {
        if (prev.w > maxWidth || prev.h > maxHeight) {
          return {
            w: Math.min(maxWidth, prev.w),
            h: Math.min(maxHeight, prev.h)
          };
        }
        return prev;
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [getSimBoundaries]);

  const xmlRef = useRef<string>("");
  const latestCodeRef = useRef(code);
  useEffect(() => {
    latestCodeRef.current = code;
  }, [code]);

  const getCode = useCallback(() => latestCodeRef.current, []);

  useEffect(() => {
    const onCode = (e: Event) => {
      const ce = e as CustomEvent<{ code: string }>;
      setCode(ce.detail.code ?? "");
    };

    const onSound = (e: Event) => {
      const ce = e as CustomEvent<{ action: string; value?: { freq: number; dur: number } }>;
      const { action, value } = ce.detail;
      if (action === "beep") synth.beep();
      if (action === "tone" && value) synth.playTone(value.freq, value.dur);
    };

    window.addEventListener("blockly:code", onCode);
    window.addEventListener("blockly:stage_sound", onSound);
    
    return () => {
        window.removeEventListener("blockly:code", onCode);
        window.removeEventListener("blockly:stage_sound", onSound);
    };
  }, []);

  const onRun = useCallback(() => {
    if (!showPanel) setShowPanel(true);
    window.dispatchEvent(new CustomEvent("blockly:run"));
  }, [showPanel]);

  const saveSimSize = () => {
    if (simElementRef.current) {
      const rect = simElementRef.current.getBoundingClientRect();
      const newState = { w: rect.width, h: rect.height };
      setSimState(newState);
      localStorage.setItem("sim-pos", JSON.stringify(newState));
    }
  };

  return (
    <div className="h-full w-full overflow-hidden bg-white relative">
      <div className="h-full w-full transition-all duration-300">
        <RunnerIframe language={language} getCode={getCode} />

        {/* STAGE OVERLAY (Draggable with Framer Motion) */}
        <motion.div
          className="absolute z-50 rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden bg-slate-900 group"
          initial={false}
          style={{
            right: '32px',
            top: '80px',
            width: `${simState.w}px`,
            height: `${simState.h}px`,
            opacity: isMounted && !showPanel ? 1 : 0,
            pointerEvents: isMounted && !showPanel ? "auto" : "none",
            minWidth: '160px',
            minHeight: '120px',
          }}
          ref={simElementRef}
        >
          {/* Custom Resize Handles */}
          {/* Bottom Right */}
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-nwse-resize z-20 group/handle"
            onPointerDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const startW = simState.w;
              const startH = simState.h;

              // Lấy kích thước container để giới hạn
              const { maxWidth, maxHeight } = getSimBoundaries();

              const onPointerMove = (moveEvent: PointerEvent) => {
                const newW = Math.min(maxWidth, Math.max(160, startW + (moveEvent.clientX - startX)));
                const newH = Math.min(maxHeight, Math.max(120, startH + (moveEvent.clientY - startY)));
                setSimState({ w: newW, h: newH });
              };

              const onPointerUp = () => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                saveSimSize();
              };

              window.addEventListener('pointermove', onPointerMove);
              window.addEventListener('pointerup', onPointerUp);
            }}
          >
            <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-white/30 group-hover/handle:border-white/60 transition-colors" />
          </div>

          {/* Bottom Left */}
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-nesw-resize z-20 group/handle"
            onPointerDown={(e) => {
              const startX = e.clientX;
              const startY = e.clientY;
              const startW = simState.w;
              const startH = simState.h;

              // Lấy kích thước container để giới hạn
              const { maxWidth, maxHeight } = getSimBoundaries();

              const onPointerMove = (moveEvent: PointerEvent) => {
                // Khi tăng width về bên trái, vì element fixed right: 32px, nên việc tăng width sẽ làm nó phình sang bên trái
                const newW = Math.min(maxWidth, Math.max(160, startW - (moveEvent.clientX - startX)));
                const newH = Math.min(maxHeight, Math.max(120, startH + (moveEvent.clientY - startY)));
                setSimState({ w: newW, h: newH });
              };

              const onPointerUp = () => {
                window.removeEventListener('pointermove', onPointerMove);
                window.removeEventListener('pointerup', onPointerUp);
                saveSimSize();
              };

              window.addEventListener('pointermove', onPointerMove);
              window.addEventListener('pointerup', onPointerUp);
            }}
          >
            <div className="absolute bottom-1 left-1 w-2 h-2 border-l-2 border-b-2 border-white/30 group-hover/handle:border-white/60 transition-colors" />
          </div>

          {/* Draggable Header */}
          <div
            className="absolute top-0 left-0 right-0 h-7 bg-white/10 backdrop-blur-md flex items-center justify-between px-2 text-[9px] font-bold text-white/70 uppercase tracking-widest z-10 select-none"
          >
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Live Simulator</span>
            </div>
            <div className="text-[14px] leading-none opacity-50">⋮⋮</div>
          </div>
          <div className="w-full h-full pt-7">
            <Stage />
          </div>
        </motion.div>

        <div className={`h-full w-full ${showPanel ? "hidden" : "flex flex-col"} animate-in fade-in duration-300`}>
          {/* DESIGN MODE */}
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex h-9 items-center justify-between border-b px-3 text-sm font-semibold text-zinc-700 bg-white shadow-sm z-20">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>Workspace</span>
              </div>
              <button
                onClick={() => setShowPanel(true)}
                className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-zinc-900 text-white border-zinc-800 hover:bg-black hover:shadow-md transition-all duration-300 shadow-sm"
              >
                View Code
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
            </div>
            <div className="min-h-0 flex-1" ref={!showPanel ? activeAreaRef : null}>
              <BlocklyWorkspace
                language={language}
                onCode={setCode}
                getInitialXml={() => xmlRef.current}
                onXmlChange={(xml) => { xmlRef.current = xml; }}
                isVisible={!showPanel}
              />
            </div>
          </div>
        </div>

        <div className={`flex h-full w-full flex-col overflow-hidden bg-zinc-950 transition-all duration-300 ${!showPanel ? "hidden" : "animate-in slide-in-from-right"}`}>
          {/* CODE MODE */}
          <div className="flex h-9 items-center justify-between px-3 border-b border-white/10 bg-zinc-900 shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPanel(false)}
                className="flex items-center gap-2 px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-full bg-white/5 text-zinc-400 border border-white/10 hover:bg-white/10 hover:text-white transition-all duration-300"
              >
                ← Back
              </button>
              <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">Source & Console</span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-[9px] font-bold text-zinc-600 uppercase">Lang</span>
                <select
                  className="rounded-md border border-white/10 px-2 py-0.5 text-[10px] font-bold outline-none bg-zinc-800 text-zinc-300 hover:border-zinc-500 transition-colors"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as "js" | "py")}
                >
                  <option value="js">JS</option>
                  <option value="py">Python</option>
                </select>
              </div>

              <button
                onClick={onRun}
                className="flex items-center gap-1.5 rounded-md px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all duration-300 group"
              >
                Run
                <span className="group-hover:translate-x-0.5 transition-transform duration-300">▶</span>
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-row min-h-0" ref={showPanel ? activeAreaRef : null}>
            <div className="flex-1 border-r border-white/10 overflow-hidden relative bg-[#1e1e1e]/50">
              <CodePanel code={code} />
            </div>
            <div className="w-[350px] min-h-0 overflow-hidden bg-[#1e1e1e]">
              <Terminal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
