
export const COMMON_SCRIPT = `
window.isStopped = false; // Biến cờ hiệu toàn cục

// Hàm hỗ trợ kiểm tra trạng thái dừng
const checkStop = () => {
  if (window.isStopped) {
    throw new Error("STOP_REQUESTED"); // Ném ra lỗi để ngắt hàm async ngay lập tức
  }
};
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


const sleep = async (ms) => {
  const start = Date.now();
  while (Date.now() - start < ms) {
    // Kiểm tra biến isStopped của CỬA SỔ CHÍNH (window)
    if (window.isStopped) {
      throw new Error("STOP_REQUESTED"); // Giật mình tỉnh giấc và dừng ngay!
    }
    await new Promise(resolve => setTimeout(resolve, 50)); // Kiểm tra lại mỗi 0.05 giây
  }
};

  // Motion Helpers (Conversion: Steps = (Speed * Time) / 10)
  const calculateSteps = (v, t) => Math.round((v * t) / 10);

  window.moveForward = async (v, t) => {
     checkStop();
     const steps = calculateSteps(v, t);
     console.log(\`➡️ Di chuyển tới: Tốc độ \${v}, Time \${t}s (~\${steps} bước)\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000); 
     checkStop();
  };
  window.moveBackward = async (v, t) => {
      checkStop();
     const steps = calculateSteps(v, t);
     console.log(\`⬅️ Di chuyển lùi: Tốc độ \${v}, Time \${t}s (~\${steps} bước)\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: -Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
     checkStop();
  };
  window.turnLeft = async (v, t) => {
      checkStop();
     console.log(\`↩️ Xoay trái: Tốc độ \${v}, Time \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "turn", value: { val: -Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
     checkStop();
  };
  window.turnRight = async (v, t) => {
     checkStop();
     console.log(\`↪️ Xoay phải: Tốc độ \${v}, Time \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "turn", value: { val: Number(v), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
     checkStop();
  };

  // Sound Helpers
  window.beep = async () => {
     checkStop();
     console.log(\` Phát tiếng bíp\`);
     parent.postMessage({ type: "blockly_sound", action: "beep" }, "*");
     await sleep(300);
     checkStop();
  };
  window.tone = async (freq, dur) => {
     checkStop();
     console.log(\` Phát nốt \${freq}Hz\`);
     parent.postMessage({ type: "blockly_sound", action: "tone", value: { freq: Number(freq), dur: Number(dur) } }, "*");
     await sleep(Number(dur) * 1000);
     checkStop();
  };

  // Time-based Motion
  window.moveForwardTime = async (s, t) => {
     checkStop();
     console.log(\` Di chuyển tới \${s} bước trong \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: Number(s), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
     checkStop();
  };
  window.moveBackwardTime = async (s, t) => {
     checkStop();
     console.log(\`⬅ Di chuyển lùi \${s} bước trong \${t}s\`);
     parent.postMessage({ type: "blockly_motion", action: "move", value: { val: -Number(s), dur: Number(t) } }, "*");
     await sleep(Number(t) * 1000);
     checkStop();
  };

  // Basic Look Helpers
  window.say = async (text, duration) => {
     checkStop();
     console.log(\` Nói: "\${text}"\`);
     parent.postMessage({ type: "blockly_look", action: "say", value: { text: String(text), duration: Number(duration) } }, "*");
     await sleep(Number(duration) * 1000);
       checkStop();
  };
  
  window.led = async (state) => {
  checkStop();
     console.log(\` Đèn \${state}\`);
     parent.postMessage({ type: "blockly_look", action: state }, "*");
     await sleep(100);
     checkStop();
  };

  window.servo = async (angle) => {
  checkStop();
     console.log(\` Servo góc \${angle}\`);
     parent.postMessage({ type: "blockly_servo", value: Number(angle) }, "*");
     await sleep(100);
     checkStop();
  };
  
`;
