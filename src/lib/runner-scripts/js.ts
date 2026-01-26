export const JS_SCRIPT = `
  // --- JS EXECUTION LOGIC ---
  async function runJs(code) {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const func = new AsyncFunction(code);
      await func();
  }
`;
