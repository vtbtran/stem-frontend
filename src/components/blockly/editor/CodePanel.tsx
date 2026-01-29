"use client";

export default function CodePanel({ code, onChange }: { code: string, onChange?: (c: string) => void }) {
  return (
    <div className="relative w-full h-full group">
      <textarea
        className="h-full w-full resize-none bg-transparent p-4 text-sm text-slate-200 font-mono outline-none border-none placeholder:text-slate-600 leading-relaxed selection:bg-blue-500/30 relative z-10"
        value={code}
        onChange={(e) => onChange?.(e.target.value)}
        spellCheck={false}
        placeholder="// Kéo block bên trái hoặc tự viết code..."
      />
      <div className="absolute bottom-3 right-4 text-[10px] text-slate-600 font-mono pointer-events-none opacity-60 select-none group-hover:opacity-100 transition-opacity flex gap-3">
        <span><span className="font-bold text-slate-500">Ctrl + Enter</span> to Run</span>
        <span><span className="font-bold text-slate-500">Ctrl + S</span> to Save</span>
      </div>
    </div>
  );
}
