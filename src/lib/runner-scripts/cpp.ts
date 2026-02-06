export const CPP_SCRIPT = `
  // --- C++ SIMULATION LOGIC UPDATED ---
  async function runCppSimulation(code) {
     let jsCode = code;
     
     // 1. Loại bỏ các dòng #include
     jsCode = jsCode.replace(/#include\\s+[<"].*?[>"]/g, '');

     // 2. Chuyển đổi các kiểu dữ liệu C++ sang 'let' của JS
     const types = ['int', 'float', 'double', 'string', 'bool', 'char', 'long'];
     const typeRegex = new RegExp(\`(\\\\b)(\${types.join('|')})(\\\\s+)\`, 'g');
     jsCode = jsCode.replace(typeRegex, '$1let$3');

     // 3. Biến đổi hàm void setup() và void loop() thành async function
     jsCode = jsCode.replace(/void\\s+setup\\s*\\(\\s*\\)\\s*\\{/g, 'async function setup() {');
     jsCode = jsCode.replace(/void\\s+loop\\s*\\(\\s*\\)\\s*\\{/g, 'async function loop() {');

     // 4. Async-ify các hàm điều khiển và delay
     const functions = [
       'moveForward', 'moveBackward', 'turnLeft', 'turnRight', 
       'beep', 'tone', 'moveForwardTime', 'moveBackwardTime', 'say',
       'led', 'servo', 'delay'
     ];
     
     functions.forEach(fn => {
        const regex = new RegExp(\`\\\\b\${fn}\\\\s*\\\\(\`, 'g');
        jsCode = jsCode.replace(regex, \`await window.\${fn}(\`);
     });

     // 5. Tạo khung thực thi hỗ trợ vòng lặp loop()
     const finalScript = \`
        \${jsCode}
        try {
          if (typeof setup === 'function') await setup();
          if (typeof loop === 'function') {
            while (!window.isStopped) {
              await loop();
              // Thêm một khoảng nghỉ siêu nhỏ để tránh treo trình duyệt
              await new Promise(resolve => setTimeout(resolve, 10)); 
            }
          }
        } catch (e) {
          if (String(e).includes("STOP_REQUESTED")) return;
          parent.postMessage({ type: "blockly_error", error: String(e) }, "*");
        }
     \`;
     
     // Thực thi script đã bọc trong IIFE async
     try {
       const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
       const run = new AsyncFunction(finalScript);
       await run();
     } catch (err) {
       parent.postMessage({ type: "blockly_error", error: "Syntax Error: " + String(err) }, "*");
     }
  }
`;