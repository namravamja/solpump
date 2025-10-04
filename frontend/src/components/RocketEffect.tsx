"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Rocket from "./Rocket/Rocket";

const RocketEffect = () => {
  const [animationKey, setAnimationKey] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);
  const [countdown, setCountdown] = useState(0);
  const [isNearCompletion, setIsNearCompletion] = useState(false);
  const [showBoomEffect, setShowBoomEffect] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [rocketPosition, setRocketPosition] = useState({ x: 0, y: 0 });
  const rocketRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    console.log("[v0] RocketEffect component mounted");
    return () => {
      console.log("[v0] RocketEffect component unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[v0] Animation state changed:", { isAnimating, animationKey });
  }, [isAnimating, animationKey]);

  // Timer to detect when animation is near completion (14.6 seconds to allow 1.4 seconds for fade out and boom)
  useEffect(() => {
    if (isAnimating) {
      setIsNearCompletion(false);
      const nearCompletionTimer = setTimeout(() => {
        console.log(
          "[v0] Animation near completion - starting 1.4s fade out and boom effect"
        );
        // Get the current rocket position
        if (rocketRef.current) {
          const rect = rocketRef.current.getBoundingClientRect();
          const containerRect =
            rocketRef.current.parentElement?.getBoundingClientRect();
          if (containerRect) {
            const relativeX = rect.left - containerRect.left;
            const relativeY = rect.top - containerRect.top;
            setRocketPosition({ x: relativeX, y: relativeY });
            console.log("[v0] Rocket position captured:", {
              x: relativeX,
              y: relativeY,
            });
          }
        }
        setIsNearCompletion(true);
        // Show red flash and boom effect simultaneously
        setShowRedFlash(true);
        setShowBoomEffect(true);

        // Hide red flash after 1.3 seconds while boom video continues
        setTimeout(() => {
          setShowRedFlash(false);
        }, 1300);
      }, 14600); // 14.6 seconds (allows 1.4 seconds for fade out and boom effect)

      return () => clearTimeout(nearCompletionTimer);
    }
  }, [isAnimating, animationKey]);

  const scaleValues = [
    { value: "7.00x", isMajor: true },
    { value: "6.75x", isMajor: false },
    { value: "6.50x", isMajor: true },
    { value: "6.25x", isMajor: false },
    { value: "6.00x", isMajor: true },
    { value: "5.75x", isMajor: false },
    { value: "5.50x", isMajor: true },
    { value: "5.25x", isMajor: false },
    { value: "5.00x", isMajor: true },
    { value: "4.75x", isMajor: false },
    { value: "4.50x", isMajor: true },
    { value: "4.25x", isMajor: false },
    { value: "4.00x", isMajor: true },
    { value: "3.75x", isMajor: false },
    { value: "3.50x", isMajor: true },
    { value: "3.25x", isMajor: false },
    { value: "3.00x", isMajor: true },
    { value: "2.75x", isMajor: false },
    { value: "2.50x", isMajor: true },
    { value: "2.25x", isMajor: false },
    { value: "2.00x", isMajor: true },
    { value: "1.75x", isMajor: false },
    { value: "1.50x", isMajor: true },
    { value: "1.25x", isMajor: false },
    { value: "1.00x", isMajor: true },
    { value: "0.75x", isMajor: false },
    { value: "0.00x", isMajor: true },
  ];

  // Handle animation completion and restart logic
  useEffect(() => {
    if (!isAnimating) {
      console.log("[v0] Starting countdown");
      // Reset near completion state and boom effect
      setIsNearCompletion(false);
      setShowBoomEffect(false);
      setShowRedFlash(false);
      // Start 8-second countdown
      setCountdown(8);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            console.log("[v0] Restarting animation");
            // Restart animation
            setAnimationKey((prev) => prev + 1);
            setIsAnimating(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(countdownInterval);
    }
  }, [isAnimating]);

  // Handle animation completion
  const handleAnimationComplete = () => {
    console.log("[v0] Animation completed");
    setIsAnimating(false);
  };

  return (
    <div className="relative h-full w-full flex justify-center items-start">
      <div className="relative w-[96%] h-[83%] border-4 border-gray-800 rounded-lg shadow-lg p-0 overflow-visible">
        {/* Background Video */}
        <video
          src="/floor.mp4"
          autoPlay
          loop
          muted
          playsInline
          controls={false}
          className="block w-full h-full object-cover rounded-lg"
          onLoadedData={() => console.log("[v0] Video loaded successfully")}
          onError={(e) => console.error("[v0] Video failed to load:", e)}
          onEnded={(e) => {
            console.log("[v0] Background video ended, restarting");
            const video = e.target as HTMLVideoElement;
            video.currentTime = 0;
            video.play();
          }}
          onPause={(e) => {
            console.log("[v0] Background video paused, resuming");
            const video = e.target as HTMLVideoElement;
            video.play();
          }}
        />

        {/* Transparent overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-none z-[5]" />

        {/* Scale markers on the right */}
        <div className="absolute right-4 top-0 bottom-0 flex flex-col justify-between py-4 z-[6] pointer-events-none">
          {scaleValues.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className={`h-[1px] bg-gray-400/60 ${
                  item.isMajor ? "w-4" : "w-2"
                }`}
              />
              <span
                className={`font-mono tracking-wider ${
                  item.isMajor
                    ? "text-gray-300/80 text-sm"
                    : "text-gray-400/60 text-xs"
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>

        {/* Red Flash Effect - covers entire video area */}
        {showRedFlash && (
          <div className="absolute inset-0 z-50 pointer-events-none">
            <div
              className="w-full h-full bg-red-600"
              style={{
                animation: "redFlash 1.3s ease-out",
              }}
            />
          </div>
        )}

        {/* Countdown Timer Display */}
        {countdown > 0 && (
          <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
            {/* Ring effect - multiple expanding circles */}
            <div className="absolute w-48 h-48 rounded-full border-2 border-purple-400/30" style={{ animation: 'slowRing 3s ease-out infinite' }}></div>
            <div className="absolute w-48 h-48 rounded-full border-2 border-purple-400/20" style={{ animation: 'slowRing 3s ease-out infinite 1s' }}></div>
            <div className="absolute w-48 h-48 rounded-full border-2 border-purple-400/10" style={{ animation: 'slowRing 2s ease-out infinite 2s' }}></div>
            
            {/* Main countdown circle */}
            <div className="w-48 h-48 bg-black/90 backdrop-blur-sm border-2 border-purple-400 rounded-full flex flex-col items-center justify-center shadow-2xl relative z-10">
              <div className="text-center">
                <div className="text-white text-4xl font-bold mb-2">
                  New Ride
                </div>
                <div className="text-purple-400 text-5xl font-mono font-bold">
                  {countdown}
                </div>
                <div className="text-white text-4xl font-bold mt-2">
                  Starting In
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Boom Effect Video - positioned at rocket's dynamically captured location */}
        {showBoomEffect && (
          <div
            className="absolute z-40 pointer-events-none"
            style={{
              top: `${rocketPosition.y - 20}px`,
              left: `${rocketPosition.x}px`,
              transform: "translate(-50%, -50%)",
              width: "150px",
              height: "150px",
            }}
          >
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                background: "transparent",
                overflow: "hidden",
                mask: "linear-gradient(black, black)",
                WebkitMask: "linear-gradient(black, black)",
              }}
            >
              <video
                src="/rocket_boom.webm"
                autoPlay
                muted
                playsInline
                controls={false}
                className="w-full h-full object-cover"
                style={{
                  background: "transparent",
                  mixBlendMode: "screen",
                  filter: "brightness(2) contrast(2) saturate(1.5)",
                  position: "absolute",
                  top: 0,
                  left: 0,
                  opacity: 0.8,
                }}
                onEnded={() => {
                  console.log("[v0] Boom effect video ended");
                  setShowBoomEffect(false);
                }}
                onError={(e) =>
                  console.error("[v0] Boom effect video failed to load:", e)
                }
              />
            </div>
          </div>
        )}

        <motion.div
          ref={rocketRef}
          key={animationKey}
          className="absolute z-20 scale-90"
          style={{
            top: "60%",
          }}
          initial={{ x: "-150px", y: 0, rotate: 0, opacity: 1 }}
          animate={
            isAnimating
              ? {
                  x: "calc(60vw - 80px)",
                  y: [
                    0,
                    0, // 0.00 - Start position, X-axis movin
                    -10, // 0.10 - X-axis done, ready to climb
                    -20, // 0.15 - Begin gentle rise
                    -50, // 0.20 - Approaching 1.00x
                    -100, // 0.30 - At 1.00x marker (pause feel)
                    -120, // 0.35 - Slow transition from 1.00x
                    -160, // 0.45 - Moving toward 2.00x
                    -220, // 0.55 - At 3.00x marker (pause feel)
                    -250, // 0.60 - Slow transition from 3.00x
                    -300, // 0.70 - Moving toward 4.00x
                    -350, // 0.80 - At 4.00x marker (pause feel)
                  ],
                  rotate: [
                    0, // 0.00 - Level at start
                    0, // 0.05 - Still level
                    -2, // 0.10 - Ready to tilt
                    -6, // 0.15 - Very subtle tilt begins
                    -7.5, // 0.20 - Small tilt approaching 1.00x
                    -8, // 0.30 - At 1.00x with subtle tilt
                    -9.2, // 0.35 - Maintaining subtle tilt
                    -10.8, // 0.45 - Slight increase toward 2.00x
                    -14.5, // 0.55 - At 3.00x, tilt increasing // 0.60 - Gradual tilt increase
                    -15.5, // 0.70 - Moving toward 4.00x
                    -16, // 0.80 - At 4.00x with noticeable tilt
                    -16.3, // 0.85 - Continuing climb
                    -16.7, // 0.90 - Approaching top
                    -17, // 0.95 - Near 7.00x
                    -17, // 1.00 - Final tilt at 7.00x
                  ],
                  opacity: showBoomEffect ? 0 : 1,
                }
              : { x: "-150px", y: 0, rotate: 0, opacity: 0 }
          }
          transition={
            isAnimating
              ? {
                  x: {
                    duration: 12,
                    ease: "linear",
                  },
                  y: {
                    duration: 16,
                    ease: "linear",
                    times: [
                      0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.35, 0.45, 0.55, 0.6, 0.7,
                      0.8, 0.85, 0.9, 0.95, 1,
                    ],
                  },
                  rotate: {
                    duration: 16,
                    ease: "linear",
                    times: [
                      0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.35, 0.45, 0.55, 0.6, 0.7,
                      0.8, 0.85, 0.9, 0.95, 1,
                    ],
                  },
                  opacity: {
                    duration: showBoomEffect ? 1.1 : 0.5,
                    ease: showBoomEffect ? "easeOut" : "easeInOut",
                  },
                }
              : {
                  duration: 0.3,
                  opacity: {
                    duration: 0.3,
                    ease: "easeInOut",
                  },
                }
          }
          onAnimationComplete={handleAnimationComplete}
        >
          <motion.div
            animate={{
              x: [0, 6, -6, 5, -5, 6, -6, 4, -4, 3, -3, 0],
              y: [0, -4, 4, -5, 5, -4, 4, -3, 3, -2, 2, 0],
              rotate: [
                0, 1.2, -1.2, 1.5, -1.5, 1.2, -1.2, 0.8, -0.8, 0.5, -0.5, 0,
              ],
            }}
            transition={{
              duration: 0.15,
              ease: "linear",
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "loop",
            }}
            style={{
              willChange: "transform",
              position: "relative",
              display: "inline-block",
            }}
          >
            <Rocket />
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default RocketEffect;
