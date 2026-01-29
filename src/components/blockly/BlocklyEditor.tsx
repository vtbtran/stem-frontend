"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useRef } from "react";
import { CodePanel, RightPanel } from "./editor";
import { Stage, RunnerIframe } from "./simulation";
import { HardwareConnect, CameraWindow } from "./hardware";
import { motion } from "framer-motion";
import { synth } from "@/lib/audio/SimpleSynth";
import { BlocklyCodeEvent, BlocklyStageSoundEvent } from "@/types/events";

const BlocklyWorkspace = dynamic(() => import("./workspace/BlocklyWorkspace"), { ssr: false });
import { RobotController } from "@/lib/hardware/RobotController";

export default function BlocklyEditor() {
  const [code, setCode] = useState<string>("");
  const [language, setLanguage] = useState<"js" | "py" | "cpp">("py");
  const [showPanel, setShowPanel] = useState<boolean>(false);
  const [showCamera, setShowCamera] = useState<boolean>(false);
  const [simState, setSimState] = useState<{ w: number; h: number }>({
    w: 256,
    h: 192,
  });
  const [isMounted, setIsMounted] = useState(false);
  const [isStageMinimized, setIsStageMinimized] = useState(false);
  const [terminalLogs, setTerminalLogs] = useState<string[]>([]);
  const [rightPanelTab, setRightPanelTab] = useState<"terminal" | "ai">("terminal");
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
        } catch (e) {
          console.error("Failed to load saved sim size:", e);
        }
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

    const onCode = (e: BlocklyCodeEvent) => {
      const ce = e;
      setCode(ce.detail.code ?? "");
    };

    const onSound = (e: BlocklyStageSoundEvent) => {
      const ce = e;
      const { action, value } = ce.detail;
      // console.log("BlocklyEditor: Received sound event", action, value);
      if (action === "beep") {
        synth.beep();
        RobotController.getInstance().sendCommand({ type: "sound", action: "beep" });
      }
      if (action === "tone" && value) {
        synth.playTone(value.freq, value.dur);
        RobotController.getInstance().sendCommand({ type: "sound", action: "tone", value });
      }
    };

    const onMotion = (e: CustomEvent) => {
      const detail = e.detail;
      if (detail.type === "MOTION_MOVE") {
        RobotController.getInstance().sendCommand({ type: "motion", action: "move", value: detail.value });
      } else if (detail.type === "MOTION_TURN") {
        RobotController.getInstance().sendCommand({ type: "motion", action: "turn", value: detail.value });
      }
    };

    const onLook = (e: CustomEvent) => {
      const detail = e.detail;
      if (detail.action === "on" || detail.action === "off") {
        RobotController.getInstance().sendCommand({ type: "look", action: detail.action });
      }
    };

    const onServo = (e: CustomEvent) => {
      const detail = e.detail;
      RobotController.getInstance().sendCommand({ type: "servo", action: "set", value: detail.value });
    };

    // Capture terminal logs for AI context
    const onTerminalLog = (e: Event) => {
      const ce = e as CustomEvent<{ args: unknown[] }>;
      const message = ce.detail.args.map(arg =>
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(" ");
      setTerminalLogs(prev => [...prev.slice(-50), message]); // Keep last 50 logs
    };

    const onTerminalError = (e: Event) => {
      const ce = e as CustomEvent<{ error: string }>;
      setTerminalLogs(prev => [...prev.slice(-50), `[ERROR] ${ce.detail.error}`]);
    };

    window.addEventListener("blockly:code", onCode);
    window.addEventListener("blockly:stage_sound", onSound);
    window.addEventListener("blockly:stage_motion", onMotion as EventListener);
    window.addEventListener("blockly:stage_look", onLook as EventListener);
    window.addEventListener("blockly:stage_servo", onServo as EventListener);
    window.addEventListener("blockly:log", onTerminalLog);
    window.addEventListener("blockly:error", onTerminalError);

    return () => {
      window.removeEventListener("blockly:code", onCode);
      window.removeEventListener("blockly:stage_sound", onSound);
      window.removeEventListener("blockly:stage_motion", onMotion as EventListener);
      window.removeEventListener("blockly:stage_look", onLook as EventListener);
      window.removeEventListener("blockly:stage_servo", onServo as EventListener);
      window.removeEventListener("blockly:log", onTerminalLog);
      window.removeEventListener("blockly:error", onTerminalError);
    };
  }, []);

  const onRun = useCallback(() => {
    synth.init();
    if (!showPanel) setShowPanel(true);
    // Request BlocklyWorkspace to generate latest code (as JS) and run it
    window.dispatchEvent(new CustomEvent("blockly:request_run"));
  }, [showPanel]);

  const getInitialXml = useCallback(() => xmlRef.current, []);
  const handleXmlChange = useCallback((xml: string) => { xmlRef.current = xml; }, []);

  const saveSimSize = () => {
    if (simElementRef.current) {
      // ... existing saveSimSize content ...
      const rect = simElementRef.current.getBoundingClientRect();
      const newState = { w: rect.width, h: rect.height };
      setSimState(newState);
      localStorage.setItem("sim-pos", JSON.stringify(newState));
    }
  };

  return (

    <div className="h-full w-full overflow-hidden bg-[#FFF7ED] relative font-sans text-[#1F2937] selection:bg-blue-100 selection:text-blue-900">
      <div className="h-full w-full flex flex-col">
        <RunnerIframe language={language} getCode={getCode} />

        {showCamera && <CameraWindow onClose={() => setShowCamera(false)} />}

        {/* STAGE DOCK (Fixed Top-Right) */}
        <div
          ref={simElementRef}
          className={`absolute z-40 rounded-xl shadow-2xl ring-1 ring-zinc-900/10 overflow-hidden bg-zinc-900 transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1)
            ${isMounted && !showPanel ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-8 pointer-events-none'}
          `}
          style={{
            top: '80px',
            right: '16px',
            width: isStageMinimized ? '180px' : '320px',
            height: isStageMinimized ? '36px' : '240px',
          }}
        >
          {/* Header */}
          <div
            className="h-9 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 select-none cursor-pointer hover:bg-white/10 transition-colors"
            onClick={() => setIsStageMinimized(!isStageMinimized)}
            title={isStageMinimized ? "Click to expand" : "Click to minimize"}
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Robot Live</span>
            </div>
            <div className="flex gap-1 opacity-50">
              {isStageMinimized ? (
                <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" /></svg>
              ) : (
                <div className="flex gap-1">
                  <div className="w-1 h-1 rounded-full bg-zinc-600" />
                  <div className="w-1 h-1 rounded-full bg-zinc-600" />
                </div>
              )}
            </div>
          </div>

          <div className={`w-full bg-black relative transition-all duration-300 ${isStageMinimized ? 'opacity-0 h-0' : 'opacity-100 h-[calc(100%-36px)]'}`}>
            <Stage />
          </div>
        </div>

        <div className={`flex-1 w-full ${showPanel ? "hidden" : "flex flex-col"} animate-in fade-in duration-300 relative`}>
          {/* DESIGN MODE HEADER */}
          <div className="h-14 flex items-center justify-between px-6 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 z-[60] sticky top-0 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-baseline leading-none select-none">
                  <span className="text-4xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-zinc-300 via-zinc-500 to-zinc-400 drop-shadow-sm mr-0.5">Onyx</span>
                  <span className="text-2xl font-black italic text-zinc-900 tracking-tight">Block</span>
                </div>
              </div>

            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowCamera(!showCamera)}
                className={`h-9 px-3 rounded-lg font-medium text-sm flex items-center gap-2 transition-all duration-200 ${showCamera ? 'bg-red-50 text-red-600 ring-1 ring-red-200' : 'bg-white text-zinc-600 hover:bg-zinc-50 ring-1 ring-zinc-200 shadow-sm'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5l4.72-4.72a.75.75 0 011.28.53v11.38a.75.75 0 01-1.28.53l-4.72-4.72M4.5 18.75h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25h-9A2.25 2.25 0 002.25 7.5v9a2.25 2.25 0 002.25 2.25z" />
                </svg>
                <span>Camera</span>
              </button>

              <HardwareConnect />

              <div className="h-4 w-[1px] bg-zinc-200 mx-1" />


              <button
                onClick={() => setShowPanel(true)}
                className="h-9 pl-3 pr-4 rounded-lg bg-white text-zinc-600 font-bold text-sm flex items-center gap-2 border border-zinc-200 shadow-sm hover:bg-zinc-50 hover:text-zinc-900 hover:border-zinc-300 active:scale-[0.98] transition-all duration-200 group"
              >
                <span>Code</span>
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 relative" ref={!showPanel ? activeAreaRef : null}>
            <BlocklyWorkspace
              language={language}
              onCode={setCode}
              getInitialXml={getInitialXml}
              onXmlChange={handleXmlChange}
              isVisible={!showPanel}
            />
          </div>
        </div>

        <div className={`flex flex-col h-full w-full bg-[#0B0F14] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${!showPanel ? "translate-x-full absolute inset-0 pointer-events-none" : "translate-x-0 relative"}`}>
          {/* CODE MODE HEADER */}
          <div className="h-16 flex items-center justify-between px-6 bg-[#111827] border-b border-slate-800 shrink-0 shadow-sm z-20">
            {/* LEFT: Back + Title */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0F172A] text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700/50 transition-all"
                title="Back to Block Editor"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-slate-100 leading-tight">Code Editor</span>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Ready</span>
                </div>
              </div>
            </div>

            {/* CENTER: Tab Control */}
            <div className="flex bg-[#0F172A] p-1 rounded-xl border border-slate-800/80 shadow-inner">
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-[#1F2937] text-slate-200 shadow-sm ring-1 ring-white/5 transition-all">
                Editor
              </button>
              <button className="px-4 py-1.5 text-xs font-bold rounded-lg text-slate-500 hover:text-slate-300 transition-all">
                Source View
              </button>
            </div>

            {/* RIGHT: Actions */}
            <div className="flex items-center gap-3">
              {/* Language Selector */}
              <div className="flex bg-[#0F172A] p-1 rounded-lg border border-slate-800/80">
                {(['js', 'py', 'cpp'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${language === lang ? 'bg-[#1F2937] text-white shadow-sm ring-1 ring-white/5' : 'text-slate-500 hover:text-slate-300'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="h-6 w-[1px] bg-slate-800 mx-1" />

              {/* Upload Button (CPP only) */}
              {language === 'cpp' && (
                <button
                  onClick={async () => {
                    const { RobotController } = await import("@/lib/hardware/RobotController");
                    const { WebSerialTransport } = await import("@/lib/hardware/WebSerialTransport");
                    const { FirmwareUploader } = await import("@/lib/hardware/FirmwareUploader");

                    const controller = RobotController.getInstance();
                    const transport = controller.getTransport();
                    let port: SerialPort | null = null;

                    if (transport instanceof WebSerialTransport) {
                      port = transport.getPort();
                    }

                    if (!port) {
                      try {
                        port = await navigator.serial.requestPort();
                        await port.open({ baudRate: 115200 });
                      } catch (e) {
                        alert("Please connect a device first.");
                        return;
                      }
                    }

                    if (port) {
                      if (controller.isConnected) await controller.disconnect();
                      const term = {
                        writeln: (msg: string) => window.dispatchEvent(new CustomEvent("blockly:upload_log", { detail: { args: [msg] } })),
                        writeLine: (msg: string) => window.dispatchEvent(new CustomEvent("blockly:upload_log", { detail: { args: [msg] } })),
                        write: (msg: string) => window.dispatchEvent(new CustomEvent("blockly:upload_log", { detail: { args: [msg] } })),
                        clean: () => { }
                      };
                      const uploader = new FirmwareUploader(port, term);
                      const hex = await uploader.compileCode(code);
                      if (hex) await uploader.flashFirmware(hex);
                    }
                  }}
                  className="h-10 px-5 rounded-xl bg-transparent border border-orange-500/30 text-orange-500 hover:bg-orange-500/10 text-xs font-bold uppercase tracking-wider active:scale-95 transition-all flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  <span>Upload</span>
                </button>
              )}

              {/* AI BUTTON */}
              <button
                onClick={() => setRightPanelTab("ai")}
                className={`h-10 px-4 rounded-xl text-xs font-bold uppercase tracking-wider active:scale-[0.98] transition-all flex items-center gap-2 ${rightPanelTab === "ai"
                    ? "bg-blue-600/20 text-blue-400 ring-1 ring-blue-500/50"
                    : "bg-transparent border border-slate-600 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                  }`}
              >
                <span>🤖</span>
                <span>AI</span>
              </button>

              {/* RUN BUTTON */}
              <button
                onClick={onRun}
                className="h-10 pl-4 pr-5 rounded-xl bg-[#22C55E] hover:bg-[#16A34A] text-[#052E16] text-xs font-extrabold uppercase tracking-wider shadow-[0_4px_12px_rgba(34,197,94,0.2)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.3)] active:scale-[0.98] transition-all flex items-center gap-2"
              >
                <div className="w-5 h-5 rounded-full bg-[#052E16]/10 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 fill-current ml-0.5" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                </div>
                Run
              </button>
            </div>
          </div>

          {/* MAIN CONTENT SPLIT */}
          <div className="flex flex-1 min-h-0 p-5 gap-5 overflow-hidden" ref={showPanel ? activeAreaRef : null}>
            {/* EDITOR CARD (70%) */}
            <div className="flex-[7] bg-[#0F172A] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden flex flex-col relative ring-1 ring-white/5">
              <CodePanel code={code} onChange={setCode} />
            </div>

            {/* RIGHT PANEL (30%) - Terminal + AI */}
            <div className="flex-[3] bg-[#0F172A] rounded-2xl border border-slate-800/60 shadow-xl overflow-hidden flex flex-col ring-1 ring-white/5">
              <RightPanel
                code={code}
                language={language}
                terminalLogs={terminalLogs}
                activeTab={rightPanelTab}
                onTabChange={setRightPanelTab}
                onApplyCode={(newCode) => setCode(newCode)}
                onInsertCode={(insertCode) => setCode(prev => prev + "\n" + insertCode)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

