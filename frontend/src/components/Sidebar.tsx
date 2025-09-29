"use client";

import { useState } from "react";

const chatMessages = [
  {
    id: 1,
    username: "DaddyDSW",
    level: "13",
    message: "😮",
    avatar: "🦜",
  },
  {
    id: 2,
    username: "payday",
    level: "8",
    message: "Why are you talking to yourself",
    avatar: "👨‍🚀",
  },
  {
    id: 3,
    username: "Ricardo",
    level: "20",
    message: "can someone tip me 0.005 for fee?",
    avatar: "👨‍🚀",
  },
];

export default function Sidebar() {
  const [message, setMessage] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <>
      {/* Mobile toggle button */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="lg:hidden fixed top-20 left-4 z-50 bg-gray-800 text-white p-2 rounded-lg"
      >
        ☰
      </button>

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-16 h-[calc(100vh-4rem)] bg-gradient-to-b from-[#0a0a0f] via-gray-900 to-black border-r border-purple-500/20 transition-transform duration-300 z-40 backdrop-blur-sm ${
          isCollapsed ? "-translate-x-full lg:translate-x-0" : "translate-x-0"
        } w-80 lg:w-80`}
      >
        <div className="flex flex-col h-full pt-4">
          {/* Airdrop Section */}
          <div className="p-3">
            <div className="relative bg-black border-2 border-transparent rounded-lg p-3 mb-3">
              {/* Gradient border effect */}
              <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 p-[2px]">
                <div className="h-full w-full rounded-lg bg-black"></div>
              </div>
              
              <div className="relative z-10">
                {/* AIRDROP text centered above content */}
                <div className="text-center mb-2">
                  <h2 className="text-xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent tracking-wider">
                    AIRDROP
                  </h2>
                </div>

                {/* Main content row */}
                <div className="flex items-center space-x-1.5 mb-2">
                  {/* Display field with Solana logo and value */}
                  <div className="flex items-center bg-gray-900 rounded-md px-2 py-1.5 flex-1">
                    <div className="w-5 h-5 bg-purple-500/20 rounded-full flex items-center justify-center mr-1.5">
                      <span className="text-purple-400 text-xs font-bold">S</span>
                    </div>
                    <span className="text-white text-base font-bold price-text">0.06</span>
                  </div>
                  
                  {/* Action button */}
                  <button className="bg-purple-600 hover:bg-purple-500 rounded-md p-1.5 transition-colors duration-200">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </button>
                  
                  {/* Timer */}
                  <div className="text-gray-300 text-sm font-mono font-bold price-text">
                    56:29
                  </div>
                </div>

                {/* Progress bar */}
                <div className="w-full h-0.5 bg-gray-800 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full" style={{width: '45%'}}></div>
                </div>
              </div>
            </div>
          </div>

          {/* Chat Section */}
          <div className="flex-1 flex flex-col px-3">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-2 mb-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="flex items-start space-x-2 p-2 hover:bg-gray-800/30 rounded-lg transition-colors duration-200">
                  {/* Avatar */}
                  <div className="w-8 h-8 bg-gray-700 rounded-lg flex items-center justify-center text-sm flex-shrink-0">
                    {msg.avatar}
                  </div>
                  
                  {/* Message Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-white font-semibold text-sm">
                        {msg.username}
                      </span>
                      <span className="bg-gray-600 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                        {msg.level}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">
                      {msg.message}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Chat Paused Indicator */}
            <div className="flex items-center space-x-2 mb-3 p-2 bg-gray-800/50 rounded-lg">
              <div className="w-1 h-4 bg-gradient-to-b from-orange-400 to-yellow-400 rounded-full"></div>
              <div className="flex items-center space-x-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="6" y="4" width="4" height="16"/>
                  <rect x="14" y="4" width="4" height="16"/>
                </svg>
                <span className="text-white text-sm font-medium">Chat paused</span>
              </div>
            </div>

            {/* Chat Input Area */}
            <div className="mb-3">
              {/* Channel Selector */}
              <div className="flex items-center justify-between mb-2">
                <button className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 rounded-lg px-3 py-2 transition-colors duration-200">
                  <span className="text-white text-sm font-medium">Russian Chat</span>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,9 12,15 18,9"/>
                  </svg>
                </button>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                  <span className="text-white text-sm font-medium">213</span>
                </div>
              </div>

              {/* Message Input */}
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type message..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors duration-200"
                />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
                  <button className="w-6 h-6 bg-gray-600 hover:bg-gray-500 rounded flex items-center justify-center transition-colors duration-200">
                    <span className="text-xs">😊</span>
                  </button>
                  <button className="w-6 h-6 bg-purple-600 hover:bg-purple-500 rounded flex items-center justify-center transition-colors duration-200">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22,2 15,22 11,13 2,9 22,2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Total Bets */}
            <div className="text-center py-3 border-t border-gray-800/50">
              <div className="text-white font-bold text-lg">
                2,651,263
              </div>
              <div className="text-gray-400 text-sm">
                Total Bets
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Overlay for mobile */}
      {!isCollapsed && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </>
  );
}
