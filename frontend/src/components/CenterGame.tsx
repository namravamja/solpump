"use client";

import { useState } from "react";
import RocketEffect from "./RocketEffect";

const multiplierScale = [
  "7.00x",
  "6.00x",
  "5.00x",
  "4.00x",
  "3.00x",
  "2.00x",
  "1.50x",
  "1.20x",
  "1.10x",
  "1.05x",
  "1.02x",
  "1.01x",
  "0.00x",
];

const livePlayers = [
  { username: "Risktakerz", bet: "0.1000", status: "JOINED" },
  { username: "EinSteiner", bet: "0.0100", status: "JOINED" },
  { username: "Finito", bet: "0.0080", status: "JOINED" },
  { username: "CryptoKing", bet: "0.0050", status: "IN-PLAY" },
  { username: "MoonWalker", bet: "0.0030", status: "IN-PLAY" },
];

export default function CenterGame() {
  const [betAmount, setBetAmount] = useState("0");
  const [autoCashout, setAutoCashout] = useState("0.00");
  const [advancedBetting, setAdvancedBetting] = useState(false);
  const [gameState, setGameState] = useState("countdown");
  const [countdown, setCountdown] = useState(9);

  const totalPlayers = livePlayers.length;
  const totalBet = livePlayers
    .reduce((sum, player) => sum + Number.parseFloat(player.bet), 0)
    .toFixed(4);

  return (
    <div className="flex-1 flex bg-black min-h-screen overflow-hidden">
      {/* Left Panel - Bet Controls */}
      <div className="w-64 bg-gray-900/90 backdrop-blur-sm border-r border-gray-800 flex flex-col overflow-hidden h-3/4 mt-4">
        {/* Bet Amount Section */}
        <div className="p-5 border-b border-gray-800">
          <div className="mb-5">
            <label className="block text-gray-300 text-xs font-medium mb-2">
              Bet Amount ($0.00)
            </label>
            <div className="relative">
              <input
                type="text"
                value={betAmount}
                onChange={(e) => setBetAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                placeholder="0"
              />
              <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                <div className="w-5 h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-xs">S</span>
                </div>
              </div>
            </div>
            <div className="flex space-x-2 mt-2">
              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors">
                1/2
              </button>
              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors">
                2x
              </button>
              <button className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors">
                MAX
              </button>
            </div>
          </div>

          {/* Auto Cashout */}
          <div className="mb-5">
            <label className="block text-gray-300 text-xs font-medium mb-2">
              Auto Cashout
            </label>
            <div className="relative">
              <input
                type="text"
                value={`X ${autoCashout}`}
                onChange={(e) =>
                  setAutoCashout(e.target.value.replace("X ", ""))
                }
                className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white font-mono text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none"
                placeholder="X 0.00"
              />
              <button className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-sm">
                ✕
              </button>
            </div>
          </div>

          {/* Place Bet Button */}
          <button className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-500 hover:via-purple-600 hover:to-pink-500 text-white font-bold text-sm py-3 rounded transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 mb-4">
            PLACE BET
          </button>

          {/* Advanced Betting Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-gray-300 text-xs font-medium">
              ADVANCED BETTING
            </span>
            <button
              onClick={() => setAdvancedBetting(!advancedBetting)}
              className={`relative w-10 h-5 rounded-full transition-colors ${
                advancedBetting ? "bg-purple-600" : "bg-gray-700"
              }`}
            >
              <div
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                  advancedBetting ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Players Section */}
        <div className="flex-1 p-5 overflow-y-auto">
          <div className="mb-4">
            <div className="text-gray-300 text-xs mb-1">
              <span className="font-bold text-white">{totalPlayers}</span>{" "}
              Playing
            </div>
            <div className="text-gray-300 text-xs">
              Total: <span className="font-bold text-white">{totalBet}</span>
            </div>
          </div>

          <div className="space-y-2">
            {livePlayers.map((player, index) => (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded p-3 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div>
                    <div className="text-white text-xs font-medium">
                      {player.username}
                    </div>
                    <div className="text-gray-400 text-xs">{player.bet}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 font-medium">
                  {player.status}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Center Game Area */}
      <div className="flex-1 relative bg-gradient-to-br from-purple-900/20 via-black to-black overflow-hidden pt-6 mt-4">
        {/* 3D Grid Background */}
        <div className="absolute inset-0 opacity-20 overflow-hidden">
          <div
            className="w-full h-full"
            style={{
              backgroundImage: `
              linear-gradient(rgba(168, 85, 247, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.1) 1px, transparent 1px),
              radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.05) 0%, transparent 70%)
            `,
              backgroundSize: "50px 50px, 50px 50px, 200px 200px",
              transform: "perspective(1000px) rotateX(60deg)",
              transformOrigin: "center bottom",
            }}
          />
        </div>

        {/* Rocket Effect Component */}
        <RocketEffect />
      </div>
    </div>
  );
}
