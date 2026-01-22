"use client";

import React from "react";
import * as Blockly from "blockly";
import "blockly/blocks";
import { javascriptGenerator } from "blockly/javascript";
import { TOOLBOX_XML } from "./toolbox";
import RunnerIframe from "./RunnerIframe";

const TOOLBOX_W = 140; // phải trùng CSS .blocklyToolboxDiv width
const FLYOUT_W = 240;  // phải trùng CSS .blocklyFlyout width

export default function BlocklyWorkspace() {
  const hostRef = React.useRef<HTMLDivElement | null>(null);
  const workspaceRef = React.useRef<Blockly.WorkspaceSvg | null>(null);

  const latestCodeRef = React.useRef<string>("");
  const getCode = React.useCallback(() => latestCodeRef.current, []);

  React.useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    // (dev StrictMode) dispose workspace cũ nếu có
    if (workspaceRef.current) {
      workspaceRef.current.dispose();
      workspaceRef.current = null;
    }

    const ws = Blockly.inject(host, {
      toolbox: TOOLBOX_XML,
      toolboxPosition: "start",
      horizontalLayout: false,

      trashcan: true,
      scrollbars: true,

      move: { scrollbars: true, drag: true, wheel: false },

      // nếu anh em muốn bật zoom thì mở lại:
      // zoom: {
      //   controls: true,
      //   wheel: true,
      //   startScale: 0.95,
      //   maxScale: 2,
      //   minScale: 0.5,
      //   scaleSpeed: 1.1,
      // },

      // media: "/blockly/media/",
    });

    workspaceRef.current = ws;

    // ---------- helpers ----------
    const emitCode = () => {
      const code = javascriptGenerator.workspaceToCode(ws);
      latestCodeRef.current = code;
      window.dispatchEvent(new CustomEvent("blockly:code", { detail: { code } }));
    };

    const ensureToolboxSelected = () => {
      const tb = ws.getToolbox();
      if (!tb) return;
      if (!tb.getSelectedItem()) tb.selectItemByPosition(0);
    };

    // vùng thả hợp lệ = phần bên phải (trừ toolbox + flyout)
    const getDropRect = () => {
      const svg = host.querySelector("svg.blocklySvg") as SVGSVGElement | null;
      if (!svg) return null;

      const r = svg.getBoundingClientRect();
      const leftCut = TOOLBOX_W + FLYOUT_W;

      return {
        left: r.left + leftCut,
        top: r.top,
        right: r.right,
        bottom: r.bottom,
      };
    };

    const deleteIfDroppedOutside = (blockId: string) => {
      const block = ws.getBlockById(blockId);
      if (!block) return;

      // chỉ xử lý block top-level (kéo cả cụm)
      if (block.getParent()) return;

      const dropRect = getDropRect();
      if (!dropRect) return;

      const root = block.getSvgRoot();
      if (!root) return;

      const b = root.getBoundingClientRect();
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;

      const inside =
        cx >= dropRect.left &&
        cx <= dropRect.right &&
        cy >= dropRect.top &&
        cy <= dropRect.bottom;

      if (!inside) {
        block.dispose(true); // ✅ xoá block nếu thả ngoài vùng
        emitCode();
      }
    };

    // ---------- init ----------
    // workspace trống
    ws.clear();
    ensureToolboxSelected();
    emitCode();

    // resize để drag không lệch
    const resize = () => Blockly.svgResize(ws);
    resize();
    requestAnimationFrame(resize);
    setTimeout(resize, 50);

    const ro = new ResizeObserver(() => resize());
    ro.observe(host);

    // change listener: update code + ensure toolbox
    const onChange = () => {
      ensureToolboxSelected();
      emitCode();
    };
    ws.addChangeListener(onChange);

    // ✅ listener riêng: kết thúc drag thì check thả ngoài vùng => xoá
    const onDrag = (e: Blockly.Events.Abstract) => {
      if (e.type !== Blockly.Events.BLOCK_DRAG) return;

      // ép type để khỏi lỗi TS isStart
      const drag = e as unknown as { isStart: boolean; blockId?: string };
      if (drag.isStart) return; // đang kéo
      if (!drag.blockId) return;

      deleteIfDroppedOutside(drag.blockId);
    };
    ws.addChangeListener(onDrag);

    return () => {
      ro.disconnect();
      ws.dispose();
      workspaceRef.current = null;
    };
  }, []);

  return (
    <div className="relative h-full w-full">
      <div ref={hostRef} className="h-full w-full overflow-hidden bg-white" />
      <RunnerIframe getCode={getCode} />
    </div>
  );
}
