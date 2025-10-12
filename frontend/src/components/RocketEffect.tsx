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
  const [rocketY, setRocketY] = useState(0);
  const [rocketRotation, setRocketRotation] = useState(0);
  const rocketRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Debug state changes
  useEffect(() => {
    console.log("[v0] State changes:", {
      showRedFlash,
      showBoomEffect,
      isNearCompletion,
    });
  }, [showRedFlash, showBoomEffect, isNearCompletion]);

  // Solpump-style multiplier system - single source of truth
  const [multiplier, setMultiplier] = useState(1.0);
  const [targetMultiplier, setTargetMultiplier] = useState(0);
  const [progress, setProgress] = useState(0);
  const [multiplierInterval, setMultiplierInterval] =
    useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("[v0] RocketEffect component mounted");
    return () => {
      console.log("[v0] RocketEffect component unmounted");
      // Cleanup multiplier interval on unmount
      if (multiplierInterval) {
        clearInterval(multiplierInterval);
      }
    };
  }, [multiplierInterval]);

  useEffect(() => {
    console.log("[v0] Animation state changed:", { isAnimating, animationKey });
  }, [isAnimating, animationKey]);

  // Update rocket position based on multiplier - rocket stops at 5.5x
  useEffect(() => {
    if (isAnimating) {
      // Calculate Y position based on exact multiplier value
      // Rocket moves directly with multiplier scale but stops at 5.5x
      const maxYRange = 480; // Maximum Y movement (for 7.00×)
      const rocketStopMultiplier = 5.5; // Rocket stops at 5.5x
      const cappedMultiplier = Math.min(multiplier, rocketStopMultiplier); // Cap rocket at 5.5x

      // Direct scale mapping: 1.00× = 0px, 7.00× = -480px
      const multiplierRange = 7.0 - 1.0; // Range from 1.00 to 7.00
      const scalePosition = (cappedMultiplier - 1.0) / multiplierRange; // 0-1 scale
      const newY = -scalePosition * maxYRange; // Direct Y position based on capped multiplier

      // Debug logging to see rocket position
      if (multiplier > 1.0) {
        console.log(
          `[v0] Rocket Position: Multiplier: ${multiplier.toFixed(
            2
          )}, Rocket Capped At: ${cappedMultiplier.toFixed(
            2
          )}, Target: ${targetMultiplier.toFixed(
            2
          )}, Scale: ${scalePosition.toFixed(3)}, Y: ${newY.toFixed(2)} (${(
            scalePosition * 100
          ).toFixed(1)}% of max range)`
        );
      }

      setRocketY(newY);

      // Calculate rotation based on exact multiplier value
      // Rotation moves directly with multiplier scale but stops at 5.5x
      const maxRotation = 40; // Maximum rotation (for 7.00×)
      const newRotation = -scalePosition * maxRotation; // Direct rotation based on capped multiplier
      setRocketRotation(newRotation);
    }
  }, [multiplier, isAnimating, targetMultiplier]);

  // Solpump-style multiplier animation logic - single source of truth
  useEffect(() => {
    console.log("[v0] Animation effect triggered:", {
      isAnimating,
      targetMultiplier,
    });

    if (!isAnimating || targetMultiplier <= 0) {
      console.log("[v0] Animation conditions not met:", {
        isAnimating,
        targetMultiplier,
      });
      return;
    }

    console.log("[v0] Starting animation with target:", targetMultiplier);
    let startTime = performance.now();
    const initialDelay = 3000; // 3 seconds delay at 1.00× position
    const fixedSpeed = 0.1; // Fixed speed: 0.1× per second (independent of target)

    const animate = (time: number) => {
      const elapsed = time - startTime;

      if (elapsed <= initialDelay) {
        // Stay at 1.00× for initial delay
        setMultiplier(1.0);
        setProgress(0);
        console.log("[v0] Animation delay phase:", elapsed.toFixed(0) + "ms");
        requestAnimationFrame(animate);
      } else {
        // Calculate multiplier with fixed speed (independent of target)
        const animationElapsed = elapsed - initialDelay;
        const secondsElapsed = animationElapsed / 1000; // Convert to seconds
        const value = 1.0 + fixedSpeed * secondsElapsed; // Fixed speed progression

        // Cap at target multiplier
        const cappedValue = Math.min(value, targetMultiplier);

        setMultiplier(parseFloat(cappedValue.toFixed(2)));

        // Calculate progress for rocket movement (0-1 based on target)
        const progress = Math.min(
          1,
          (cappedValue - 1.0) / (targetMultiplier - 1.0)
        );
        setProgress(progress);

        // Log progress every 5 seconds to avoid spam
        if (Math.floor(elapsed / 5000) !== Math.floor((elapsed - 16) / 5000)) {
          console.log("[v0] Animation progress:", {
            elapsed: elapsed.toFixed(0) + "ms",
            seconds: secondsElapsed.toFixed(1) + "s",
            multiplier: cappedValue.toFixed(2),
            progress: progress.toFixed(3),
            speed: fixedSpeed + "×/s",
          });
        }

        if (value < targetMultiplier) {
          requestAnimationFrame(animate);
        } else {
          // Trigger blast effect when target is reached
          console.log("[v0] Multiplier reached target:", targetMultiplier);

          // Get the current rocket position for blast effect
          if (rocketRef.current) {
            const rect = rocketRef.current.getBoundingClientRect();
            const containerRect =
              rocketRef.current.parentElement?.getBoundingClientRect();
            if (containerRect) {
              const relativeX = rect.left - containerRect.left;
              const relativeY = rect.top - containerRect.top;
              setRocketPosition({ x: relativeX, y: relativeY });
              console.log("[v0] Rocket position captured for blast:", {
                x: relativeX,
                y: relativeY,
              });
            }
          }

          // Show blast effects immediately
          console.log("[v0] Triggering blast effects");
          setIsNearCompletion(true);
          setShowRedFlash(true);
          setShowBoomEffect(true);

          // Hide red flash after 1.3 seconds while boom video continues
          setTimeout(() => {
            console.log("[v0] Hiding red flash");
            setShowRedFlash(false);
          }, 1300);

          // Stop animation after blast
          setIsAnimating(false);
        }
      }
    };

    requestAnimationFrame(animate);
  }, [isAnimating, targetMultiplier]);

  // Initialize random target multiplier when component mounts
  useEffect(() => {
    console.log("[v0] Component mounted, setting initial target");
    const randomTarget = Math.random() * 24 + 1; // Random between 1-24
    setTargetMultiplier(parseFloat(randomTarget.toFixed(2)));
    setMultiplier(1.0);
    setProgress(0);
    setRocketY(0);
    setRocketRotation(0);
    console.log("[v0] Initial target multiplier:", randomTarget.toFixed(2));

    // Force animation to start immediately
    setTimeout(() => {
      console.log("[v0] Forcing animation start after 100ms");
    }, 100);
  }, []); // Run once on mount

  // Start animation immediately when target is set
  useEffect(() => {
    if (isAnimating && targetMultiplier > 0) {
      console.log("[v0] Starting animation with target:", targetMultiplier);
    }
  }, [isAnimating, targetMultiplier]);

  // Handle video playback issues and power saving interruptions
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Page became visible, try to resume video playback
        const videos = document.querySelectorAll("video");
        videos.forEach((video) => {
          if (video.paused) {
            video
              .play()
              .catch((err) => console.log("[v0] Video resume failed:", err));
          }
        });
      }
    };

    const handleUserInteraction = () => {
      // User interacted with the page, ensure videos are playing
      const videos = document.querySelectorAll("video");
      videos.forEach((video) => {
        if (video.paused) {
          video
            .play()
            .catch((err) => console.log("[v0] Video play failed:", err));
        }
      });
    };

    // Listen for visibility changes
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Listen for user interactions to resume playback
    document.addEventListener("click", handleUserInteraction);
    document.addEventListener("touchstart", handleUserInteraction);
    document.addEventListener("keydown", handleUserInteraction);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("click", handleUserInteraction);
      document.removeEventListener("touchstart", handleUserInteraction);
      document.removeEventListener("keydown", handleUserInteraction);
    };
  }, []);

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
      // Delay resetting effects to allow them to show
      setTimeout(() => {
        // Reset near completion state and boom effect
        setIsNearCompletion(false);
        setShowBoomEffect(false);
        setShowRedFlash(false);
      }, 2000); // Wait 2 seconds before resetting effects
      // Start 5-second countdown
      setCountdown(5);
      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            console.log("[v0] Restarting animation");
            // Generate new random target for each game
            const newRandomTarget = Math.random() * 24 + 1; // Random between 1-24
            setTargetMultiplier(parseFloat(newRandomTarget.toFixed(2)));
            console.log(
              "[v0] New target multiplier:",
              newRandomTarget.toFixed(2)
            );
            // Reset multiplier system for new animation
            setMultiplier(1.0);
            if (multiplierInterval) {
              clearInterval(multiplierInterval);
              setMultiplierInterval(null);
            }
            // Force reset rocket position to starting position
            setTimeout(() => {
              setMultiplier(1.0);
              setProgress(0);
              setRocketY(0);
              setRocketRotation(0);
            }, 50);
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
      <div
        ref={containerRef}
        className="relative w-[96%] h-[83%] border-4 border-gray-800 rounded-lg shadow-lg p-0 overflow-visible"
      >
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
            video
              .play()
              .catch((err) => console.log("[v0] Video play interrupted:", err));
          }}
          onPause={(e) => {
            console.log("[v0] Background video paused, resuming");
            const video = e.target as HTMLVideoElement;
            video
              .play()
              .catch((err) => console.log("[v0] Video play interrupted:", err));
          }}
          onAbort={(e) => {
            console.log("[v0] Video playback aborted, attempting to resume");
            const video = e.target as HTMLVideoElement;
            setTimeout(() => {
              video
                .play()
                .catch((err) =>
                  console.log("[v0] Video play interrupted:", err)
                );
            }, 100);
          }}
        />

        {/* Transparent overlay */}
        <div className="absolute inset-0 bg-transparent pointer-events-none z-[5]" />

        {/* Random Target Value Display - Left Side */}
        <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-[6] pointer-events-none">
          <div className="backdrop-blur-sm rounded-2xl px-6 py-4 bg-black/20 border border-gray-600/30">
            <div className="text-center space-y-2">
              {/* Target Label */}
              <div className="text-gray-400 text-lg font-medium tracking-[0.2em] uppercase italic">
                Target
              </div>

              {/* Target Value with Metallic Gradient */}
              <div className="relative">
                <div
                  className="text-4xl font-black tracking-tight font-mono"
                  style={{
                    background:
                      "linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 15%, #8a8a8a 50%, #e0e0e0 85%, #f5f5f5 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                    textShadow:
                      "0 1px 0 rgba(255,255,255,0.4), 0 -1px 0 rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.6)",
                    filter:
                      "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.1))",
                  }}
                >
                  {targetMultiplier.toFixed(2)}x
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scale markers on the right - original static version */}
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

        {/* Live Multiplier Display - Centered */}
        {countdown === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[6] pointer-events-none">
            <div className="backdrop-blur-sm rounded-3xl px-8 py-6 mb-36">
              <div className="text-center space-y-2">
                {/* Current Payout Label */}
                <div className="text-gray-400 text-xl font-medium tracking-[0.2em] uppercase italic">
                  Current Payout
                </div>

                {/* Multiplier Value with Metallic Gradient */}
                <div className="relative">
                  <div
                    className="text-8xl font-black tracking-tight font-mono"
                    style={{
                      background:
                        "linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 15%, #8a8a8a 50%, #e0e0e0 85%, #f5f5f5 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      textShadow:
                        "0 1px 0 rgba(255,255,255,0.4), 0 -1px 0 rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.6)",
                      filter:
                        "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.1))",
                    }}
                  >
                    {multiplier.toFixed(2)}x
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            {/* Ring effect - multiple expanding circles */}
            <div
              className="absolute w-48 h-48 rounded-full border-2 border-purple-400/30"
              style={{ animation: "slowRing 3s ease-out infinite" }}
            ></div>
            <div
              className="absolute w-48 h-48 rounded-full border-2 border-purple-400/20"
              style={{ animation: "slowRing 3s ease-out infinite 1s" }}
            ></div>
            <div
              className="absolute w-48 h-48 rounded-full border-2 border-purple-400/10"
              style={{ animation: "slowRing 2s ease-out infinite 2s" }}
            ></div>

            {/* Main countdown circle */}
            <div
              className="w-48 h-48 backdrop-blur-sm rounded-full border-purple-400/30 flex flex-col items-center justify-center shadow-2xl relative z-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 50%, rgba(0,0,0,0.8) 100%)",
                border: "2px solid rgba(168, 85, 247, 0.3)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <div className="text-center space-y-2">
                {/* New Ride Label */}
                <div className="text-gray-400 text-xl font-medium tracking-[0.2em] uppercase italic">
                  New Ride
                </div>

                {/* Countdown Value with Metallic Gradient */}
                <div className="relative">
                  <div
                    className="text-8xl font-black tracking-tight font-mono"
                    style={{
                      background:
                        "linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 15%, #8a8a8a 50%, #e0e0e0 85%, #f5f5f5 100%)",
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      backgroundClip: "text",
                      textShadow:
                        "0 1px 0 rgba(255,255,255,0.4), 0 -1px 0 rgba(0,0,0,0.4), 0 4px 8px rgba(0,0,0,0.6)",
                      filter:
                        "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.8)) drop-shadow(0 0 20px rgba(255, 255, 255, 0.1))",
                    }}
                  >
                    {countdown}
                  </div>
                </div>

                {/* Starting In Label */}
                <div className="text-gray-400 text-xl font-medium tracking-[0.2em] uppercase italic">
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
                onAbort={(e) => {
                  console.log(
                    "[v0] Boom effect video aborted, attempting to resume"
                  );
                  const video = e.target as HTMLVideoElement;
                  setTimeout(() => {
                    video
                      .play()
                      .catch((err) =>
                        console.log("[v0] Boom video play interrupted:", err)
                      );
                  }, 100);
                }}
              />
            </div>
          </div>
        )}

        <motion.div
          ref={rocketRef}
          key={animationKey}
          className="absolute z-20 scale-90"
          style={{
            top: "86%", // Move rocket down to start at 1.00× position
          }}
          initial={{ x: "-150px", y: 0, rotate: 0, opacity: 1 }}
          animate={
            isAnimating
              ? {
                  x: "calc(60vw - 80px)",
                  y: rocketY,
                  rotate: rocketRotation,
                  opacity: showBoomEffect ? 0 : 1,
                }
              : { x: "-150px", y: 0, rotate: 0, opacity: 0 }
          }
          transition={
            isAnimating
              ? {
                  x: {
                    duration: 40,
                    ease: "linear",
                  },
                  y: {
                    duration: 0, // Immediate update - no animation delay
                    ease: "linear",
                  },
                  rotate: {
                    duration: 0, // Immediate update - no animation delay
                    ease: "linear",
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
