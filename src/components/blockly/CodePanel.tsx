"use client";

type Props = { code: string };

export default function CodePanel({ code }: Props) {
  return (
    <pre className="h-full w-full overflow-auto bg-zinc-950 p-3 text-sm text-zinc-100">
      <code>{code?.trim() ? code : "// Kéo block bên trái để sinh code..."}</code>
    </pre>
  );
}
