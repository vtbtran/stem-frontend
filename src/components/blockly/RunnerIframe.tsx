"use client";

import React from "react";

type RunnerIframeProps = {
  getCode: () => string;
  language: "js" | "py";
};

const IFRAME_HTML = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"></script>
</head>
<body>
<script>
  // --- 1. SETUP ENVIRONMENT & HELPERS (Run Once) ---
  const oldLog = console.log;
  console.log = (...args) => {
    parent.postMessage({ type: "blockly_log", args }, "*");
    oldLog(...args);
  };

  window.alert = (...args) => {
    parent.postMessage({ type: "blockly_log", args: ["[Alert]", ...args] }, "*");
  };

  window.onerror = (msg, url, line, col, error) => {
    parent.postMessage({ type: "blockly_error", error: String(msg) }, "*");
    return false;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

  // Motion Helpers
  window.moveForward = async (s) => {
     console.log(\`➡️ Di chuyển tới \${s} bước\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: Number(s) }, "*");
     await sleep(400); 
  };
  window.moveBackward = async (s) => {
     console.log(\`⬅️ Di chuyển lùi \${s} bước\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: -Number(s) }, "*");
     await sleep(400);
  };
  window.turnLeft = async (d) => {
     console.log(\`↩️ Xoay trái \${d} độ\`);
     parent.postMessage({ type: "blockly_motion", action: "turn", value: -Number(d) }, "*");
     await sleep(400);
  };
  window.turnRight = async (d) => {
     console.log(\`↪️ Xoay phải \${d} độ\`);
     parent.postMessage({ type: "blockly_motion", action: "turn", value: Number(d) }, "*");
     await sleep(400);
  };

  // Sound Helpers
  window.beep = async () => {
     console.log(\`🔔 Phát tiếng bíp\`);
     parent.postMessage({ type: "blockly_sound", action: "beep" }, "*");
     await sleep(300);
  };
  window.tone = async (freq, dur) => {
     console.log(\`🎵 Phát nốt \${freq}Hz\`);
     parent.postMessage({ type: "blockly_sound", action: "tone", value: { freq: Number(freq), dur: Number(dur) } }, "*");
     await sleep(Number(dur) * 1000);
  };

  // Time-based Motion
  window.moveForwardTime = async (s, t) => {
     console.log(\`➡️ Di chuyển tới \${s} bước trong \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: Number(s), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
  };
  window.moveBackwardTime = async (s, t) => {
     console.log(\`⬅️ Di chuyển lùi \${s} bước trong \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: -Number(s), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
  };

  // Basic Look Helpers
  window.say = async (text, duration) => {
     console.log(\`💬 Nói: "\${text}"\`);
     parent.postMessage({ type: "blockly_look", action: "say", value: { text: String(text), duration: Number(duration) } }, "*");
     await sleep(Number(duration) * 1000);
  };

  // --- 2. PYTHON LOADING LOGIC ---
  let pyodideReady = false;
  let pyodideLoading = false;

  async function ensurePyodide() {
    if (pyodideReady) return true;
    if (pyodideLoading) {
      // Wait until ready
      while (pyodideLoading && !pyodideReady) await sleep(100);
      return pyodideReady;
    }

    pyodideLoading = true;
    parent.postMessage({ type: "blockly_log", args: ["➡️ Đang khởi tạo môi trường Python..."] }, "*");
    try {
      window.pyodide = await loadPyodide({
        stdout: (text) => parent.postMessage({ type: "blockly_log", args: [text] }, "*"),
        stderr: (text) => parent.postMessage({ type: "blockly_error", error: text }, "*")
      });
      pyodideReady = true;
      pyodideReady = true;
      parent.postMessage({ type: "blockly_log", args: ["✅ Môi trường Python đã sẵn sàng!"] }, "*");
      return true;
    } catch (e) {
      parent.postMessage({ type: "blockly_error", error: "❌ Không thể tải thư viện Python: " + String(e) }, "*");
      pyodideLoading = false;
      return false;
    }
  }

  // --- 3. EXECUTION HANDLER ---
  window.addEventListener("message", async (event) => {
    const { type, code, language } = event.data;
    
    if (type === "run") {
      try {
        if (language === "py") {
          const ready = await ensurePyodide();
          if (!ready) return;

          const pythonSetup = "import js\\nasync def move_forward(s): await js.moveForward(s)\\nasync def move_backward(s): await js.moveBackward(s)\\nasync def turn_left(d): await js.turnLeft(d)\\nasync def turn_right(d): await js.turnRight(d)\\nasync def move_forward_time(s, t): await js.moveForwardTime(s, t)\\nasync def move_backward_time(s, t): await js.moveBackwardTime(s, t)\\nasync def say(t, d): await js.say(t, d)\\nasync def beep(): await js.beep()\\nasync def tone(f, d): await js.tone(f, d)\\n";
          
          await window.pyodide.runPythonAsync(pythonSetup + code);
        } else {
          // Javascript Execution
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const func = new AsyncFunction(code);
          await func();
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
          console.log("Chương trình đã dừng bởi người dùng.");
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
