import BlocklyEditor from "@/components/blockly/BlocklyEditor";

export default function Page() {
  return (
    <div className="flex flex-col h-screen w-screen bg-white">
      <main className="flex-1 min-h-0 w-full">
        <BlocklyEditor />
      </main>
      <footer className="h-12 w-full bg-zinc-100 border-t border-zinc-300 flex items-center justify-between px-4 flex-shrink-0">
        <div className="text-sm text-zinc-600">
          Blockly Workspace • Last saved: {new Date().toLocaleTimeString()}
        </div>
        <div className="text-sm text-zinc-500">
          © 2025 Rotbot
        </div>
      </footer>
    </div>
  );
}
