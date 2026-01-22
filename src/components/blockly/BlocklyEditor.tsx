"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import CodePanel from "./CodePanel";

const BlocklyWorkspace = dynamic(() => import("./BlocklyWorkspace"), { ssr: false });

export default function BlocklyEditor() {
  const [code, setCode] = useState<string>("");

  useEffect(() => {
    const onCode = (e: Event) => {
      const ce = e as CustomEvent<{ code: string }>;
      setCode(ce.detail.code ?? "");
    };
    window.addEventListener("blockly:code", onCode);
    return () => window.removeEventListener("blockly:code", onCode);
  }, []);

  const onRun = useCallback(() => {
    window.dispatchEvent(new CustomEvent("blockly:run"));
  }, []);

  return (
    <div className="h-full w-full">
      {/* ✅ Workspace lớn hơn, Code nhỏ hơn */}
      <div className="grid h-full w-full grid-cols-1 md:grid-cols-[2.3fr_1fr]">
        {/* LEFT */}
        <div className="flex h-full flex-col border-r">
          <div className="border-b px-2 py-1 text-sm font-semibold text-zinc-700">
            Workspace
          </div>
          <div className="min-h-0 flex-1">
            <BlocklyWorkspace />
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b px-2 py-1">
            <div className="text-sm font-semibold text-zinc-700">Code</div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-zinc-700">Language:</span>
              <select
                className="rounded-md border px-2 py-1 text-sm outline-none"
                defaultValue="js"
                disabled
              >
                <option value="js">JavaScript</option>
              </select>

              <button
                onClick={onRun}
                className="rounded-md bg-zinc-900 px-2 py-1 text-sm font-medium text-white"
              >
                Run ▶
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <CodePanel code={code} />
          </div>
        </div>
      </div>
    </div>
  );
}
