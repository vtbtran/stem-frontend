"use client";

import { useEffect, useState, useRef } from "react";
import { RobotController } from "@/lib/hardware/RobotController";
import { TransportType } from "@/lib/hardware/types";
import { AnimatePresence, motion } from "framer-motion";

export default function HardwareConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [transportType, setTransportType] = useState<TransportType>(TransportType.BLUETOOTH);
  const [ipAddress, setIpAddress] = useState("192.168.4.1");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Load saved settings
    const savedType = localStorage.getItem("robot-transport");
    if (savedType) setTransportType(savedType as TransportType);

    const savedIp = localStorage.getItem("robot-ip");
    if (savedIp) setIpAddress(savedIp);

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
          flex items-center justify-center w-8 h-8 rounded-full
          transition-all duration-300
          ${isConnected
            ? 'bg-emerald-500 hover:bg-emerald-400 text-white'
            : 'bg-blue-500 hover:bg-blue-400 text-white'
          }
          ${isConnecting ? 'opacity-50 cursor-wait' : ''}
          hover:shadow-lg
          disabled:opacity-50 disabled:cursor-not-allowed
        `}
      >
        <svg
          className={`w-4 h-4 ${isConnecting ? 'animate-spin' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2.5}
        >
          {isConnecting ? (
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          ) : isConnected ? (
            // Connected Icon
            transportType === TransportType.WIFI
              ? <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
              : <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101" />
          ) : (
            // Disconnected Icon (Generic)
            <path strokeLinecap="round" strokeLinejoin="round" d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
          )}
        </svg>
      </button>

      {/* Config Popover */}
      <AnimatePresence>
        {showConfig && !isConnected && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-zinc-200 z-50 overflow-hidden"
          >
            <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-100">
              <h3 className="text-xs font-bold uppercase text-zinc-500 tracking-wider">
                Connection Setup
              </h3>
            </div>

            <div className="p-4 space-y-4">
              {/* Method Selector */}
              <div>
                <label className="block text-xs font-medium text-zinc-700 mb-1">Method</label>
                <div className="flex bg-zinc-100 rounded-lg p-1">
                  <button
                    onClick={() => setTransportType(TransportType.BLUETOOTH)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${transportType === TransportType.BLUETOOTH ? 'bg-white shadow-sm text-blue-600' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Bluetooth
                  </button>
                  <button
                    onClick={() => setTransportType(TransportType.WIFI)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${transportType === TransportType.WIFI ? 'bg-white shadow-sm text-blue-600' : 'text-zinc-500 hover:text-zinc-700'}`}
                  >
                    Wi-Fi
                  </button>
                </div>
              </div>

              {/* Wi-Fi IP Input */}
              {transportType === TransportType.WIFI && (
                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1">Robot IP Address</label>
                  <input
                    type="text"
                    value={ipAddress}
                    onChange={(e) => setIpAddress(e.target.value)}
                    placeholder="192.168.4.1"
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-300 font-mono transition-all"
                  />
                </div>
              )}

              {/* Connect Button */}
              <button
                onClick={handleConnect}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-sm shadow-blue-200 active:scale-[0.98] transition-all"
              >
                Connect {transportType === TransportType.BLUETOOTH ? 'Bluetooth' : 'Wi-Fi'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
