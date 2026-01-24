"use client";

import React from "react";

type RunnerIframeProps = {
  getCode: () => string;
  language: "js" | "py";
};

export default function RunnerIframe({ getCode, language }: RunnerIframeProps) {
  const iframeRef = React.useRef<HTMLIFrameElement | null>(null);
  const languageRef = React.useRef(language);

  React.useEffect(() => {
    languageRef.current = language;
  }, [language]);

  React.useEffect(() => {
    const runCode = (codeToRun: string) => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      const currentLang = languageRef.current;

      const html = `<!doctype html>
      <html>
      <head>
        <meta charset="utf-8"/>
        <script src="https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js"><\/script>
      </head>
      <body>
      <script>
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

        window.moveForward = async (s) => {
           parent.postMessage({ type: "blockly_motion", action: "move", value: Number(s) }, "*");
           await sleep(400); // Wait for transition
        };
        window.moveBackward = async (s) => {
           parent.postMessage({ type: "blockly_motion", action: "move", value: -Number(s) }, "*");
           await sleep(400);
        };
        window.turnLeft = async (d) => {
           parent.postMessage({ type: "blockly_motion", action: "turn", value: -Number(d) }, "*");
           await sleep(400);
        };
        window.turnRight = async (d) => {
           parent.postMessage({ type: "blockly_motion", action: "turn", value: Number(d) }, "*");
           await sleep(400);
        };

        window.beep = async () => {
           parent.postMessage({ type: "blockly_sound", action: "beep" }, "*");
           await sleep(300);
        };

        window.tone = async (freq, dur) => {
           parent.postMessage({ type: "blockly_sound", action: "tone", value: { freq: Number(freq), dur: Number(dur) } }, "*");
           await sleep(Number(dur) * 1000);
        };

        window.moveForwardTime = async (s, t) => {
           parent.postMessage({ type: "blockly_motion", action: "move", value: { val: Number(s), dur: Number(t) } }, "*");
           await sleep(Number(t) * 1000);
        };

        window.moveBackwardTime = async (s, t) => {
           parent.postMessage({ type: "blockly_motion", action: "move", value: { val: -Number(s), dur: Number(t) } }, "*");
           await sleep(Number(t) * 1000);
        };

        window.say = async (text, duration) => {
           parent.postMessage({ type: "blockly_look", action: "say", value: { text: String(text), duration: Number(duration) } }, "*");
           await sleep(Number(duration) * 1000);
        };

        function waitForPyodide(timeout = 10000) {
          return new Promise((resolve, reject) => {
            if (window.loadPyodide) return resolve();
            const start = Date.now();
            const interval = setInterval(() => {
              if (window.loadPyodide) {
                clearInterval(interval);
                resolve();
              } else if (Date.now() - start > timeout) {
                clearInterval(interval);
                reject(new Error("Không thể tải thư viện Python (Quá thời gian). Vui lòng kiểm tra kết nối mạng."));
              }
            }, 100);
          });
        }

        async function runPython(code) {
          try {
            if (!window.pyodide) {
              parent.postMessage({ type: "blockly_log", args: ["Đang chuẩn bị môi trường Python..."] }, "*");
              await waitForPyodide();
              window.pyodide = await loadPyodide({
                stdout: (text) => {
                   parent.postMessage({ type: "blockly_log", args: [text] }, "*");
                },
                stderr: (text) => {
                   parent.postMessage({ type: "blockly_error", error: text }, "*");
                }
              });
              parent.postMessage({ type: "blockly_log", args: ["Môi trường Python đã sẵn sàng!"] }, "*");
            }
            await window.pyodide.runPythonAsync(code);
          } catch (err) {
            parent.postMessage({ type: "blockly_error", error: String(err) }, "*");
          }
        }

        async function main() {
          const rawCode = \`${codeToRun.replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$/g, "\\$")}\`;
          const lang = "${currentLang}";
          
          if (lang === "py") {
            const pythonSetup = "import js\\ndef move_forward(s): js.moveForward(s)\\ndef move_backward(s): js.moveBackward(s)\\ndef turn_left(d): js.turnLeft(d)\\ndef turn_right(d): js.turnRight(d)\\ndef move_forward_time(s, t): js.moveForwardTime(s, t)\\ndef move_backward_time(s, t): js.moveBackwardTime(s, t)\\ndef say(t, d): js.say(t, d)\\ndef beep(): js.beep()\\ndef tone(f, d): js.tone(f, d)\\n";
            await runPython(pythonSetup + rawCode);
          } else {
            try {
              // Wrap code in AsyncFunction to allow top-level await (vital for loops with delays)
              const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
              const func = new AsyncFunction(rawCode);
              await func();
            } catch (err) {
              parent.postMessage({ type: "blockly_error", error: String(err) }, "*");
            }
          }
        }
        
        main();
      <\/script>
      </body>
      </html>`;

      iframe.srcdoc = html;
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
      // console.log("Runner received message:", ev.data);
      if (ev.data?.type === "blockly_error") {
        const err = String(ev.data.error);
        if (err.includes("STOP")) {
          console.log("Program stopped by user.");
          return;
        }
        window.dispatchEvent(new CustomEvent("blockly:error", { detail: { error: err } }));
      }
      if (ev.data?.type === "blockly_log") {
        window.dispatchEvent(new CustomEvent("blockly:log", { detail: { args: ev.data.args } }));
      }
      if (ev.data?.type === "blockly_motion") {
        console.log("Dispatching motion event:", ev.data);
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
