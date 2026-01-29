export const PYTHON_SCRIPT = `
  // --- PYTHON LOADING LOGIC ---
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
    parent.postMessage({ type: "blockly_log", args: [" Đang khởi tạo môi trường Python..."] }, "*");
    try {
      window.pyodide = await loadPyodide({
        stdout: (text) => parent.postMessage({ type: "blockly_log", args: [text] }, "*"),
        stderr: (text) => parent.postMessage({ type: "blockly_error", error: text }, "*")
      });
      pyodideReady = true;
      parent.postMessage({ type: "blockly_log", args: [" Môi trường Python đã sẵn sàng!"] }, "*");
      return true;
    } catch (e) {
      parent.postMessage({ type: "blockly_error", error: " Không thể tải thư viện Python: " + String(e) }, "*");
      pyodideLoading = false;
      return false;
    }
  }

  async function runPython(code) {
      const ready = await ensurePyodide();
      if (!ready) return;

      const pythonSetup = "import js\\nasync def move_forward(v, t): await js.moveForward(v, t)\\nasync def move_backward(v, t): await js.moveBackward(v, t)\\nasync def turn_left(v, t): await js.turnLeft(v, t)\\nasync def turn_right(v, t): await js.turnRight(v, t)\\nasync def say(t, d): await js.say(t, d)\\nasync def beep(): await js.beep()\\nasync def tone(f, d): await js.tone(f, d)\\n";
      
      await window.pyodide.runPythonAsync(pythonSetup + code);
  }
`;
