"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";

export default function CameraWindow({ onClose }: { onClose: () => void }) {
    const [url, setUrl] = useState(`http://${process.env.NEXT_PUBLIC_DEFAULT_ROBOT_IP || "192.168.4.1"}:${process.env.NEXT_PUBLIC_CAMERA_STREAM_PORT || "81"}/stream`);
    const [isEditing, setIsEditing] = useState(false);
    const [imgKey, setImgKey] = useState(0); 
    const [size, setSize] = useState<{ w: number; h: number }>(() => {
        if (typeof window !== "undefined") {
            const saved = localStorage.getItem("camera-window-size");
            if (saved) {
                try {
                    const parsed = JSON.parse(saved);
                    if (parsed.w && parsed.h) return parsed;
                } catch (e) {
                    console.error("Failed to parse saved camera window size:", e);
                 }
            }
        }
        return { w: 320, h: 240 };
    });

    const containerRef = useRef<HTMLDivElement>(null);

    const handleRefresh = () => {
        setImgKey((prev) => prev + 1);
    };

    const saveSize = (s: { w: number, h: number }) => {
        setSize(s);
        localStorage.setItem("camera-window-size", JSON.stringify(s));
    };

    return (
        <motion.div
            ref={containerRef}
            className="absolute z-[70] rounded-xl shadow-2xl border-2 border-white/20 overflow-hidden bg-slate-900 group flex flex-col"
            initial={{ opacity: 0, scale: 0.8, x: 0, y: 0 }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            drag
            dragMomentum={false}
            style={{
                width: `${size.w}px`,
                height: `${size.h}px`,
                top: '360px',  // Default below simulator
                right: '32px', // Default to right side
                // Remove 'left' to avoid conflict with 'right'
            }}
        >
            {/* Header */}
            <div
                className="h-7 bg-white/10 backdrop-blur-md flex items-center justify-between px-2 text-[9px] font-bold text-white/70 uppercase tracking-widest z-10 select-none cursor-move"
                onPointerDown={(e) => {
                    console.log("Pointer down on header for dragging");
                    e.stopPropagation(); // Prevent resize drag
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
                {/* Placeholder when no stream */}
                <div className="absolute inset-0 flex flex-col items-center justify-center text-zinc-400 text-xs pointer-events-none">
                    <p>Waiting for stream...</p>
                    <p className="text-[10px] text-zinc-600 mt-1">{url}</p>
                </div>

                {/* Stream Image (MJPEG) */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={imgKey}
                    src={url}
                    alt="Camera Stream"
                    className="absolute inset-0 w-full h-full object-contain bg-black"
                    onError={(e) => {
                        e.currentTarget.style.opacity = '0';
                    }}
                    onLoad={(e) => {
                        e.currentTarget.style.opacity = '1';
                    }}
                />

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

            {/* Resize Handle: Bottom Right */}
            <div
                className="absolute bottom-0 right-0 w-6 h-6 cursor-nwse-resize z-20 group/handle"
                onPointerDown={(e) => {
                    e.stopPropagation(); // Prevent drag
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startW = size.w;
                    const startH = size.h;
                    
                    const onPointerMove = (moveEvent: PointerEvent) => {
                         const newW = Math.max(200, startW + (moveEvent.clientX - startX));
                         const newH = Math.max(150, startH + (moveEvent.clientY - startY));
                         setSize({ w: newW, h: newH });
                    };
                    const onPointerUp = () => {
                        window.removeEventListener('pointermove', onPointerMove);
                        window.removeEventListener('pointerup', onPointerUp);
                        saveSize({ 
                            w: Math.max(200, startW + (e.clientX - startX)), 
                            h: Math.max(150, startH + (e.clientY - startY)) 
                        });
                    };
                    window.addEventListener('pointermove', onPointerMove);
                    window.addEventListener('pointerup', onPointerUp);
                }}
            >
                <div className="absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full bg-white/20 group-hover/handle:bg-blue-400 transition-colors" />
            </div>
            
            {/* Resize Handle: Bottom Left */}
             <div
                className="absolute bottom-0 left-0 w-6 h-6 cursor-nesw-resize z-20 group/handle"
                onPointerDown={(e) => {
                    e.stopPropagation(); // Prevent drag
                    const startX = e.clientX;
                    const startY = e.clientY;
                    const startW = size.w;
                    const startH = size.h;
                    
                    const onPointerMove = (moveEvent: PointerEvent) => {
                         const newW = Math.max(200, startW - (moveEvent.clientX - startX));
                         const newH = Math.max(150, startH + (moveEvent.clientY - startY));
                         setSize({ w: newW, h: newH });
                    };
                    const onPointerUp = () => {
                        window.removeEventListener('pointermove', onPointerMove);
                        window.removeEventListener('pointerup', onPointerUp);
                        saveSize({ 
                             w: Math.max(200, startW - (e.clientX - startX)), 
                             h: Math.max(150, startH + (e.clientY - startY)) 
                        });
                    };
                    window.addEventListener('pointermove', onPointerMove);
                    window.addEventListener('pointerup', onPointerUp);
                }}
            >
                <div className="absolute bottom-1.5 left-1.5 w-2 h-2 rounded-full bg-white/20 group-hover/handle:bg-blue-400 transition-colors" />
            </div>

        </motion.div>
    );
}
