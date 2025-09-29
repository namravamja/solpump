"use client";

import React, { useState } from "react";
import RocketWithExhaust from "./Rocket";

export default function SpeedControlExample() {
  const [speedArray, setSpeedArray] = useState([1, 2, 1, 0]);
  const [totalDuration, setTotalDuration] = useState(6);
  const [segmentCount, setSegmentCount] = useState(4);

  return (
    <div className="p-8 bg-gray-900 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Rocket Path Speed Control
        </h1>
        
        {/* Speed Controls */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Speed Array Controls</h2>
          
          {/* Segment Count Control */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Number of Segments: {segmentCount}
            </label>
            <input
              type="range"
              min="2"
              max="8"
              step="1"
              value={segmentCount}
              onChange={(e) => {
                const newCount = parseInt(e.target.value);
                setSegmentCount(newCount);
                // Adjust speed array to match new segment count
                const newArray = Array(newCount).fill(1);
                // Copy existing values if possible
                for (let i = 0; i < Math.min(newCount, speedArray.length); i++) {
                  newArray[i] = speedArray[i];
                }
                setSpeedArray(newArray);
              }}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-400 mt-1">
              Path will be divided into {segmentCount} equal segments
            </div>
          </div>

          {/* Speed Array Controls */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-4">
            {speedArray.map((speed, index) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Segment {index + 1}: {speed}x
                </label>
                <input
                  type="range"
                  min="0"
                  max="3"
                  step="0.1"
                  value={speed}
                  onChange={(e) => {
                    const newSpeed = parseFloat(e.target.value);
                    const newArray = [...speedArray];
                    newArray[index] = newSpeed;
                    setSpeedArray(newArray);
                  }}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-xs text-gray-400 mt-1">
                  {Math.round((index / segmentCount) * 100)}% - {Math.round(((index + 1) / segmentCount) * 100)}%
                </div>
              </div>
            ))}
          </div>

          {/* Total Duration Control */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Total Duration: {totalDuration}s
            </label>
            <input
              type="range"
              min="2"
              max="15"
              step="0.5"
              value={totalDuration}
              onChange={(e) => setTotalDuration(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-xs text-gray-400 mt-1">
              Total animation duration
            </div>
          </div>
        </div>

        {/* Preset Examples */}
        <div className="bg-gray-800 p-6 rounded-lg mb-8">
          <h2 className="text-xl font-semibold text-white mb-4">Preset Examples</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              onClick={() => {
                setSpeedArray([0.3, 1.5, 0.8]);
                setSegmentCount(3);
                setTotalDuration(8);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors"
            >
              Slow-Fast-Slow
            </button>
            
            <button
              onClick={() => {
                setSpeedArray([2.0, 1.0, 0.2]);
                setSegmentCount(3);
                setTotalDuration(6);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded transition-colors"
            >
              Fast-Normal-Slow
            </button>
            
            <button
              onClick={() => {
                setSpeedArray([1, 2, 1, 0]);
                setSegmentCount(4);
                setTotalDuration(7);
              }}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded transition-colors"
            >
              Normal-Fast-Normal-Stop
            </button>
            
            <button
              onClick={() => {
                setSpeedArray([0.5, 1, 1.5, 2, 0.3]);
                setSegmentCount(5);
                setTotalDuration(10);
              }}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors"
            >
              Gradual Acceleration
            </button>
          </div>
        </div>

        {/* Rocket Animation Area */}
        <div className="relative bg-gray-700 rounded-lg p-8 min-h-[500px] overflow-hidden">
          <div className="text-center text-gray-300 mb-4">
            Watch the rocket's speed change as it moves along the path!
          </div>
          
          <RocketWithExhaust
            speedArray={speedArray}
            totalDuration={totalDuration}
            flameIntensity={1.2}
            smokeDensity={1.1}
          />
        </div>

        {/* Instructions */}
        <div className="bg-gray-800 p-6 rounded-lg mt-8">
          <h2 className="text-xl font-semibold text-white mb-4">How to Use</h2>
          <ul className="text-gray-300 space-y-2">
            <li>• <strong>Speed Array:</strong> Pass an array like [1, 2, 1, 0] to control speed for each segment</li>
            <li>• <strong>Segment Count:</strong> Choose how many segments to divide the path into (2-8)</li>
            <li>• <strong>Speed Values:</strong> 0 = stop, 0.5 = half speed, 1 = normal speed, 2 = double speed</li>
            <li>• <strong>Path Division:</strong> Path is automatically divided equally based on array length</li>
            <li>• <strong>Example [1, 2, 1, 0]:</strong> Normal speed → Fast → Normal → Stop</li>
            <li>• <strong>Total Duration:</strong> Overall time for the complete path animation</li>
            <li>• Try the preset buttons to see different speed patterns!</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
