import { useState, useEffect } from "react";

export function useTerminalLog() {
    const [terminalLogs, setTerminalLogs] = useState<string[]>([]);

    useEffect(() => {
        // Capture terminal logs for AI context
        const onTerminalLog = (e: Event) => {
            const ce = e as CustomEvent<{ args: unknown[] }>;
            const message = ce.detail.args.map(arg =>
                typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
            ).join(" ");
            setTerminalLogs(prev => [...prev.slice(-50), message]); // Keep last 50 logs
        };

        const onTerminalError = (e: Event) => {
            const ce = e as CustomEvent<{ error: string }>;
            setTerminalLogs(prev => [...prev.slice(-50), `[ERROR] ${ce.detail.error}`]);
        };

        window.addEventListener("blockly:log", onTerminalLog);
        window.addEventListener("blockly:error", onTerminalError);

        return () => {
            window.removeEventListener("blockly:log", onTerminalLog);
            window.removeEventListener("blockly:error", onTerminalError);
        };
    }, []);

    return { terminalLogs, setTerminalLogs };
}
