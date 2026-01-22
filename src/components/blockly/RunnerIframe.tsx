"use client";

import React from "react";

type RunnerIframeProps = {
  getCode: () => string;
};

export default function RunnerIframe({ getCode }: RunnerIframeProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);

  React.useEffect(() => {
    const onRun = () => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const code = getCode() ?? "";

      const html = `<!doctype html>
<html>
<head><meta charset="utf-8"/></head>
<body>
<script>
  // console.log -> parent
  const oldLog = console.log;
  console.log = (...args) => {
    parent.postMessage({ type: "blockly_log", args }, "*");
    oldLog(...args);
  };

  try {
    ${code}
  } catch (err) {
    parent.postMessage({ type: "blockly_error", error: String(err) }, "*");
  }
<\/script>
</body>
</html>`;

      iframe.srcdoc = html;
    };

    window.addEventListener("blockly:run", onRun);
    return () => window.removeEventListener("blockly:run", onRun);
  }, [getCode]);

  // Optional: show runtime errors as alert
  React.useEffect(() => {
    const onMsg = (ev: MessageEvent) => {
      if (ev.data?.type === "blockly_error") {
        alert("Runtime error: " + ev.data.error);
      }
      // if (ev.data?.type === "blockly_log") console.log("[Blockly]", ...ev.data.args);
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      className="hidden"
      sandbox="allow-scripts"
      title="blockly-runner"
    />
  );
}
