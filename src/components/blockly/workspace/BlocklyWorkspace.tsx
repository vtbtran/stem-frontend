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
import { Multiselect } from '@mit-app-inventor/blockly-plugin-workspace-multiselect';
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
  flyoutProto.getFlyoutScale = () => 0.85;

  const h = (Blockly as unknown as { HorizontalFlyout?: { prototype: FlyoutProto } }).HorizontalFlyout;
  if (h?.prototype) {
    h.prototype.getFlyoutScale = () => 0.85;
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

      // Also emit workspace JSON snapshot for AI features (generate/fix/explain/apply)
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const workspaceJson = (Blockly as any).serialization?.workspaces?.save?.(ws);
        if (workspaceJson) {
          window.dispatchEvent(new CustomEvent("blockly:workspace", { detail: { workspace: workspaceJson } }));
        }
      } catch (e) {
        console.warn("Failed to serialize workspace for AI:", e);
      }

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
      renderer: "zelos",
      grid: {
        spacing: 25,
        length: 3,
        colour: '#cbd5e1', // Slate-300, light grid
        snap: true,
      },
      zoom: {
        controls: false,
        wheel: true,
        startScale: 0.85,
        maxScale: 3,
        minScale: 0.3,
        scaleSpeed: 1.2,
      },
      theme: OnyxTheme,
      scrollbars: true,
      move: { scrollbars: true, drag: true, wheel: false },
    });

    // Legacy buggy BLOCK_CREATE listener removed

    // -------------------------------------------------------------
    // Initialize workspace and multiselect
    // -------------------------------------------------------------
    workspaceRef.current = ws;
    setWorkspaceState(ws);

    // Initialize Multiselect plugin
    const multiselectPlugin = new Multiselect(ws);
    multiselectPlugin.init({
      multiselectIcon: {
        hideIcon: true, // We don't necessarily need the onscreen toggle icon if using Shift
      },
    });

    // Prevent flyout from auto-closing when blocks are dragged out
    const toolbox = ws.getToolbox() as Blockly.Toolbox;
    if (toolbox && toolbox.getFlyout) {
      const flyout = toolbox.getFlyout();
      if (flyout) {
        flyout.autoClose = false;

        // Re-enable click-to-instantiate because autoClose = false disables it
        const flyoutWs = flyout.getWorkspace();
        if (flyoutWs) {
          flyoutWs.addChangeListener((e: Blockly.Events.Abstract) => {
            if (e.type === Blockly.Events.CLICK) {
              const clickEvent = e as unknown as { blockId?: string; targetType?: string };
              if (clickEvent.blockId && clickEvent.targetType === 'block') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const gesture = (ws as any).getGesture?.() || (Blockly as any).Gesture?.inProgress?.();
                const isDragging = gesture && typeof gesture.isDragging === 'function' ? gesture.isDragging() : false;

                if (!isDragging) {
                  const blockToCreate = flyoutWs.getBlockById(clickEvent.blockId);
                  if (blockToCreate) {
                    let newBlockId: string | null = null;
                    const createListener = (event: Blockly.Events.Abstract) => {
                      if (event.type === Blockly.Events.CREATE && (event as any).blockId) {
                        newBlockId = (event as any).blockId;
                      }
                    };
                    ws.addChangeListener(createListener);

                    const xml = Blockly.utils.xml.createElement('xml');
                    const blockDom = Blockly.Xml.blockToDom(blockToCreate) as Element;
                    xml.appendChild(blockDom);
                    Blockly.Xml.domToWorkspace(xml, ws);

                    ws.removeChangeListener(createListener);

                    if (newBlockId) {
                      const newBlock = ws.getBlockById(newBlockId);
                      if (newBlock) {
                        // Center the new block in the middle of current view
                        setTimeout(() => {
                          const metricsManager = ws.getMetricsManager();
                          const viewMetrics = metricsManager.getViewMetrics(true); // workspace coords
                          const blockHW = newBlock.getHeightWidth();

                          const targetX = viewMetrics.left + (viewMetrics.width / 2) - (blockHW.width / 2);
                          const targetY = viewMetrics.top + (viewMetrics.height / 2) - (blockHW.height / 2);

                          const currentXY = newBlock.getRelativeToSurfaceXY();
                          newBlock.moveBy(targetX - currentXY.x, targetY - currentXY.y);
                        }, 10);
                      }
                    }
                  }
                }
              }
            }
          });
        }
      }
    }

    // ---------------- helpers ----------------
    const lastToolboxCategoryRef = { current: "0" };

    const ensureToolboxSelected = () => {
      const tb = ws.getToolbox();
      if (!tb) return;

      const selected = tb.getSelectedItem();
      if (selected) {
        lastToolboxCategoryRef.current = selected.getId() || "0";
      } else if (activeCategory) {
        const itemToSelect = (tb as Blockly.Toolbox).getToolboxItemById(activeCategory);
        if (itemToSelect) {
          (tb as Blockly.Toolbox).setSelectedItem(itemToSelect);
        }
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

    const onChange = (e: Blockly.Events.Abstract) => {
      ensureToolboxSelected();
      if (!e.isUiEvent) emitCode();
    };
    ws.addChangeListener(onChange);

    const onViewport = (e: Blockly.Events.Abstract) => {
      if (e.type === Blockly.Events.VIEWPORT_CHANGE) reflowFlyout();
    };
    ws.addChangeListener(onViewport);

    // Fix: Compensate scroll when flyout width changes on category switch
    // This keeps blocks visually stationary when the flyout panel grows/shrinks
    let lastFlyoutWidth = 0;
    {
      const tb = ws.getToolbox() as Blockly.Toolbox;
      const fly = tb?.getFlyout?.();
      if (fly) {
        const flyDiv = (fly as any).svgGroup_?.parentElement || (fly as any).svgGroup_;
        lastFlyoutWidth = flyDiv?.getBoundingClientRect?.()?.width ?? 0;
      }
    }

    const onToolboxChange = (e: Blockly.Events.Abstract) => {
      if (e.type === Blockly.Events.TOOLBOX_ITEM_SELECT) {
        // Measure old flyout width
        const oldWidth = lastFlyoutWidth;

        setTimeout(() => {
          // Measure new flyout width after render
          const tb = ws.getToolbox() as Blockly.Toolbox;
          const fly = tb?.getFlyout?.();
          let newWidth = 0;
          if (fly) {
            const flyDiv = (fly as any).svgGroup_?.parentElement || (fly as any).svgGroup_;
            newWidth = flyDiv?.getBoundingClientRect?.()?.width ?? 0;
          }

          const diff = newWidth - oldWidth;
          lastFlyoutWidth = newWidth;

          if (diff !== 0) {
            // Compensate scroll so blocks don't appear to move
            ws.scroll(ws.scrollX - diff, ws.scrollY);
          }

          Blockly.svgResize(ws);
          reflowFlyout();
        }, 50);
      }
    };
    ws.addChangeListener(onToolboxChange);

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

    // -------- Undo/Redo Stack for AI workspace loads --------
    const undoStack: unknown[] = [];
    const redoStack: unknown[] = [];
    const MAX_STACK = 20;

    // Track preview state (AI-generated but not yet accepted)
    let isInPreviewMode = false;
    let previewSource = ""; // 'ai-generate', 'ai-fix', 'ai-explain-fix'

    const saveCurrentState = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const saveFn = (Blockly as any).serialization?.workspaces?.save;
        if (typeof saveFn === "function") {
          const state = saveFn(ws);
          undoStack.push(state);
          if (undoStack.length > MAX_STACK) undoStack.shift();
        }
      } catch (err) {
        console.warn("Failed to save workspace state for undo:", err);
      }
    };

    const peekUndoStack = () => {
      return undoStack.length > 0 ? undoStack[undoStack.length - 1] : null;
    };

    const pushRedoState = () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const saveFn = (Blockly as any).serialization?.workspaces?.save;
        if (typeof saveFn === "function") {
          const state = saveFn(ws);
          redoStack.push(state);
          if (redoStack.length > MAX_STACK) redoStack.shift();
        }
      } catch (err) {
        console.warn("Failed to save workspace state for redo:", err);
      }
    };

    // -------- Handle AI "load workspace" request (with validation + undo + preview) --------
    const onWorkspaceLoad = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ workspace: unknown; skipPreview?: boolean; isPreview?: boolean; source?: string }>;
        const incoming = ce.detail?.workspace;
        if (!incoming) return;

        // Validate JSON structure before loading
        if (typeof incoming !== "object" || incoming === null) {
          throw new Error("Workspace JSON không hợp lệ: phải là object");
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadFn = (Blockly as any).serialization?.workspaces?.load;
        if (typeof loadFn !== "function") {
          throw new Error("Blockly serialization API không khả dụng");
        }

        // Save current state for undo - LUÔN save để có thể undo/reject
        // Kể cả khi workspace trống, cũng cần lưu để có thể quay lại trạng thái trống
        saveCurrentState();

        // Track preview mode
        isInPreviewMode = ce.detail?.isPreview ?? false;
        previewSource = ce.detail?.source || "";

        // New action invalidates redo (trừ khi đang preview - cho phép redo để quay lại preview)
        if (!isInPreviewMode) {
          redoStack.length = 0;
        }

        // Try to load in a temporary workspace to validate
        try {
          // Create a temporary workspace to test load
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tempWs = new (Blockly as any).Workspace();
          loadFn(incoming, tempWs);
          tempWs.dispose();

          // If validation passed, load into real workspace
          ws.clear();

          // eslint-disable-next-line no-console
          console.log("[AI] Loading workspace:", incoming);

          loadFn(incoming, ws);

          // Ensure workspace is properly rendered
          ws.render();

          // Center the view after a short delay to ensure blocks are positioned
          setTimeout(() => {
            try {
              ws.scrollCenter();
              // eslint-disable-next-line no-console
              console.log("[AI] Workspace loaded, blocks count:", ws.getTopBlocks(true).length);
            } catch (e) {
              // eslint-disable-next-line no-console
              console.warn("[AI] Failed to center view:", e);
            }
          }, 100);

          emitCode();

          // Notification phù hợp với mode
          const message = isInPreviewMode
            ? `👁️ Preview: ${previewSource}. Dùng Accept để giữ, Reject/Undo để hoàn tác.`
            : "✅ Đã nạp workspace thành công";

          window.dispatchEvent(new CustomEvent("blockly:notification", {
            detail: { type: isInPreviewMode ? "info" : "success", message }
          }));
        } catch (validationErr) {
          // Validation failed - don't clear old workspace
          const msg = validationErr instanceof Error ? validationErr.message : String(validationErr);
          throw new Error(`Workspace không hợp lệ: ${msg}. Workspace cũ đã được giữ nguyên.`);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Failed to load workspace from AI:", err);
        // Show error notification
        window.dispatchEvent(new CustomEvent("blockly:notification", {
          detail: { type: "error", message: `❌ ${msg}` }
        }));
      }
    };
    window.addEventListener("blockly:workspace_load", onWorkspaceLoad as EventListener);

    // -------- Handle workspace preview (show preview, then load on accept) --------
    const onWorkspacePreview = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ workspace: unknown; source: string; onAccept: () => void; onReject: () => void }>;
        const incoming = ce.detail?.workspace;
        if (!incoming) return;

        // Save current state for undo
        const topBlocks = ws.getTopBlocks(true);
        if (topBlocks.length > 0) {
          saveCurrentState();
        }
        // Preview does not invalidate redo (no change applied yet)

        // Preview will be handled by BlockSuggestionAI modal
        // This listener just ensures state is saved
      } catch (err) {
        console.error("Failed to handle workspace preview:", err);
      }
    };
    window.addEventListener("blockly:workspace_preview", onWorkspacePreview as EventListener);

    // -------- Handle undo request --------
    const onUndo = () => {
      if (undoStack.length === 0) {
        window.dispatchEvent(new CustomEvent("blockly:notification", {
          detail: { type: "info", message: "Không có gì để hoàn tác" }
        }));
        return;
      }

      try {
        const previousState = undoStack.pop();
        if (!previousState) return;

        // Save current state to redo stack
        pushRedoState();

        // Nếu đang trong preview mode, undo sẽ thoát khỏi preview mode
        if (isInPreviewMode) {
          isInPreviewMode = false;
          previewSource = "";
          // Đóng review panel khi undo khỏi preview
          window.dispatchEvent(new CustomEvent("blockly:review_close"));
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadFn = (Blockly as any).serialization?.workspaces?.load;
        if (typeof loadFn === "function") {
          ws.clear();
          loadFn(previousState, ws);
          emitCode();

          window.dispatchEvent(new CustomEvent("blockly:notification", {
            detail: { type: "success", message: "↩️ Đã hoàn tác" }
          }));
        }
      } catch (err) {
        console.error("Failed to undo:", err);
      }
    };
    window.addEventListener("blockly:undo", onUndo as EventListener);

    // -------- Handle redo request --------
    const onRedo = () => {
      if (redoStack.length === 0) {
        window.dispatchEvent(new CustomEvent("blockly:notification", {
          detail: { type: "info", message: "Không có gì để làm lại" }
        }));
        return;
      }

      try {
        const nextState = redoStack.pop();
        if (!nextState) return;

        // Save current state to undo stack
        saveCurrentState();

        // Redo thì trở lại preview mode (vì redo chỉ có state từ preview)
        // Note: source sẽ không chính xác 100% nhưng không quan trọng lắm
        isInPreviewMode = true;

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const loadFn = (Blockly as any).serialization?.workspaces?.load;
        if (typeof loadFn === "function") {
          ws.clear();
          loadFn(nextState, ws);
          emitCode();

          window.dispatchEvent(new CustomEvent("blockly:notification", {
            detail: { type: "success", message: "↪️ Đã làm lại" }
          }));
        }
      } catch (err) {
        console.error("Failed to redo:", err);
      }
    };
    window.addEventListener("blockly:redo", onRedo as EventListener);

    // -------- Handle Accept Preview --------
    const onAcceptPreview = () => {
      if (!isInPreviewMode) {
        window.dispatchEvent(new CustomEvent("blockly:notification", {
          detail: { type: "info", message: "Không có thay đổi nào đang chờ xác nhận" }
        }));
        return;
      }

      // Chấp nhận preview: lưu state hiện tại vào undo stack và thoát preview mode
      saveCurrentState();
      isInPreviewMode = false;
      previewSource = "";
      redoStack.length = 0; // Accept thì clear redo stack

      window.dispatchEvent(new CustomEvent("blockly:notification", {
        detail: { type: "success", message: "✅ Đã chấp nhận thay đổi" }
      }));
    };
    window.addEventListener("blockly:accept_preview", onAcceptPreview as EventListener);

    // -------- Handle Reject Preview --------
    const onRejectPreview = () => {
      if (!isInPreviewMode) {
        window.dispatchEvent(new CustomEvent("blockly:notification", {
          detail: { type: "info", message: "Không có thay đổi nào đang chờ xác nhận" }
        }));
        return;
      }

      // Từ chối preview: undo về state trước đó
      onUndo();
    };
    window.addEventListener("blockly:reject_preview", onRejectPreview as EventListener);

    // -------- Keyboard shortcuts (AI undo/redo) --------
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't hijack typing inside inputs
      const el = e.target as HTMLElement | null;
      const tag = el?.tagName?.toLowerCase();
      const isTyping = tag === "input" || tag === "textarea" || (el?.getAttribute?.("contenteditable") === "true");
      if (isTyping) return;

      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (!ctrlOrCmd) return;

      // Undo: Ctrl+Z / Cmd+Z
      if (e.key.toLowerCase() === "z" && !e.shiftKey) {
        e.preventDefault();
        onUndo();
        return;
      }

      // Redo: Ctrl+Y OR Ctrl+Shift+Z (common)
      if (e.key.toLowerCase() === "y" || (e.key.toLowerCase() === "z" && e.shiftKey)) {
        e.preventDefault();
        onRedo();
      }
    };
    window.addEventListener("keydown", onKeyDown);

    // -------- Handle "add block" request (used by AI suggestion modal) --------
    const onAddBlock = (e: Event) => {
      try {
        const ce = e as CustomEvent<{ type: string }>;
        const type = ce.detail?.type;
        if (!type) return;

        const block = ws.newBlock(type);
        block.initSvg();
        block.render();

        // Place block roughly in center of view
        const metrics = ws.getMetrics();
        const x = (metrics.viewLeft + metrics.viewWidth / 2) / ws.scale;
        const y = (metrics.viewTop + metrics.viewHeight / 2) / ws.scale;
        block.moveBy(x, y);

        emitCode();
      } catch (err) {
        console.error("Failed to add block:", err);
      }
    };
    window.addEventListener("blockly:add_block", onAddBlock as EventListener);

    return () => {
      window.removeEventListener("blockly:request_run", onRequestRun);
      window.removeEventListener("blockly:workspace_load", onWorkspaceLoad as EventListener);
      window.removeEventListener("blockly:workspace_preview", onWorkspacePreview as EventListener);
      window.removeEventListener("blockly:undo", onUndo as EventListener);
      window.removeEventListener("blockly:redo", onRedo as EventListener);
      window.removeEventListener("blockly:accept_preview", onAcceptPreview as EventListener);
      window.removeEventListener("blockly:reject_preview", onRejectPreview as EventListener);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("blockly:add_block", onAddBlock as EventListener);
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
    } else {
      // Dismiss any active Blockly field editors (number inputs, dropdowns, etc.)
      // They persist as floating DOM elements when the workspace is hidden
      Blockly.WidgetDiv.hide();
      Blockly.DropDownDiv.hideWithoutAnimation();

      // Also remove any lingering blocklyHtmlInput elements
      const inputs = document.querySelectorAll('.blocklyHtmlInput');
      inputs.forEach(el => el.remove());
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
    <div className={`flex h-full w-full overflow-hidden relative ${!activeCategory ? 'flyout-closed' : ''}`}>
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
