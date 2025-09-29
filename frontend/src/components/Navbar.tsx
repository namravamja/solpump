"use client";

import { useState } from "react";

// Custom SVG Icons
const TrendingUpIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23,6 13.5,15.5 8.5,10.5 1,18"/>
    <polyline points="17,6 23,6 23,12"/>
  </svg>
);

const CoinsIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M18.09 10.37A6 6 0 1 1 7.78 7.78"/>
    <path d="M7 6h1v4"/>
    <path d="M9.5 10.5L11 9"/>
  </svg>
);

const BarChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="20" x2="12" y2="10"/>
    <line x1="18" y1="20" x2="18" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="16"/>
  </svg>
);

const WalletIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/>
    <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
  </svg>
);

export default function Navbar() {
  const [activeTab, setActiveTab] = useState("crash");

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 w-full bg-black border-b border-gray-800">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center">
          <div className="text-4xl font-bold tracking-wider font-sans">
            <span className="text-purple-400 drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]">
              SOL
            </span>
            <span className="text-white drop-shadow-[0_0_8px_rgba(168,85,247,0.2)]">
              PUMP
            </span>
          </div>
        </div>

        {/* Navigation Items - positioned close to logo */}
        <div className="flex items-center space-x-6 ml-8">
          {/* Crash - Active */}
          <button
            onClick={() => setActiveTab("crash")}
            className="flex items-center space-x-3 px-4 py-2 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">
              <TrendingUpIcon />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-white font-medium text-base font-sans">Crash</span>
              <span className="text-purple-400 text-sm font-bold price-text">2.00x</span>
            </div>
          </button>

          {/* Coinflip - Inactive */}
          <button
            onClick={() => setActiveTab("coinflip")}
            className="flex items-center space-x-3 px-4 py-2 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
              <CoinsIcon />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-400 font-medium text-base font-sans">Coinflip</span>
              <span className="text-gray-400 text-sm price-text">17 Flips</span>
            </div>
          </button>

          {/* Futures - Inactive */}
          <button
            onClick={() => setActiveTab("futures")}
            className="flex items-center space-x-3 px-4 py-2 transition-all duration-300"
          >
            <div className="w-10 h-10 rounded-lg bg-gray-600 flex items-center justify-center">
              <BarChartIcon />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-gray-400 font-medium text-base font-sans">Futures</span>
              <span className="text-gray-400 text-sm font-sans">Coming soon</span>
            </div>
          </button>
        </div>

        {/* Connect Button */}
        <div className="ml-auto">
          <button className="group relative bg-green-600 hover:bg-green-500 border border-green-500 hover:border-green-400 text-white px-6 py-2.5 rounded-lg font-medium transition-all duration-200 hover:shadow-lg hover:shadow-green-500/20 font-sans flex items-center space-x-2">
            <WalletIcon />
            <span>Connect Wallet</span>
            <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-green-400/20 to-emerald-400/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
          </button>
        </div>
      </div>
    </nav>
  );
}
