"use client";

import React from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import "blockly/javascript";
import "blockly/python";
import { JavascriptGenerator } from "blockly/javascript";
import { PythonGenerator } from "blockly/python";
import { CppGenerator } from "@/lib/blockly/generators/cpp";
import { javascriptGenerator, pythonGenerator, cppGenerator } from "@/lib/blockly/generators";
import { TOOLBOX_XML } from "./toolbox";
import PromptModal from "../PromptModal";
import { defineMotionBlocks } from "./blocks/motion";
import { defineControlBlocks } from "./blocks/control";
import { defineSoundBlocks } from "./blocks/sound";
import { defineLooksBlocks } from "./blocks/looks";
import { defineHardwareBlocks } from "./blocks/hardware";

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

  const languageRef = React.useRef(language);
  const onCodeRef = React.useRef(onCode);
  const onXmlChangeRef = React.useRef(onXmlChange);




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
      toolbox: TOOLBOX_XML,
      toolboxPosition: "start",
      horizontalLayout: false,

      trashcan: true,
      media: "https://unpkg.com/blockly/media/",
      zoom: {
        controls: false,
        wheel: true,
        startScale: 1,
        maxScale: 2.5,
        minScale: 0.5,
        scaleSpeed: 1.2,
      },
      scrollbars: true,
      move: { scrollbars: true, drag: true, wheel: false },
    });

    workspaceRef.current = ws;

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

    const getViewRectInWorkspace = () => {
      const m = ws.getMetrics?.();
      if (!m) return null;
      return {
        left: m.viewLeft,
        top: m.viewTop,
        right: m.viewLeft + m.viewWidth,
        bottom: m.viewTop + m.viewHeight,
      };
    };

    const getBlockCenterInWorkspace = (block: Blockly.BlockSvg) => {
      const xy = block.getRelativeToSurfaceXY();
      let w = block.width ?? 0;
      let h = block.height ?? 0;

      if ((!w || !h) && block.getSvgRoot()) {
        try {
          const bbox = (block.getSvgRoot() as SVGGElement).getBBox();
          w = bbox.width;
          h = bbox.height;
        } catch {
          // ignore
        }
      }

      return { cx: xy.x + w / 2, cy: xy.y + h / 2 };
    };

    const deleteIfDroppedOutside = (blockId: string) => {
      const block = ws.getBlockById(blockId) as Blockly.BlockSvg | null;
      if (!block) return;

      // only delete top-level when dropped outside workspace (avoid nuking attached stacks)
      if (block.getParent()) return;

      const rect = getViewRectInWorkspace();
      if (!rect) return;

      const { cx, cy } = getBlockCenterInWorkspace(block);
      const inside = cx >= rect.left && cx <= rect.right && cy >= rect.top && cy <= rect.bottom;

      if (!inside) {
        block.dispose(true);
        emitCode();
      }
    };



    const reflowFlyout = () => {
      const tb = ws.getToolbox?.();
      const flyoutUnknown = tb?.getFlyout?.() as unknown;
      if (flyoutUnknown && typeof flyoutUnknown === "object") {
        (flyoutUnknown as FlyoutWithReflow).reflow?.();
      }
    };

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
            const currentLang = languageRef.current;
            let generator: JavascriptGenerator | PythonGenerator | CppGenerator;
            if (currentLang === "py") generator = pythonGenerator;
            else if (currentLang === "cpp") generator = cppGenerator;
            else generator = javascriptGenerator;

            // Unlock AudioContext on interaction
            import("@/lib/audio/SimpleSynth").then(({ synth }) => synth.init());

            generator.init(ws);
            const code = generator.blockToCode(block) as string;
            // console.log("DEBUG: Clicked block, generated code:", code);
            // console.log("DEBUG: Current language:", currentLang);
            window.dispatchEvent(new CustomEvent("blockly:run_stack", { detail: { code } }));
          }
        }
      }
    };
    ws.addChangeListener(onClick);

    return () => {
      Blockly.dialog.setPrompt(window.prompt);
      ro.disconnect();
      ws.dispose();
      workspaceRef.current = null;
    };
  }, [emitCode]);

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
    <div className="relative h-full w-full">
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
          className="h-11 w-11 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200
            shadow-[0_10px_25px_rgba(37,99,235,0.15)]
            hover:bg-blue-100 hover:shadow-[0_14px_30px_rgba(37,99,235,0.2)]
            active:scale-[0.98] transition grid place-items-center"
          title="Reset"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="2" />
            <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            <path d="M12 2v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M12 18v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M2 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M18 12h4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>


        {/* Zoom in */}
        <button
          type="button"
          onClick={zoomIn}
          className="h-11 w-11 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200
               shadow-[0_10px_25px_rgba(5,150,105,0.15)]
               hover:bg-emerald-100 hover:shadow-[0_14px_30px_rgba(5,150,105,0.2)]
               active:scale-[0.98] transition grid place-items-center"
          title="Zoom in"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </button>

        {/* Zoom out */}
        <button
          type="button"
          onClick={zoomOut}
          className="h-11 w-11 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200
               shadow-[0_10px_25px_rgba(217,119,6,0.15)]
               hover:bg-amber-100 hover:shadow-[0_14px_30px_rgba(217,119,6,0.2)]
               active:scale-[0.98] transition grid place-items-center"
          title="Zoom out"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
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
  );
}
