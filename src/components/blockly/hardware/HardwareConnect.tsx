"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { RobotController } from "@/lib/hardware/RobotController";
import { TransportType } from "@/lib/hardware/types";
import { AnimatePresence, motion } from "framer-motion";

export default function HardwareConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [transportType, setTransportType] = useState<TransportType>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("robot-transport");
      if (saved) return saved as TransportType;
    }
    return TransportType.SERIAL;
  });

  const [ipAddress, setIpAddress] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("robot-ip");
      if (saved) return saved;
    }
    return process.env.NEXT_PUBLIC_DEFAULT_ROBOT_IP || "192.168.4.1";
  });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Close config on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setShowConfig(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleConnect = async () => {
    setIsConnecting(true);
    // Save settings
    localStorage.setItem("robot-transport", transportType);
    localStorage.setItem("robot-ip", ipAddress);

    const controller = RobotController.getInstance();

    if (transportType === TransportType.WIFI) {
      controller.setIpAddress(ipAddress);
    }

    const success = await controller.connect(transportType);
    if (success) {
      console.log(`🚀 Hardware Connected via ${transportType}`);
    } else {
      console.error(`❌ Failed to connect via ${transportType}`);
    }
    setIsConnected(success);
    setIsConnecting(false);
    setShowConfig(false);
  };

  const handleDisconnect = async () => {
    const controller = RobotController.getInstance();
    await controller.disconnect();
    setIsConnected(false);
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => {
          if (isConnected) handleDisconnect();
          else setShowConfig(!showConfig);
        }}
        disabled={isConnecting}
        title={isConnected ? 'Ngắt kết nối' : 'Cấu hình kết nối'}
        className={`
          h-9 px-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all duration-200 shadow-sm border
          ${isConnected
            ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
            : 'bg-white text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
          }
          ${isConnecting ? 'opacity-75 cursor-wait' : ''}
        `}
      >
        {isConnecting ? (
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        ) : isConnected ? (
          transportType === TransportType.WIFI ? (
            <div className="w-5 h-5 bg-current transition-colors" style={{ maskImage: 'url("/icons/radio.png")', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url("/icons/radio.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
          ) : (
            <div className="w-5 h-5 bg-current transition-colors" style={{ maskImage: 'url("/icons/usb.png")', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url("/icons/usb.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
          )
        ) : (
          <div className="w-5 h-5 bg-current transition-colors" style={{ maskImage: 'url("/icons/link.png")', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url("/icons/link.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
        )}
        <span>{isConnected ? 'Đã kết nối' : 'Kết nối'}</span>
      </button>

      {/* Connection Config Popover */}
      <AnimatePresence>
        {showConfig && !isConnected && (
          <>
            {/* Invisible Backdrop (optional if we rely on click-outside) */}

            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] ring-1 ring-slate-200 z-[9999] origin-top-right overflow-visible"
            >
              {/* Caret (Triangle) */}
              <div className="absolute -top-1.5 right-4 w-3 h-3 bg-white border-t border-l border-slate-200 rotate-45 z-0" />

              <div className="relative z-10 flex flex-col p-5">
                {/* Header */}
                <div className="mb-5">
                  <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                    Cấu hình kết nối
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">Settings</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">Chọn phương thức giao tiếp với Onyx Robot của bạn.</p>
                </div>

                {/* Method Selector (Segmented Control) */}
                <div className="mb-5 space-y-2">
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block ml-1">Phương thức</label>
                  <div className="flex bg-slate-100 p-1 rounded-xl">
                    <button
                      onClick={() => setTransportType(TransportType.SERIAL)}
                      className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg transition-all duration-200 font-semibold text-sm ${transportType === TransportType.SERIAL
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                      <div className="w-4 h-4 bg-current" style={{ maskImage: 'url("/icons/usb.png")', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url("/icons/usb.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                      USB
                    </button>

                    <button
                      onClick={() => setTransportType(TransportType.WIFI)}
                      className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg transition-all duration-200 font-semibold text-sm ${transportType === TransportType.WIFI
                          ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5'
                          : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200/50'
                        }`}
                    >
                      <div className="w-4 h-4 bg-current" style={{ maskImage: 'url("/icons/radio.png")', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url("/icons/radio.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                      Wi-Fi
                    </button>
                  </div>
                </div>

                {/* Dynamic Content Area */}
                <div className="mb-6 min-h-[60px]">
                  <AnimatePresence mode="wait">
                    {transportType === TransportType.SERIAL ? (
                      <motion.div
                        key="serial"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ duration: 0.15 }}
                        className="p-3 bg-slate-50 border border-slate-100 rounded-xl"
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 text-blue-600">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-slate-700">Serial Port</h4>
                            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
                              Kết nối trực tiếp qua cáp USB. Đảm bảo driver CH340 đã được cài đặt.
                            </p>
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                              <span className="text-[10px] font-medium text-slate-400">Chưa chọn thiết bị</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="wifi"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.15 }}
                        className="space-y-3"
                      >
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">IP Address</label>
                          <div className="relative">
                            <input
                              type="text"
                              value={ipAddress}
                              onChange={(e) => setIpAddress(e.target.value)}
                              placeholder="192.168.4.1"
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono text-slate-700 font-bold placeholder:font-normal placeholder:text-slate-300 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" title="Ready to scan" />
                            </div>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 pl-1">
                          * Nhập địa chỉ IP hiển thị trên màn hình OLED của Robot.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer Actions */}
                <button
                  onClick={handleConnect}
                  disabled={isConnecting || (transportType === TransportType.WIFI && !ipAddress)}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-100 disabled:text-slate-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  {isConnecting ? (
                    <>
                      <svg className="w-4 h-4 animate-spin text-current" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span>Đang kết nối...</span>
                    </>
                  ) : (
                    <>
                      <span>Kết nối ngay</span>
                      <svg className="w-4 h-4 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
