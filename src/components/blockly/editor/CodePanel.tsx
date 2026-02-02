"use client";

import { Highlight, themes } from "prism-react-renderer";
import { useRef, useEffect, useState } from "react";

// Map language codes to Prism language names
const LANGUAGE_MAP: Record<string, string> = {
  js: "javascript",
  py: "python",
  cpp: "cpp",
};

interface CodePanelProps {
  code: string;
  language?: "js" | "py" | "cpp";
  onChange?: (code: string) => void;
}

export default function CodePanel({ code, language = "py", onChange }: CodePanelProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Sync scroll between textarea and syntax highlighted pre
  const handleScroll = () => {
    if (textareaRef.current) {
      setScrollTop(textareaRef.current.scrollTop);
    }
  };

  useEffect(() => {
    if (preRef.current) {
      preRef.current.scrollTop = scrollTop;
    }
  }, [scrollTop]);

  const prismLanguage = LANGUAGE_MAP[language] || "python";

  return (
    <div className="relative w-full h-full group overflow-hidden">
      {/* Syntax highlighted layer (background) */}
      <Highlight
        theme={themes.nightOwl}
        code={code || "// Kéo block bên trái hoặc tự viết code..."}
        language={prismLanguage}
      >
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            ref={preRef}
            className="absolute inset-0 p-4 m-0 text-sm font-mono leading-relaxed overflow-hidden pointer-events-none"
            style={{
              ...style,
              background: "transparent",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>

      {/* Editable textarea layer (transparent text, captures input) */}
      <textarea
        ref={textareaRef}
        className="absolute inset-0 h-full w-full resize-none bg-transparent p-4 text-sm font-mono outline-none border-none leading-relaxed z-10 caret-white selection:bg-blue-500/30"
        style={{
          color: "transparent",
          caretColor: "#e2e8f0",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
        value={code}
        onChange={(e) => onChange?.(e.target.value)}
        onScroll={handleScroll}
        spellCheck={false}
        placeholder=""
      />

      {/* Keyboard shortcuts hint */}
      <div className="absolute bottom-3 right-4 text-[10px] text-slate-600 font-mono pointer-events-none opacity-60 select-none group-hover:opacity-100 transition-opacity flex gap-3 z-20">
        <span><span className="font-bold text-slate-500">Ctrl + Enter</span> to Run</span>
        <span><span className="font-bold text-slate-500">Ctrl + S</span> to Save</span>
      </div>
    </div>
  );
}
