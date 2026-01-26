"use client";

import React from "react";

type RunnerIframeProps = {
  getCode: () => string;
  language: "js" | "py" | "cpp";
};

import { COMMON_SCRIPT } from "@/lib/runner-scripts/common";
import { JS_SCRIPT } from "@/lib/runner-scripts/js";
import { PYTHON_SCRIPT } from "@/lib/runner-scripts/py";
import { CPP_SCRIPT } from "@/lib/runner-scripts/cpp";

const IFRAME_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"></script>
</head>
<body>
<script>
  ${COMMON_SCRIPT}
  ${JS_SCRIPT}
  ${PYTHON_SCRIPT}
  ${CPP_SCRIPT}

  // --- EXECUTION HANDLER ---
  window.addEventListener("message", async (event) => {
    const { type, code, language } = event.data;
    
    if (type === "run") {
      try {
        if (language === "py") {
          await runPython(code);
        } else if (language === "cpp") {
           await runCppSimulation(code);
        } else {
           await runJs(code);
        }
      } catch (err) {
        parent.postMessage({ type: "blockly_error", error: String(err) }, "*");
      }
    }
  });
</script>
</body>
</html>`;

export default function RunnerIframe({ getCode, language }: RunnerIframeProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const languageRef = React.useRef(language);

  React.useEffect(() => {
    languageRef.current = language;
  }, [language]);

  // Initialize iframe content ONCE
  React.useEffect(() => {
    if (iframeRef.current) {
      iframeRef.current.srcdoc = IFRAME_HTML;
    }
  }, []);

  React.useEffect(() => {
    const runCode = (codeToRun: string) => {
      const iframe = iframeRef.current;
      if (!iframe || !iframe.contentWindow) return;

      // console.log("RunnerIframe: Executing code...", { language: languageRef.current, len: codeToRun.length });

      // Send message to iframe to execute code logic
      iframe.contentWindow.postMessage({
        type: "run",
        code: codeToRun,
        language: languageRef.current
      }, "*");
    };

    const onRun = () => runCode(getCode() ?? "");
    const onRunStack = (e: Event) => runCode((e as CustomEvent).detail.code);

    window.addEventListener("blockly:run", onRun);
    window.addEventListener("blockly:run_stack", onRunStack);

    return () => {
      window.removeEventListener("blockly:run", onRun);
      window.removeEventListener("blockly:run_stack", onRunStack);
    };
  }, [getCode]);

  React.useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === "blockly_error") {
        const err = String(ev.data.error);
        if (err.includes("STOP")) {
          // console.log("Chương trình đã dừng bởi người dùng.");
          return;
        }
        window.dispatchEvent(new CustomEvent("blockly:error", { detail: { error: err } }));
      }
      if (ev.data?.type === "blockly_log") {
        window.dispatchEvent(new CustomEvent("blockly:log", { detail: { args: ev.data.args } }));
      }
      if (ev.data?.type === "blockly_motion") {
        const { action, value } = ev.data;
        window.dispatchEvent(new CustomEvent("blockly:stage_motion", {
          detail: {
            type: action === "move" ? "MOTION_MOVE" : "MOTION_TURN",
            value: value
          }
        }));
      }
      if (ev.data?.type === "blockly_sound") {
        window.dispatchEvent(new CustomEvent("blockly:stage_sound", {
          detail: ev.data
        }));
      }
      if (ev.data?.type === "blockly_look") {
        window.dispatchEvent(new CustomEvent("blockly:stage_look", {
          detail: ev.data
        }));
      }
      if (ev.data?.type === "blockly_servo") {
        window.dispatchEvent(new CustomEvent("blockly:stage_servo", {
          detail: ev.data
        }));
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className="hidden"
      sandbox="allow-scripts allow-modals allow-same-origin"
      title="blockly-runner"
    />
  );
}
