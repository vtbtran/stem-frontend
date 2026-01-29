"use client";

export default function CodePanel({ code, onChange }: { code: string, onChange?: (c: string) => void }) {
  return (
    <textarea
      className="h-full w-full resize-none bg-zinc-950 p-3 text-sm text-zinc-100 font-mono outline-none border-none"
      value={code}
      onChange={(e) => onChange?.(e.target.value)}
      spellCheck={false}
      placeholder="// Kéo block bên trái hoặc tự viết code..."
    />
  );
}
