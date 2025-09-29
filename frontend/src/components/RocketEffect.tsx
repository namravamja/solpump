"use client";

import { useRef } from "react";
import Rocket from "./Rocket/Rocket";

function RocketComponent() {
  const currentMultiplier = 1.2;
  const rocketPosition = 20; // Static position
  const multiplierScaleRef = useRef<HTMLDivElement>(null);
  
  // Speed control array - you can customize this for different rocket behaviors
  // The path is divided into array.length equal segments, each with its own speed
  
  // Dynamic speed pattern based on multiplier (more realistic for a crash game)
  const getSpeedPattern = (multiplier: number) => {
    if (multiplier < 1.1) {
      // Low multiplier: Slow and steady
      return [0.8, 1.0, 1.2, 0.9, 0.7];
    } else if (multiplier < 2.0) {
      // Medium multiplier: Moderate speed with some variation
      return [6, 6.2, 6.8, 7, 7.5];
    } else {
      // High multiplier: Fast and dramatic
      return [1.5, 2.5, 3.0, 2.0, 0.5];
    }
  };
  
  const speedArray = getSpeedPattern(currentMultiplier);
  
  // Alternative static patterns you can try:
  // const speedArray = [1, 1, 1, 1, 1]; // Constant speed (original behavior)
  // const speedArray = [2, 1.5, 1, 0.5, 0]; // Fast start, gradual slowdown
  // const speedArray = [0.3, 0.8, 1.5, 2.5, 1.8]; // Gradual acceleration
  // const speedArray = [1, 2, 1, 2, 1]; // Alternating fast/slow pattern
  
  const totalDuration = 8; // Total animation duration in seconds

  return (
    <div className="absolute top-0 left-0 right-0 h-3/4 pointer-events-none overflow-hidden m-4 bg-gradient-to-br from-gray-900/50 to-black/50 backdrop-blur-sm rounded-2xl border border-gray-700/30">
      {/* Enhanced Grid Background - Only for Rocket Area */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Main Grid */}
        <div
          className="w-full h-full opacity-60"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168, 85, 247, 0.8) 2px, transparent 2px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.8) 2px, transparent 2px)
            `,
            backgroundSize: "50px 50px, 50px 50px",
            transform: "perspective(1000px) rotateX(70deg)",
            transformOrigin: "center bottom",
          }}
        />

        {/* Secondary Grid for Depth */}
        <div
          className="w-full h-full opacity-40"
          style={{
            backgroundImage: `
              linear-gradient(rgba(59, 130, 246, 0.6) 1px, transparent 1px),
              linear-gradient(90deg, rgba(59, 130, 246, 0.6) 1px, transparent 1px)
            `,
            backgroundSize: "100px 100px, 100px 100px",
            transform: "perspective(1000px) rotateX(70deg)",
            transformOrigin: "center bottom",
          }}
        />

        {/* Extended Grid for Sides */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: `
              linear-gradient(rgba(168, 85, 247, 0.5) 1px, transparent 1px),
              linear-gradient(90deg, rgba(168, 85, 247, 0.5) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px, 40px 40px",
            transform: "perspective(1000px) rotateX(70deg)",
            transformOrigin: "center bottom",
            width: "120%",
            left: "-10%",
          }}
        />

        {/* Ambient Glow */}
        <div
          className="w-full h-full opacity-15"
          style={{
            background: `
              radial-gradient(ellipse at center bottom, 
                rgba(168, 85, 247, 0.2) 0%, 
                transparent 70%
              )
            `,
          }}
        />
      </div>

      {/* Rocket Component */}
      <Rocket
        position={rocketPosition}
        multiplierScaleRef={multiplierScaleRef}
        speedArray={speedArray}
        totalDuration={totalDuration}
        flameIntensity={1.2}
        smokeDensity={1.1}
      />

      {/* Current Multiplier Display */}
      <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center">
        <div className="text-white text-sm font-medium mb-1">
          CURRENT PAYOUT
        </div>
        <div className="text-2xl font-bold text-gray-200 drop-shadow-lg">
          {currentMultiplier.toFixed(2)}x
        </div>
        <div className="bg-green-600/20 border border-green-500/30 rounded px-3 py-1 mt-2 text-green-400 text-sm font-mono">
          +0.0000 SOL
        </div>
      </div>

      {/* Multiplier Scale Container */}
      <div
        ref={multiplierScaleRef}
        className="absolute right-4 top-0 bottom-0 text-right"
      >
        {/* Separate div for multiplier scale without changing styling */}
        <div className="h-full w-full">
          {/* Scale Values */}
          <div className="h-full flex flex-col justify-between">
            {[
              7.0, 6.5, 6.0, 5.5, 5.0, 4.5, 4.0, 3.5, 3.0, 2.5, 2.0, 1.5, 1.0,
              0.5, 0.0,
            ].map((value, index) => {
              const isMajorTick = value % 1 === 0;
              const isHalfTick = value % 1 === 0.5;
              const isActive = currentMultiplier >= value;

              return (
                <div key={value} className="flex items-center justify-end">
                  {/* Tick Mark */}
                  <div
                    className={`mr-2 ${
                      isMajorTick ? "w-8" : isHalfTick ? "w-6" : "w-4"
                    } h-px ${isActive ? "bg-white" : "bg-gray-500"}`}
                    style={{
                      opacity: isActive ? 1 : 0.6,
                    }}
                  />

                  {/* Value Label */}
                  <div
                    className={`font-mono text-xs ${
                      isActive ? "text-white font-bold" : "text-gray-400"
                    }`}
                    style={{
                      opacity: isActive ? 1 : 0.7,
                      fontSize: isMajorTick ? "12px" : "10px",
                      fontWeight: isMajorTick ? "bold" : "normal",
                    }}
                  >
                    {value.toFixed(1)}x
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RocketEffect() {
  return (
    <div className="absolute inset-0 bg-black overflow-hidden">
      {/* Rocket Component */}
      <RocketComponent />
    </div>
  );
}
