export const COMMON_SCRIPT = `
  // --- 1. SETUP ENVIRONMENT & HELPERS (Run Once) ---
  const oldLog = console.log;
  console.log = (...args) => {
    parent.postMessage({ type: "blockly_log", args }, "*");
    // oldLog(...args);
  };

  window.alert = (...args) => {
    parent.postMessage({ type: "blockly_log", args: ["[Alert]", ...args] }, "*");
  };

  window.onerror = (msg, url, line, col, error) => {
    parent.postMessage({ type: "blockly_error", error: String(msg) }, "*");
    return false;
  };

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  window.delay = async (ms) => {
      await sleep(ms);
  };

  // Motion Helpers (Conversion: Steps = (Speed * Time) / 10)
  const calculateSteps = (v, t) => Math.round((v * t) / 10);

  window.moveForward = async (v, t) => {
     const steps = calculateSteps(v, t);
     console.log(\`➡️ Di chuyển tới: Tốc độ \${v}, Time \${t}s (~\${steps} bước)\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000); 
  };
  window.moveBackward = async (v, t) => {
     const steps = calculateSteps(v, t);
     console.log(\`⬅️ Di chuyển lùi: Tốc độ \${v}, Time \${t}s (~\${steps} bước)\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: -Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
  };
  window.turnLeft = async (v, t) => {
     console.log(\`↩️ Xoay trái: Tốc độ \${v}, Time \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "turn", value: { val: -Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
  };
  window.turnRight = async (v, t) => {
     console.log(\`↪️ Xoay phải: Tốc độ \${v}, Time \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "turn", value: { val: Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
  };

  // Sound Helpers
  window.beep = async () => {
     console.log(\` Phát tiếng bíp\`);
     parent.postMessage({ type: "blockly_sound", action: "beep" }, "*");
     await sleep(300);
  };
  window.tone = async (freq, dur) => {
     console.log(\` Phát nốt \${freq}Hz\`);
     parent.postMessage({ type: "blockly_sound", action: "tone", value: { freq: Number(freq), dur: Number(dur) } }, "*");
     await sleep(Number(dur) * 1000);
  };

  // Time-based Motion
  window.moveForwardTime = async (s, t) => {
     console.log(\` Di chuyển tới \${s} bước trong \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: Number(s), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
  };
  window.moveBackwardTime = async (s, t) => {
     console.log(\`⬅ Di chuyển lùi \${s} bước trong \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: -Number(s), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
  };

  // Basic Look Helpers
  window.say = async (text, duration) => {
     console.log(\` Nói: "\${text}"\`);
     parent.postMessage({ type: "blockly_look", action: "say", value: { text: String(text), duration: Number(duration) } }, "*");
     await sleep(Number(duration) * 1000);
  };
  
  window.led = async (state) => {
     console.log(\` Đèn \${state}\`);
     parent.postMessage({ type: "blockly_look", action: state }, "*");
     await sleep(100);
  };

  window.servo = async (angle) => {
     console.log(\` Servo góc \${angle}\`);
     parent.postMessage({ type: "blockly_servo", value: Number(angle) }, "*");
     await sleep(100);
  };
`;
