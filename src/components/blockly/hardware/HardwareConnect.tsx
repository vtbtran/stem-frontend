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
          h-9 px-3 rounded-lg font-bold text-sm flex items-center gap-2 transition-all duration-200 shadow-sm
          ${isConnected
            ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 hover:bg-emerald-100'
            : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
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

      {/* Connection Config Popup */}
      <AnimatePresence>
        {showConfig && !isConnected && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-zinc-200 z-[9999] overflow-hidden"
          >
            {/* Header */}
            <div className="px-4 py-3 border-b border-zinc-100">
              <h3 className="text-sm font-bold text-zinc-800 uppercase tracking-wide">Cấu hình kết nối</h3>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              {/* Method Selector */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-500">Phương thức</label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setTransportType(TransportType.SERIAL)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                      transportType === TransportType.SERIAL
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="w-4 h-4 bg-current" style={{ maskImage: 'url("/icons/usb.png")', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url("/icons/usb.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                    <span className="font-semibold text-sm">USB</span>
                  </button>

                  <button
                    onClick={() => setTransportType(TransportType.WIFI)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg border transition-all duration-150 ${
                      transportType === TransportType.WIFI
                        ? 'bg-blue-50 border-blue-500 text-blue-700'
                        : 'bg-white border-zinc-200 text-zinc-600 hover:border-zinc-300 hover:bg-zinc-50'
                    }`}
                  >
                    <div className="w-4 h-4 bg-current" style={{ maskImage: 'url("/icons/radio.png")', maskSize: 'contain', maskRepeat: 'no-repeat', maskPosition: 'center', WebkitMaskImage: 'url("/icons/radio.png")', WebkitMaskSize: 'contain', WebkitMaskRepeat: 'no-repeat', WebkitMaskPosition: 'center' }} />
                    <span className="font-semibold text-sm">Wi-Fi</span>
                  </button>
                </div>
              </div>

              {/* Wi-Fi Settings */}
              <AnimatePresence>
                {transportType === TransportType.WIFI && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-500">Địa chỉ IP Robot</label>
                      <input
                        type="text"
                        value={ipAddress}
                        onChange={(e) => setIpAddress(e.target.value)}
                        placeholder="192.168.4.1"
                        className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm font-mono text-zinc-800 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                disabled={isConnecting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {isConnecting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    <span>Đang kết nối...</span>
                  </>
                ) : (
                  <span>Kết nối {transportType === TransportType.SERIAL ? 'USB' : 'Wi-Fi'}</span>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

