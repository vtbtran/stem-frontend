export const JS_SCRIPT = `
  // --- JS EXECUTION LOGIC ---
  async function runJs(code) {
      try {
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const func = new AsyncFunction(code);
          await func();
      } catch (e) {
          // Bắt lỗi dừng để thoát êm ái
          if (String(e).includes("STOP_REQUESTED")) {
              console.log("JS Simulation: Stopped.");
              return;
          }
          parent.postMessage({ type: "blockly_error", error: String(e) }, "*");
      }
  }
`;