"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";

export default function CameraWindow({ onClose }: { onClose: () => void }) {
    const [url, setUrl] = useState("http://192.168.4.1:81/stream");
    const [isEditing, setIsEditing] = useState(false);
    const [imgKey, setImgKey] = useState(0); // Force reload image
    const containerRef = useRef<HTMLDivElement>(null);

    const handleRefresh = () => {
        setImgKey((prev) => prev + 1);
    };

    return (
        <motion.div
            ref={containerRef}
            className="absolute z-50 rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden bg-slate-900 group flex flex-col"
            initial={{ opacity: 0, scale: 0.8, x: 200, y: 100 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            drag
            dragMomentum={false}
            style={{
                width: "320px",
                height: "240px",
                top: '80px',
                left: '20px',
            }}
        >
            {/* Header */}
            <div
                className="h-7 bg-white/10 backdrop-blur-md flex items-center justify-between px-2 text-[9px] font-bold text-white/70 uppercase tracking-widest z-10 select-none cursor-move"
                onPointerDown={(e) => {
                    // Allow drag logic from framer-motion to kick in
                }}
            >
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                    <span>Robot Camera</span>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={handleRefresh} className="hover:text-white" title="Reload Stream">↻</button>
                    <button onClick={() => setIsEditing(!isEditing)} className="hover:text-white" title="Settings">⚙</button>
                    <button onClick={onClose} className="hover:text-red-400" title="Close">✕</button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                {/* Stream Image (MJPEG) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={imgKey}
                    src={url}
                    alt="Camera Stream"
                    className="w-full h-full object-contain pointer-events-none select-none"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                    onLoad={(e) => {
                        e.currentTarget.style.display = 'block';
                    }}
                />

                {/* Placeholder when no stream */}
                <div className="absolute inset-0 flex items-center justify-center -z-10 text-zinc-600 text-xs">
                    Waiting for stream...
                </div>

                {/* Settings Overlay */}
                {isEditing && (
                    <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center p-4 z-20">
                        <label className="text-white text-xs mb-1">Stream URL (MJPEG)</label>
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            className="w-full bg-zinc-800 border-zinc-700 text-white text-xs px-2 py-1 rounded mb-2"
                        />
                        <button
                            onClick={() => { setIsEditing(false); handleRefresh(); }}
                            className="bg-blue-600 text-white text-xs px-3 py-1 rounded hover:bg-blue-500"
                        >
                            Save & Reload
                        </button>
                        <div className="text-[9px] text-zinc-500 mt-2 text-center">
                            Note: Ensure the robot is on the same network or acting as AP.
                        </div>
                    </div>
                )}
            </div>

            {/* Resize Handle (Optional - keep fixed size for now or add logic similar to Simulator) */}
        </motion.div>
    );
}
