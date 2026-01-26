"use client";

import { useState } from "react";
import { RobotController } from "@/lib/hardware/RobotController";
import { TransportType } from "@/lib/hardware/types";

export default function HardwareConnect() {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    const controller = RobotController.getInstance();
    const success = await controller.connect(TransportType.BLUETOOTH);
    setIsConnected(success);
    setIsConnecting(false);
  };

  const handleDisconnect = async () => {
    const controller = RobotController.getInstance();
    await controller.disconnect();
    setIsConnected(false);
  };

  return (
    <button
      onClick={isConnected ? handleDisconnect : handleConnect}
      disabled={isConnecting}
      title={isConnecting ? 'Đang kết nối...' : isConnected ? 'Ngắt kết nối Bluetooth' : 'Kết nối Bluetooth'}
      className={`
        flex items-center justify-center w-8 h-8 rounded-full
        transition-all duration-300
        ${isConnected 
          ? 'bg-emerald-500 hover:bg-emerald-400 text-white' 
          : 'bg-blue-500 hover:bg-blue-400 text-white'
        }
        ${isConnecting ? 'opacity-50 cursor-wait' : 'hover:shadow-lg'}
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
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
        ) : (
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        )}
      </svg>
    </button>
  );
}
