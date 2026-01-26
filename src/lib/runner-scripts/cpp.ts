export const CPP_SCRIPT = `
  // --- C++ SIMULATION LOGIC ---
  async function runCppSimulation(code) {
     
     // Naive Transpiler: Convert C++ syntax to async JS
     let jsCode = code;
     
     // 1. Remove includes
     jsCode = jsCode.replace(/#include\\s+[<"].*?[>"]/g, '');

     // 2. Remove "void main() {" wrapper intelligently
     // regex: (void or int) followed by whitespace, main, optional whitespace, (), optional whitespace, {
     // We use new RegExp to avoid template literal escaping issues with \\n
     const mainFuncStartRegex = new RegExp("(void|int)[\\\\s\\\\n]+main[\\\\s\\\\n]*\\\\([\\\\s\\\\S]*?\\\\)[\\\\s\\\\n]*\\\\{");
     
     if (mainFuncStartRegex.test(jsCode)) {
        console.log("RunnerIframe: Detected main function, stripping wrapper.");
        jsCode = jsCode.replace(mainFuncStartRegex, '');
        // Remove the last '}' (assuming it matches the main function)
        jsCode = jsCode.replace(/\\}\\s*$/, '');
     } else {
        console.log("RunnerIframe: No main function detected.");
     }

     console.log("RunnerIframe: Transpiled JS Code:", jsCode);

     // 3. Handle Variable Declarations & Loop Initializers
     // Replace 'int ', 'float ', etc. with 'let ' ONLY when they look like declarations
     // Match: start of line or space/paren, type, space, varname
     const types = ['int', 'float', 'double', 'string', 'bool', 'char', 'long'];
     const typeRegex = new RegExp(\`(\\\\b)(\${types.join('|')})(\\\\s+)\`, 'g');
     jsCode = jsCode.replace(typeRegex, '$1let$3');
       
     // 2. Async-ify the known blocking function calls
     const functions = [
       'moveForward', 'moveBackward', 'turnLeft', 'turnRight', 
       'beep', 'tone', 'moveForwardTime', 'moveBackwardTime', 'say'
     ];
     
     functions.forEach(fn => {
        // Replace fn(...) with await window.fn(...)
        // Need to handle arguments safely. 
        const regex = new RegExp(\`\\\\b\${fn}\\\\s*\\\\(\`, 'g');
        jsCode = jsCode.replace(regex, \`await window.\${fn}(\`);
     });
     
     // 4. Wrap in async IIFE and execute
     const finalScript = \`(async () => {
        try {
          \${jsCode}
        } catch (e) {
          console.error(e);
          parent.postMessage({ type: "blockly_error", error: String(e) }, "*");
        }
     })();\`;
     
     // Execute
     const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
     const func = new AsyncFunction(finalScript);
     await func();
  }
`;
