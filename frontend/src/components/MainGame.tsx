"use client";

import CenterGame from "./CenterGame";

const pastMultipliers = [
  { value: "103.98x", color: "gold" },
  { value: "10.81x", color: "gold" },
  { value: "16.72x", color: "gold" },
  { value: "5.86x", color: "purple" },
  { value: "3.55x", color: "purple" },
  { value: "2.45x", color: "green" },
  { value: "2.46x", color: "green" },
  { value: "1.92x", color: "green" },
  { value: "1.41x", color: "gray" },
  { value: "1.00x", color: "gray" },
  { value: "1.12x", color: "gray" },
  { value: "1.17x", color: "gray" },
  { value: "3.72x", color: "purple" },
];

export default function MainGame() {
  const getMultiplierColor = (color: string) => {
    switch (color) {
      case "gold":
        return "bg-gradient-to-r from-yellow-400 via-yellow-500 to-orange-500 text-black font-bold";
      case "purple":
        return "bg-gradient-to-r from-purple-500 via-purple-600 to-purple-700 text-white font-bold";
      case "green":
        return "bg-gradient-to-r from-green-500 via-green-600 to-green-700 text-white font-bold";
      case "gray":
        return "bg-gradient-to-r from-gray-600 via-gray-700 to-gray-800 text-gray-300 font-bold";
      default:
        return "bg-gray-600 text-white font-bold";
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-black min-h-screen overflow-hidden">
      <div className="text-left px-2 sm:px-4 lg:pl-6 pt-2 sm:pt-4 lg:pt-6">
        <h1 className="text-white text-base sm:text-lg lg:text-2xl font-bold">
          SOLPUMP: SOLANA'S MOST TRUSTED SOLANA CASINO
        </h1>
      </div>

      <div className="flex justify-start py-2 px-2 sm:px-4 lg:pl-6 overflow-x-auto">
        <div className="flex space-x-1 lg:space-x-2 flex-wrap">
          {pastMultipliers.map((multiplier, index) => (
            <div
              key={index}
              className={`px-2 sm:px-3 lg:px-4 py-1 lg:py-2 rounded text-xs lg:text-sm font-bold whitespace-nowrap ${getMultiplierColor(
                multiplier.color
              )}`}
            >
              {multiplier.value}
            </div>
          ))}
        </div>
      </div>

      {/* Center Game Component */}
      <CenterGame />
    </div>
  );
}
