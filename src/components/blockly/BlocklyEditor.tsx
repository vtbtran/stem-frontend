"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState, useRef } from "react";
import CodePanel from "./CodePanel";
import Terminal from "./Terminal";
import Stage from "./Stage";
import RunnerIframe from "./RunnerIframe";
import HardwareConnect from "./HardwareConnect";
import { motion } from "framer-motion";
import { synth } from "@/lib/audio/SimpleSynth";
import { BlocklyCodeEvent, BlocklyStageSoundEvent } from "@/types/events";

const BlocklyWorkspace = dynamic(() => import("./BlocklyWorkspace"), { ssr: false });
import { RobotController } from "@/lib/hardware/RobotController";
import CameraWindow from "./CameraWindow";

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

    window.addEventListener("blockly:code", onCode);
    window.addEventListener("blockly:stage_sound", onSound);
    window.addEventListener("blockly:stage_motion", onMotion as EventListener);
    window.addEventListener("blockly:stage_look", onLook as EventListener);
    window.addEventListener("blockly:stage_servo", onServo as EventListener);

    return () => {
      window.removeEventListener("blockly:code", onCode);
      window.removeEventListener("blockly:stage_sound", onSound);
      window.removeEventListener("blockly:stage_motion", onMotion as EventListener);
      window.removeEventListener("blockly:stage_look", onLook as EventListener);
      window.removeEventListener("blockly:stage_servo", onServo as EventListener);
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

        {/* STAGE OVERLAY (Draggable) */}
        <motion.div
          className="absolute z-50 rounded-2xl shadow-2xl ring-1 ring-white/10 overflow-hidden bg-zinc-900/95 backdrop-blur-md group"
          initial={false}
          style={{
            right: '32px',
            top: '88px', // Lowered slightly
            width: `${simState.w}px`,
            height: `${simState.h}px`,
            opacity: isMounted && !showPanel ? 1 : 0,
            pointerEvents: isMounted && !showPanel ? "auto" : "none",
            minWidth: '200px',
            minHeight: '160px',
          }}
          ref={simElementRef}
        >
          {/* ... Resize Handles ... */}
          {/* Bottom Right */}
          <div
            className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 group/handle"
            onPointerDown={(e) => {
              const startX = e.clientX; const startY = e.clientY; const startW = simState.w; const startH = simState.h;
              const { maxWidth, maxHeight } = getSimBoundaries();
              const onPointerMove = (moveEvent: PointerEvent) => {
                setSimState({
                  w: Math.min(maxWidth, Math.max(160, startW + (moveEvent.clientX - startX))),
                  h: Math.min(maxHeight, Math.max(120, startH + (moveEvent.clientY - startY)))
                });
              };
              const onPointerUp = () => { window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); saveSimSize(); };
              window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp);
            }}
          >
            <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/20 group-hover/handle:bg-emerald-400 transition-colors" />
          </div>

          {/* Bottom Left */}
          <div
            className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-20 group/handle"
            onPointerDown={(e) => {
              const startX = e.clientX; const startY = e.clientY; const startW = simState.w; const startH = simState.h;
              const { maxWidth, maxHeight } = getSimBoundaries();
              const onPointerMove = (moveEvent: PointerEvent) => {
                setSimState({
                  w: Math.min(maxWidth, Math.max(160, startW - (moveEvent.clientX - startX))),
                  h: Math.min(maxHeight, Math.max(120, startH + (moveEvent.clientY - startY)))
                });
              };
              const onPointerUp = () => { window.removeEventListener('pointermove', onPointerMove); window.removeEventListener('pointerup', onPointerUp); saveSimSize(); };
              window.addEventListener('pointermove', onPointerMove); window.addEventListener('pointerup', onPointerUp);
            }}
          >
            <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/20 group-hover/handle:bg-emerald-400 transition-colors" />
          </div>

          {/* Draggable Header */}
          <div
            className="absolute top-0 left-0 right-0 h-9 bg-white/5 border-b border-white/5 flex items-center justify-between px-3 text-[10px] font-bold text-zinc-400 uppercase tracking-widest z-10 select-none cursor-grab active:cursor-grabbing"
          >
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
              <span>Rotbot Live</span>
            </div>
            <div className="flex gap-1.5 text-zinc-600">
              <div className="w-1 h-1 rounded-full bg-current" />
              <div className="w-1 h-1 rounded-full bg-current" />
              <div className="w-1 h-1 rounded-full bg-current" />
            </div>
          </div>
          <div className="w-full h-full pt-9 pb-1 bg-zinc-900/50">
            <Stage />
          </div>
        </motion.div>

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
                className="h-9 pl-3 pr-4 rounded-lg bg-zinc-900 text-white font-medium text-sm flex items-center gap-2 hover:bg-zinc-800 hover:shadow-lg hover:shadow-zinc-900/20 active:scale-[0.98] transition-all duration-200 group"
              >
                <span>Code</span>
                <svg className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
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

        <div className={`flex flex-col h-full w-full bg-[#0d0d0d] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${!showPanel ? "translate-x-full absolute inset-0 pointer-events-none" : "translate-x-0 relative"}`}>
          {/* CODE MODE */}
          <div className="h-14 flex items-center justify-between px-6 border-b border-white/5 bg-[#0d0d0d] shrink-0">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowPanel(false)}
                className="h-8 px-3 rounded-lg bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white text-xs font-semibold uppercase tracking-wider flex items-center gap-2 transition-all"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Editor
              </button>
              <div className="px-2 py-0.5 rounded border border-white/10 text-[10px] font-mono text-zinc-500">
                SOURCE VIEW
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex bg-white/5 p-1 rounded-lg">
                {(['js', 'py', 'cpp'] as const).map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={`px-3 py-1 text-[10px] font-bold uppercase rounded-md transition-all ${language === lang ? 'bg-blue-600 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-300'}`}
                  >
                    {lang}
                  </button>
                ))}
              </div>

              <div className="h-4 w-[1px] bg-white/10 mx-1" />

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
                        // Request port if not connected
                        port = await navigator.serial.requestPort();
                        await port.open({ baudRate: 115200 });
                      } catch (e) {
                        alert("Please connect/select a COM port first.");
                        console.error("Failed to get serial port:", e);
                        return;
                      }
                    }

                    if (port) {
                      if (controller.isConnected) {
                        await controller.disconnect();
                      }
                      const term = {
                        writeln: (msg: string) => {
                          console.log(msg);
                          window.dispatchEvent(new CustomEvent("blockly:log", { detail: { args: [msg] } }));
                        },
                        writeLine: (msg: string) => {
                          console.log(msg);
                          window.dispatchEvent(new CustomEvent("blockly:log", { detail: { args: [msg] } }));
                        },
                        write: (msg: string) => {
                          console.log(msg);
                          window.dispatchEvent(new CustomEvent("blockly:log", { detail: { args: [msg] } }));
                        },
                        clean: () => {
                        }
                      };

                      const uploader = new FirmwareUploader(port, term);
                      const hex = await uploader.compileCode(code);
                      if (hex) {
                        await uploader.flashFirmware(hex);
                      }
                    }
                  }}
                  className="h-8 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-orange-500/20 active:scale-95 transition-all flex items-center gap-2"
                >
                  Upload
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                </button>
              )}

              <button
                onClick={onRun}
                className="h-8 px-4 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2 group"
              >
                Run
                <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
              </button>
            </div>
          </div>

          <div className="flex flex-1 flex-row min-h-0" ref={showPanel ? activeAreaRef : null}>
            <div className="flex-1 border-r border-white/5 overflow-hidden relative bg-[#1e1e1e]/50 backdrop-blur-sm">
              <CodePanel code={code} onChange={setCode} />
            </div>
            <div className="w-[400px] min-h-0 overflow-hidden bg-[#0d0d0d] shadow-2xl">
              <Terminal />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

