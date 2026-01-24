"use client";

import React, { useEffect, useState, useRef } from "react";

export default function Stage() {
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [rotation, setRotation] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const [viewPosition, setViewPosition] = useState({ x: 0, y: 0 });
    const [stageSize, setStageSize] = useState({ w: 800, h: 600 });
    const [speechText, setSpeechText] = useState<string | null>(null);
    const [transitionDuration, setTransitionDuration] = useState(0.4);

    // Track stage size for dynamic culling
    useEffect(() => {
        if (!containerRef.current) return;
        const ro = new ResizeObserver((entries) => {
            const entry = entries[0];
            if (entry) {
                setStageSize({ w: entry.contentRect.width, h: entry.contentRect.height });
            }
        });
        ro.observe(containerRef.current);
        return () => ro.disconnect();
    }, []);

    // Calculate visible ticks range
    const minX = Math.floor((viewPosition.x - stageSize.w / 2) / 50) - 2;
    const maxX = Math.ceil((viewPosition.x + stageSize.w / 2) / 50) + 2;
    const minY = Math.floor((viewPosition.y - stageSize.h / 2) / 50) - 2;
    const maxY = Math.ceil((viewPosition.y + stageSize.h / 2) / 50) + 2;

    const xTicks = Array.from({ length: maxX - minX + 1 }, (_, i) => minX + i).filter(x => x !== 0);
    const yTicks = Array.from({ length: maxY - minY + 1 }, (_, i) => minY + i).filter(y => y !== 0);

    useEffect(() => {
        const handleMotion = (e: Event) => {
            const ce = e as CustomEvent<{ type: string; value: number | { val: number; dur: number } | { x: number; y: number } }>;
            const { type, value } = ce.detail;

            if (type === "MOTION_MOVE") {
                let steps = 0;
                let duration = 0.4;
                
                if (typeof value === 'number') {
                    steps = value;
                } else if (typeof value === 'object' && 'val' in value) {
                    steps = value.val;
                    duration = value.dur;
                }

                // Disable CSS transition, use JS animation instead
                setTransitionDuration(0);

                // Capture current position for animation
                setPosition(currentPos => {
                    const rad = (rotation * Math.PI) / 180;
                    const totalDist = steps * 50;
                    const startX = currentPos.x;
                    const startY = currentPos.y;
                    const endX = startX + totalDist * Math.cos(rad);
                    const endY = startY + totalDist * Math.sin(rad);
                    const durationMs = duration * 1000;
                    const startTime = performance.now();

                    const animate = (now: number) => {
                        const elapsed = now - startTime;
                        const progress = Math.min(elapsed / durationMs, 1);
                        // Ease-out cubic
                        const eased = 1 - Math.pow(1 - progress, 3);
                        
                        const newX = startX + (endX - startX) * eased;
                        const newY = startY + (endY - startY) * eased;
                        
                        setPosition({ x: newX, y: newY });

                        if (progress < 1) {
                            requestAnimationFrame(animate);
                        }
                    };
                    
                    requestAnimationFrame(animate);
                    return currentPos; // Return unchanged initially
                });

            } else if (type === "MOTION_TURN") {
                 let deg = 0;
                 let duration = 0.4;
                 if (typeof value === 'number') { deg = value; }
                 else if (typeof value === 'object' && 'val' in value) { deg = value.val; duration = value.dur; }
                 
                 setTransitionDuration(0);
                 const durationMs = duration * 1000;
                 const startTime = performance.now();
                 let animatedDeg = 0;

                 const animate = (now: number) => {
                     const elapsed = now - startTime;
                     const progress = Math.min(elapsed / durationMs, 1);
                     const eased = 1 - Math.pow(1 - progress, 3);
                     const newAnimDeg = deg * eased;
                     const delta = newAnimDeg - animatedDeg;
                     animatedDeg = newAnimDeg;
                     
                     setRotation(prev => prev + delta);

                     if (progress < 1) {
                         requestAnimationFrame(animate);
                     }
                 };
                 requestAnimationFrame(animate);

            } else if (type === "MOTION_GOTO" && typeof value === 'object' && 'x' in value) {
                 setTransitionDuration(0);
                 setPosition({ x: value.x, y: value.y });
            }
        };

        const handleLook = (e: Event) => {
            const ce = e as CustomEvent<{ action: string; value: { text: string; duration: number } }>;
            if (ce.detail.action === "say") {
                setSpeechText(ce.detail.value.text);
                setTimeout(() => setSpeechText(null), ce.detail.value.duration * 1000);
            }
        };

        window.addEventListener("blockly:stage_motion", handleMotion);
        window.addEventListener("blockly:stage_look", handleLook);

        return () => {
             window.removeEventListener("blockly:stage_motion", handleMotion);
             window.removeEventListener("blockly:stage_look", handleLook);
        };
    }, [rotation]);

    // Use ref to track position for camera follow (avoids stale closures)
    const positionRef = useRef(position);
    useEffect(() => { positionRef.current = position; }, [position]);

    useEffect(() => {
        // Camera Follow Logic - runs continuously at 60fps
        const checkCamera = () => {
            const pos = positionRef.current;
            setViewPosition(prev => {
                const dx = pos.x - prev.x;
                const dy = pos.y - prev.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                // Follow car closely (1px threshold, 30% lerp = very tight)
                if (dist > 1) {
                    return {
                        x: prev.x + dx * 0.3,
                        y: prev.y + dy * 0.3
                    };
                }
                return prev;
            });
        };
        const timer = setInterval(checkCamera, 16); // ~60fps
        return () => clearInterval(timer);
    }, []); // Empty deps = only created once!

    return (
        <div
            ref={containerRef}
            className="relative w-full h-full bg-white overflow-hidden border-b border-zinc-200 flex items-center justify-center"
        >
            {/* Grid Background (Dashed Lines) */}
            <div
                className="absolute inset-0 z-0 pointer-events-none transition-all duration-75 ease-linear will-change-transform"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='50' height='50' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 0 0 L 50 0' fill='none' stroke='rgba(239, 68, 68, 0.2)' stroke-width='1' stroke-dasharray='4 2'/%3E%3Cpath d='M 0 0 L 0 50' fill='none' stroke='rgba(59, 130, 246, 0.2)' stroke-width='1' stroke-dasharray='4 2'/%3E%3C/svg%3E")`,
                    backgroundSize: '50px 50px',
                    backgroundPosition: `calc(50% + 25px - ${viewPosition.x}px) calc(50% + 25px - ${viewPosition.y}px)`
                }}
            />

            {/* Transform Container for Camera (Pan) */}
            <div
                className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-linear will-change-transform"
                style={{ transform: `translate(${-viewPosition.x}px, ${-viewPosition.y}px)` }}
            >

                {/* Axis Lines & Markers */}
                <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-visible">
                    {/* Y-Axis (Blue) */}
                    <div className="absolute left-1/2 top-1/2 h-[2000000px] w-[2px] bg-blue-600 -translate-x-1/2 -translate-y-1/2">
                        {/* Ticks & Numbers */}
                        {yTicks.map((y) => (
                            <React.Fragment key={`y-${y}`}>
                                <div className="absolute left-1/2 w-2 h-[2px] bg-blue-400/30"
                                    style={{ top: `calc(50% + ${-y * 50}px)`, transform: 'translateX(-50%)' }} />
                                <span className="absolute left-3 text-[10px] font-mono text-blue-500 font-bold"
                                    style={{ top: `calc(50% + ${-y * 50}px)`, transform: 'translateY(-50%)' }}>
                                    {y}
                                </span>
                            </React.Fragment>
                        ))}
                        <span className="absolute left-3 top-0 text-[10px] font-black text-blue-600">Y</span>
                    </div>

                    {/* X-Axis (Red) */}
                    <div className="absolute top-1/2 left-1/2 w-[2000000px] h-[2px] bg-red-600 -translate-x-1/2 -translate-y-1/2">
                        {/* Ticks & Numbers */}
                        {xTicks.map((x) => (
                            <React.Fragment key={`x-${x}`}>
                                <div className="absolute top-1/2 h-2 w-[2px] bg-red-400/30 font-bold"
                                    style={{ left: `calc(50% + ${x * 50}px)`, transform: 'translateY(-50%)' }} />
                                <span className="absolute top-3 text-[10px] font-mono text-red-500 font-bold"
                                    style={{ left: `calc(50% + ${x * 50}px)`, transform: 'translateX(-50%)' }}>
                                    {x}
                                </span>
                            </React.Fragment>
                        ))}
                        <span className="absolute right-0 top-3 text-[10px] font-black text-red-600">X</span>
                    </div>
                    
                    {/* Origin Label (0) */}
                    <span className="absolute left-1/2 top-1/2 -translate-x-[120%] translate-y-[20%] text-[10px] font-black text-zinc-500">
                        0
                    </span>
                </div>

                {/* Projection Lines (Car to Axes) */}
                <div className="absolute inset-0 pointer-events-none z-0">
                    {/* Horizontal Line to Y-axis (Red dashed, parallel to X) */}
                    <div 
                        className="absolute h-[2px] border-b-2 border-dashed border-red-500"
                        style={{
                            left: position.x > 0 ? '50%' : `calc(50% + ${position.x}px)`,
                            width: Math.abs(position.x),
                            top: `calc(50% + ${position.y}px)`,
                        }}
                    />
                    {/* Vertical Line to X-axis (Blue dashed, parallel to Y) */}
                    <div 
                        className="absolute w-[2px] border-l-2 border-dashed border-blue-500"
                        style={{
                            top: position.y > 0 ? '50%' : `calc(50% + ${position.y}px)`,
                            height: Math.abs(position.y),
                            left: `calc(50% + ${position.x}px)`,
                        }}
                    />
                </div>

                {/* Sprite */}
                <div
                    className="absolute ease-out z-10"
                    style={{
                        transform: `translate(${position.x}px, ${position.y}px) rotate(${rotation}deg)`,
                        transitionDuration: `${transitionDuration}s`,
                        transitionProperty: 'transform'
                    }}
                >
                    <div className="relative group">
                        {/* Speech Bubble */}
                        {speechText && (
                            <div className="absolute -top-20 left-1/2 -translate-x-1/2 bg-white text-zinc-800 text-[12px] px-3 py-2 rounded-2xl shadow-lg border border-zinc-200 z-30 whitespace-nowrap min-w-[60px] text-center"
                                 style={{ transform: `translateX(-50%) rotate(${-rotation}deg)` }}
                            >
                                {speechText}
                                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-b border-r border-zinc-200 rotate-45 transform" />
                            </div>
                        )}

                        <div className="w-12 h-12 flex items-center justify-center">
                            <img
                                src="/car.svg"
                                alt="Car sprite"
                                className="w-full h-full object-contain drop-shadow-md"
                            />
                        </div>

                        {/* Coordinates Label */}
                        <div
                            className="absolute -top-7 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[9px] px-2 py-1 rounded-full font-mono font-bold whitespace-nowrap shadow-sm z-20"
                            style={{ transform: `translateX(-50%) rotate(${-rotation}deg)` }}
                        >
                            ({Math.round(position.x / 50)}, {Math.round(-position.y / 50)})
                        </div>

                        <div className="absolute top-1/2 left-full w-4 h-0.5 bg-red-400 -translate-y-1/2" />
                    </div>
                </div>



            </div>

            {/* Info Overlay (Fixed on Screen) */}
            <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] font-mono text-zinc-400 bg-white/80 px-2 py-0.5 rounded shadow-sm border border-zinc-100 z-50">
                <span>X: {Math.round(position.x / 50)}</span>
                <span>Y: {Math.round(-position.y / 50)}</span>
                <span>DIR: {Math.round(rotation)}°</span>
            </div>
        </div>
    );
}
