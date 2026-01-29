"use client";

import React from "react";
import Image from "next/image";
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/msg/vi";
import "blockly/javascript";
import "blockly/python";
import { JavascriptGenerator } from "blockly/javascript";
import { PythonGenerator } from "blockly/python";
import { CppGenerator } from "@/lib/blockly/generators/cpp";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";
import { TOOLBOX_CONFIG, CustomCategory } from "./toolboxConfig";
import { Toolbox } from "./Toolbox";
import { OnyxTheme } from "./BlocklyTheme";
import PromptModal from "../../PromptModal";
import { defineMotionBlocks } from "../blocks/motion";
import { defineControlBlocks } from "../blocks/control";
import { defineSoundBlocks } from "../blocks/sound";
import { defineLooksBlocks } from "../blocks/looks";
import { defineHardwareBlocks } from "../blocks/hardware";

// Initialize custom blocks
defineMotionBlocks();
defineControlBlocks();
defineSoundBlocks();
defineLooksBlocks();
defineHardwareBlocks();

type Props = {
  language: "js" | "py" | "cpp";
  onCode?: (code: string) => void;
  getInitialXml?: () => string;
  onXmlChange?: (xml: string) => void;
  isVisible?: boolean;
};

type FlyoutWithReflow = { reflow?: () => void };

// -------- Flyout no zoom patch (module-scope, safe) --------
let flyoutNoZoomInstalled = false;
type FlyoutProto = { getFlyoutScale?: () => number };

function installFlyoutNoZoomPatch() {
  if (flyoutNoZoomInstalled) return;
  flyoutNoZoomInstalled = true;

  const flyoutProto = (Blockly.Flyout as unknown as { prototype: FlyoutProto }).prototype;
  flyoutProto.getFlyoutScale = () => 1;

  const h = (Blockly as unknown as { HorizontalFlyout?: { prototype: FlyoutProto } }).HorizontalFlyout;
  if (h?.prototype) {
    h.prototype.getFlyoutScale = () => 1;
  }
}

export default function BlocklyWorkspace({ language, onCode, getInitialXml, onXmlChange, isVisible }: Props) {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const workspaceRef = React.useRef<Blockly.WorkspaceSvg | null>(null);
  const [workspaceState, setWorkspaceState] = React.useState<Blockly.WorkspaceSvg | null>(null);

  const languageRef = React.useRef(language);
  const onCodeRef = React.useRef(onCode);
  const onXmlChangeRef = React.useRef(onXmlChange);
  const [activeCategory, setActiveCategory] = React.useState<string>("");




  React.useEffect(() => {
    onCodeRef.current = onCode;
    onXmlChangeRef.current = onXmlChange;
  }, [onCode, onXmlChange]);

  const emitCode = React.useCallback((skipXml = false) => {
    const ws = workspaceRef.current;
    if (!ws) return;

    const currentLang = languageRef.current;
    let generator: JavascriptGenerator | PythonGenerator | CppGenerator;
    if (currentLang === "py") generator = pythonGenerator;
    else if (currentLang === "cpp") generator = cppGenerator;
    else generator = javascriptGenerator;

    try {
      const code = generator.workspaceToCode(ws);
      onCodeRef.current?.(code);
      window.dispatchEvent(new CustomEvent("blockly:code", { detail: { code } }));

      if (!skipXml) {
        const xml = Blockly.Xml.domToText(Blockly.Xml.workspaceToDom(ws));
        onXmlChangeRef.current?.(xml);
      }
    } catch (err) {
      console.error("Blockly generation error:", err);
    }
  }, []);

  React.useEffect(() => {
    languageRef.current = language;
    emitCode();
  }, [language, emitCode]);

  // ---------- Prompt Modal ----------
  const [promptState, setPromptState] = React.useState<{
    isOpen: boolean;
    title: string;
    defaultValue: string;
    callback: ((value: string | null) => void) | null;
  }>({
    isOpen: false,
    title: "",
    defaultValue: "",
    callback: null,
  });

  // ---------- Custom Zoom Controls ----------
  const centeredZoom = React.useCallback((direction: number) => {
    const ws = workspaceRef.current;
    if (!ws) return;
    ws.zoomCenter(direction);
    setTimeout(() => {
      ws.scrollCenter();
    }, 200);
  }, []);

  const zoomIn = React.useCallback(() => {
    centeredZoom(1);
  }, [centeredZoom]);

  const zoomOut = React.useCallback(() => {
    centeredZoom(-1);
  }, [centeredZoom]);

  const zoomReset = React.useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws) return;
    // Force layouts to fix hidden blocks
    setTimeout(() => {
      ws.setScale(1); // Reset zoom
      ws.scrollCenter();
    }, 100);
  }, []);

  React.useEffect(() => {
    // Override Blockly prompt -> use modal
    Blockly.dialog.setPrompt((message, defaultValue, callback) => {
      setPromptState({
        isOpen: true,
        title: message,
        defaultValue,
        callback,
      });
    });

    const host = hostRef.current;
    if (!host) return;

    // Dispose old workspace (StrictMode)
    if (workspaceRef.current) {
      workspaceRef.current.dispose();
      workspaceRef.current = null;
    }

    installFlyoutNoZoomPatch();

    const ws = Blockly.inject(host, {
      toolbox: TOOLBOX_CONFIG as unknown as Blockly.utils.toolbox.ToolboxDefinition,
      toolboxPosition: "start",
      horizontalLayout: false,

      trashcan: true,
      media: "https://unpkg.com/blockly/media/",
      grid: {
        spacing: 25,
        length: 3,
        colour: '#cbd5e1', // Slate-300, light grid
        snap: true,
      },
      zoom: {
        controls: false,
        wheel: true,
        startScale: 1.0,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      theme: OnyxTheme,
      scrollbars: true,
      move: { scrollbars: true, drag: true, wheel: false },
    });

    workspaceRef.current = ws;
    setWorkspaceState(ws);

    // ---------------- helpers ----------------
    const lastToolboxCategoryRef = { current: "0" };

    const ensureToolboxSelected = () => {
      const tb = ws.getToolbox();
      if (!tb) return;

      if (!tb.getSelectedItem()) {
        const itemToSelect = (tb as Blockly.Toolbox).getToolboxItemById(lastToolboxCategoryRef.current);
        if (itemToSelect) {
          (tb as Blockly.Toolbox).setSelectedItem(itemToSelect);
        } else {
          tb.selectItemByPosition(0);
        }
      } else {
        const selected = tb.getSelectedItem();
        if (selected) lastToolboxCategoryRef.current = selected.getId();
      }
    };





    const reflowFlyout = () => {
      const tb = ws.getToolbox?.();
      const flyoutUnknown = tb?.getFlyout?.() as unknown;
      if (flyoutUnknown && typeof flyoutUnknown === "object") {
        (flyoutUnknown as FlyoutWithReflow).reflow?.();
      }
    };

    // Dynamic Icon CSS Injection
    const styleId = 'blockly-toolbox-icons';
    let styleTag = document.getElementById(styleId) as HTMLStyleElement;
    if (!styleTag) {
      styleTag = document.createElement('style');
      styleTag.id = styleId;
      document.head.appendChild(styleTag);
    }

    const categories = TOOLBOX_CONFIG.contents.filter((c): c is CustomCategory => c.kind === 'category' && 'imageUrl' in c) as CustomCategory[];
    const cssRules = categories.map(c => `
      .blocklyTreeIcon.${c.cssConfig?.icon} { 
        display: inline-block !important;
        width: 24px !important;
        height: 24px !important;
        background-image: url("${c.imageUrl}") !important;
        background-size: 20px 20px !important;
        background-repeat: no-repeat !important;
        background-position: center center !important;
      }
      .blocklyTreeIcon.${c.cssConfig?.icon}::before {
        display: none !important;
        content: none !important;
      }
    `).join('\n');
    styleTag.textContent = cssRules;

    // Initial setup
    ws.clear();

    // Load initial XML if provided (Persistence)
    const initialXml = getInitialXml?.();
    if (initialXml) {
      try {
        const dom = Blockly.utils.xml.textToDom(initialXml);
        Blockly.Xml.domToWorkspace(dom, ws);
      } catch (e) {
        console.error("Failed to load initial XML", e);
      }
    }

    ensureToolboxSelected();
    emitCode();
    reflowFlyout();

    const resize = () => {
      Blockly.svgResize(ws);
      reflowFlyout();
    };

    resize();
    requestAnimationFrame(resize);
    setTimeout(resize, 50);

    // Auto-reset zoom and center on load
    setTimeout(() => {
      ws.setScale(1);
      ws.scrollCenter();
    }, 200);

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);

    const onChange = () => {
      ensureToolboxSelected();
      emitCode();
    };
    ws.addChangeListener(onChange);

    const onViewport = (e: Blockly.Events.Abstract) => {
      if (e.type === Blockly.Events.VIEWPORT_CHANGE) reflowFlyout();
    };
    ws.addChangeListener(onViewport);

    // -------- Click to Run (Scratch-like) --------
    const onClick = (e: Blockly.Events.Abstract) => {
      if (e.type === Blockly.Events.CLICK) {
        const clickEvent = e as unknown as { blockId?: string; targetType?: string };
        if (clickEvent.blockId) {
          const block = ws.getBlockById(clickEvent.blockId);
          if (block && block.type === 'event_start') {
            // Click-to-Run: ALWAYS use JavaScript simulation regardless of view mode
            const generator = javascriptGenerator;

            // Unlock AudioContext on interaction
            import("@/lib/audio/SimpleSynth").then(({ synth }) => synth.init());

            generator.init(ws);
            const code = generator.blockToCode(block) as string;

            window.dispatchEvent(new CustomEvent("blockly:run_stack", {
              detail: {
                code,
                language: 'js',
                forceLanguage: true
              }
            }));
          }
        }
      }
    };
    ws.addChangeListener(onClick);

    // -------- Handle Run Request (Force JS Simulation) --------
    const onRequestRun = () => {
      try {
        // Verify workspace matches host? No need, this component owns the workspace.
        javascriptGenerator.init(ws);
        const code = javascriptGenerator.workspaceToCode(ws);

        // Dispatch Run event with forced JS code
        window.dispatchEvent(new CustomEvent("blockly:run", {
          detail: {
            code: code,
            language: "js",
            forceLanguage: true
          }
        }));
      } catch (e) {
        console.error("Failed to generate simulation code", e);
      }
    };
    window.addEventListener("blockly:request_run", onRequestRun);

    return () => {
      window.removeEventListener("blockly:request_run", onRequestRun);
      Blockly.dialog.setPrompt(window.prompt);
      ro.disconnect();
      ws.dispose();
      workspaceRef.current = null;
    };
  }, [getInitialXml, emitCode]);

  // Handle visibility changes (Auto-reset when returning to tab)
  React.useEffect(() => {
    if (isVisible) {
      const ws = workspaceRef.current;
      if (ws) {
        // Small delay to ensure layout is ready
        setTimeout(() => {
          ws.setScale(1);
          ws.scrollCenter();
        }, 50);
      }
    }
  }, [isVisible]);

  const handlePromptConfirm = (value: string) => {
    promptState.callback?.(value);
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  };

  const handlePromptCancel = () => {
    promptState.callback?.(null);
    setPromptState((prev) => ({ ...prev, isOpen: false }));
  };

  return (
    <div className="flex h-full w-full overflow-hidden relative">
      <Toolbox
        workspace={workspaceState}
        activeCategory={activeCategory}
        onCategoryClick={setActiveCategory}
      />

      <div className="flex-1 relative h-full w-full overflow-hidden">
        <div ref={hostRef} className="blockly-host h-full w-full overflow-hidden bg-white" />

        <div
          className="absolute right-4 bottom-28 z-10 flex flex-col gap-2"
          style={{
            isolation: "isolate",
          }}
        >

          {/* Reset */}
          <button
            type="button"
            onClick={zoomReset}
            className="h-10 w-10 rounded-xl bg-white text-slate-600 border border-slate-200
            shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200
            active:scale-[0.98] transition grid place-items-center group"
            title="Reset"
          >
            <div
              className="w-5 h-5 bg-current transition-colors"
              style={{
                maskImage: 'url("/icons/position.png")',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url("/icons/position.png")',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center'
              }}
            />
          </button>


          {/* Zoom in */}
          <button
            type="button"
            onClick={zoomIn}
            className="h-10 w-10 rounded-xl bg-white text-slate-600 border border-slate-200
             shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200
             active:scale-[0.98] transition grid place-items-center group"
            title="Zoom in"
          >
            <div
              className="w-5 h-5 bg-current transition-colors"
              style={{
                maskImage: 'url("/icons/zoom-in.png")',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url("/icons/zoom-in.png")',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center'
              }}
            />
          </button>

          {/* Zoom out */}
          <button
            type="button"
            onClick={zoomOut}
            className="h-10 w-10 rounded-xl bg-white text-slate-600 border border-slate-200
             shadow-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200
             active:scale-[0.98] transition grid place-items-center group"
            title="Zoom out"
          >
            <div
              className="w-5 h-5 bg-current transition-colors"
              style={{
                maskImage: 'url("/icons/magnifying-glass.png")',
                maskSize: 'contain',
                maskRepeat: 'no-repeat',
                maskPosition: 'center',
                WebkitMaskImage: 'url("/icons/magnifying-glass.png")',
                WebkitMaskSize: 'contain',
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'center'
              }}
            />
          </button>

        </div>


        {promptState.isOpen && (
          <PromptModal
            key={`${promptState.title}-${promptState.defaultValue}`}
            isOpen={promptState.isOpen}
            title={promptState.title}
            defaultValue={promptState.defaultValue}
            onConfirm={handlePromptConfirm}
            onCancel={handlePromptCancel}
          />
        )}
      </div>
    </div>
  );
}
