"use client";

import { motion } from "framer-motion";
import { useState, useEffect, useRef } from "react";
import Rocket from "./Rocket/Rocket";
import { useBettingSimple } from "../hooks/useBettingSimple";
import { useWalletSimple } from "../hooks/useWalletSimple";

const RocketEffect = () => {
  const [animationKey, setAnimationKey] = useState(0);
  const [isNearCompletion, setIsNearCompletion] = useState(false);
  const [showBoomEffect, setShowBoomEffect] = useState(false);
  const [showRedFlash, setShowRedFlash] = useState(false);
  const [rocketPosition, setRocketPosition] = useState({ x: 0, y: 0 });
  const [rocketY, setRocketY] = useState(0);
  const [rocketRotation, setRocketRotation] = useState(0);
  const [rocketStartPosition, setRocketStartPosition] = useState("86%");
  const [rocketEndX, setRocketEndX] = useState("calc(60vw - 80px)");
  const rocketRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get game state from betting system
  const { gameState, isConnected, refreshGameState } = useBettingSimple();
  const { isConnected: isWalletConnected, initialized } = useWalletSimple();
  
  // Use betting system's game state
  const countdown = gameState.countdown;
  const isInitialCountdown = gameState.isInitialCountdown;
  const isAnimating = gameState.currentGame?.status === 'RUNNING';
  const currentMultiplier = gameState.currentGame?.current_multiplier || 1.0;
  const targetMultiplier = gameState.currentGame?.target_multiplier || 0;

  // Debug game state and wallet sync
  useEffect(() => {
    console.log('[RocketEffect] State sync update:', {
      countdown,
      isInitialCountdown,
      isAnimating,
      currentMultiplier,
      targetMultiplier,
      currentGame: gameState.currentGame,
      gameStatus: gameState.currentGame?.status,
      isGameConnected: isConnected,
      isWalletConnected,
      initialized
    });
  }, [countdown, isInitialCountdown, isAnimating, currentMultiplier, targetMultiplier, gameState.currentGame, isConnected, isWalletConnected, initialized]);

  // Debug state changes
  useEffect(() => {
    console.log("[v0] State changes:", {
      showRedFlash,
      showBoomEffect,
      isNearCompletion,
    });
  }, [showRedFlash, showBoomEffect, isNearCompletion]);

  // Use multiplier from betting system
  const multiplier = currentMultiplier;

  useEffect(() => {
    console.log("[v0] RocketEffect component mounted");
    return () => {
      console.log("[v0] RocketEffect component unmounted");
    };
  }, []);

  useEffect(() => {
    console.log("[v0] Animation state changed:", { isAnimating, animationKey });
  }, [isAnimating, animationKey]);

  // Update rocket position based on multiplier from betting system
  useEffect(() => {
    if (isAnimating && multiplier > 1.0) {
      // Get container height to calculate responsive Y position
      const containerHeight = containerRef.current?.offsetHeight || 600;
      
      // Calculate scale marker positions
      // Scale goes from 7.00x (top) to 0.00x (bottom)
      // We have 27 markers total, and we care about positions from 1.00x to 7.00x
      // 1.00x is at index 24 (from top), 7.00x is at index 0
      const totalMarkers = 27;
      const markerForSeven = 0;
      const markerForOne = 24;
      
      
      // Check if we're on large screen (lg breakpoint is 1024px)
      const isLargeScreen = window.innerWidth >= 1024;
      // py-2 = 0.5rem = 8px, py-4 = 1rem = 16px
      const paddingTop = isLargeScreen ? 16 : 8;
      const paddingBottom = isLargeScreen ? 16 : 8;
      const usableHeight = containerHeight - paddingTop - paddingBottom;
      
      // Position of 1.00x marker from top
      const oneXPosition = paddingTop + (markerForOne / (totalMarkers - 1)) * usableHeight;
      // Position of 7.00x marker from top
      const sevenXPosition = paddingTop + (markerForSeven / (totalMarkers - 1)) * usableHeight;
      
      // Calculate Y range for rocket movement
      const yRange = oneXPosition - sevenXPosition;
      
      // Calculate rocket's Y position based on multiplier
      const clampedMultiplier = Math.min(Math.max(multiplier, 1.0), 7.0);
      const scalePosition = (clampedMultiplier - 1.0) / (7.0 - 1.0);
      const newY = -scalePosition * yRange;

      setRocketY(newY);

      // Calculate rotation based on exact multiplier value
      const maxRotation = 40; // Maximum rotation at 7.00×
      const newRotation = -scalePosition * maxRotation;
      setRocketRotation(newRotation);
    } else if (!isAnimating && gameState.currentGame?.status === 'COUNTDOWN') {
      // Only reset when countdown starts, not when game completes
      setRocketY(0);
      setRocketRotation(0);
    }
  }, [multiplier, isAnimating, gameState.currentGame?.status]);

  // Handle game end events from betting system
  useEffect(() => {
    if (gameState.currentGame?.status === 'COMPLETED' && gameState.currentGame.final_multiplier) {
      console.log("[v0] Game completed with multiplier:", gameState.currentGame.final_multiplier);

      // Get the current rocket position for blast effect
      if (rocketRef.current) {
        const rect = rocketRef.current.getBoundingClientRect();
        const containerRect = rocketRef.current.parentElement?.getBoundingClientRect();
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

      // Reset effects and rocket after 1 second
      setTimeout(() => {
        console.log("[v0] Resetting rocket and effects for new game");
        setIsNearCompletion(false);
        setShowBoomEffect(false);
        setShowRedFlash(false);
        // Reset rocket position immediately
        setRocketY(0);
        setRocketRotation(0);
        // Force animation key update to restart rocket animation
        setAnimationKey((prev) => prev + 1);
      }, 1000);
    }
  }, [gameState.currentGame?.status, gameState.currentGame?.final_multiplier]);

  // Initialize component and calculate rocket start position
  useEffect(() => {
    console.log("[v0] RocketEffect component initialized with betting system");
    setRocketY(0);
    setRocketRotation(0);
    
    // Calculate the starting position of the rocket to align with 1.00x marker
    const calculateStartPosition = () => {
      if (containerRef.current) {
        const containerHeight = containerRef.current.offsetHeight;
        const windowWidth = window.innerWidth;
        
        // Calculate scale marker positions
        const totalMarkers = 27;
        const markerForOne = 20;
        
        // Check if we're on large screen (lg breakpoint is 1024px)
        const isLargeScreen = windowWidth >= 1024;
        const isSmallScreen = windowWidth < 640;
        
        // py-2 = 0.5rem = 8px, py-4 = 1rem = 16px
        const paddingTop = isLargeScreen ? 16 : 8;
        const paddingBottom = isLargeScreen ? 16 : 8;
        const usableHeight = containerHeight - paddingTop - paddingBottom;
        
        // Position of 1.00x marker from top
        // The markers are distributed evenly with justify-between
        // Index 24 out of 27 markers (0-26) should be at 1.00x
        const oneXPositionPx = paddingTop + (markerForOne / (totalMarkers - 1)) * usableHeight;
        
        // The rocket's visual center (the main body) is offset from its container's top
        // because of internal SVG positioning. We need to add an offset to move it down.
        // Through testing, the rocket appears ~3 marker positions too high
        // Each marker spacing is usableHeight / 26
        const markerSpacing = usableHeight / (totalMarkers - 1);
        const rocketVisualOffset = markerSpacing * 3; // Adjust rocket down by 3 marker positions
        
        const adjustedPositionPx = oneXPositionPx + rocketVisualOffset;
        const oneXPositionPercent = (adjustedPositionPx / containerHeight) * 100;
        
        setRocketStartPosition(`${oneXPositionPercent}%`);
        
        console.log("[v0] Rocket start position (1.00x marker):", {
          containerHeight,
          paddingTop,
          usableHeight,
          oneXPositionPx,
          markerSpacing,
          rocketVisualOffset,
          adjustedPositionPx,
          oneXPositionPercent,
          markerIndex: markerForOne,
          totalMarkers
        });
        
        // Calculate responsive end X position
        if (isSmallScreen) {
          setRocketEndX("calc(50vw - 40px)");
        } else if (isLargeScreen) {
          setRocketEndX("calc(60vw - 80px)");
        } else {
          setRocketEndX("calc(55vw - 60px)");
        }
        
        console.log("[v0] Rocket positions calculated:", {
          containerHeight,
          oneXPositionPercent,
          isLargeScreen,
          isSmallScreen,
          paddingTop,
          usableHeight,
          endX: isSmallScreen ? "50vw-40px" : isLargeScreen ? "60vw-80px" : "55vw-60px"
        });
      }
    };
    
    // Wait for container to be rendered, then calculate
    const timer = setTimeout(() => {
      calculateStartPosition();
    }, 100);
    
    // Recalculate on window resize
    window.addEventListener('resize', calculateStartPosition);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', calculateStartPosition);
    };
  }, []); // Run once on mount

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

  // Reset rocket position when new game starts
  useEffect(() => {
    if (gameState.currentGame?.status === 'COUNTDOWN') {
      console.log("[v0] New countdown started, resetting rocket");
      setRocketY(0);
      setRocketRotation(0);
      setAnimationKey((prev) => prev + 1);
      // Reset all animation states
      setIsNearCompletion(false);
      setShowBoomEffect(false);
      setShowRedFlash(false);
      
      // Recalculate start position to ensure sync on game reset
      if (containerRef.current) {
        const containerHeight = containerRef.current.offsetHeight;
        const windowWidth = window.innerWidth;
        const totalMarkers = 27;
        const markerForOne = 20;
        const isLargeScreen = windowWidth >= 1024;
        const isSmallScreen = windowWidth < 640;
        const paddingTop = isLargeScreen ? 16 : 8;
        const paddingBottom = isLargeScreen ? 16 : 8;
        const usableHeight = containerHeight - paddingTop - paddingBottom;
        
        // Position of 1.00x marker from top with visual offset adjustment
        const oneXPositionPx = paddingTop + (markerForOne / (totalMarkers - 1)) * usableHeight;
        const markerSpacing = usableHeight / (totalMarkers - 1);
        const rocketVisualOffset = markerSpacing * 3; // Adjust rocket down by 3 marker positions
        const adjustedPositionPx = oneXPositionPx + rocketVisualOffset;
        const oneXPositionPercent = (adjustedPositionPx / containerHeight) * 100;
        setRocketStartPosition(`${oneXPositionPercent}%`);
        
        // Also recalculate end X position
        if (isSmallScreen) {
          setRocketEndX("calc(50vw - 40px)");
        } else if (isLargeScreen) {
          setRocketEndX("calc(60vw - 80px)");
        } else {
          setRocketEndX("calc(55vw - 60px)");
        }
      }
    }
  }, [gameState.currentGame?.id, gameState.currentGame?.status]);

  // Ensure rocket is hidden during countdown
  useEffect(() => {
    if (gameState.currentGame?.status === 'COUNTDOWN' && countdown > 0) {
      // Hide rocket during countdown
      setRocketY(0);
      setRocketRotation(0);
    }
  }, [gameState.currentGame?.status, countdown]);

  // Auto-refresh game state if no current game after wallet is connected
  useEffect(() => {
    if (initialized && isWalletConnected && isConnected && !gameState.currentGame) {
      console.log('🔄 No current game detected, refreshing...');
      const timer = setTimeout(() => {
        refreshGameState();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [initialized, isWalletConnected, isConnected, gameState.currentGame, refreshGameState]);

  // Show loading state while wallet is initializing
  if (!initialized) {
    return (
      <div className="relative h-full w-full flex justify-center items-center">
        <div className="text-gray-400 text-sm">Loading game...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[50vh] lg:h-[78vh] min-h-[50vh] lg:min-h-[78vh] flex justify-center items-start flex-none">
      <div
        ref={containerRef}
        className="relative w-[95%] lg:w-[96%] h-full shrink-0 border-2 lg:border-4 border-gray-800 rounded-lg shadow-lg p-0 overflow-visible"
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

        

        {/* Scale markers on the right - original static version */}
        <div className="absolute right-2 lg:right-4 top-0 bottom-0 flex flex-col justify-between py-2 lg:py-4 z-[6] pointer-events-none">
          {scaleValues.map((item, index) => (
            <div key={index} className="flex items-center gap-1 lg:gap-2">
              <div
                className={`h-[1px] bg-gray-400/60 ${
                  item.isMajor ? "w-2 lg:w-4" : "w-1 lg:w-2"
                }`}
              />
              <span
                className={`font-mono tracking-wider ${
                  item.isMajor
                    ? "text-gray-300/80 text-xs lg:text-sm"
                    : "text-gray-400/60 text-[10px] lg:text-xs"
                }`}
              >
                {item.value}
              </span>
            </div>
          ))}
        </div>


        {/* Live Multiplier Display - Centered - show only when game is RUNNING */}
        {gameState.currentGame?.status === 'RUNNING' && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[6] pointer-events-none">
            <div className="backdrop-blur-sm rounded-2xl lg:rounded-3xl px-4 lg:px-8 py-4 lg:py-6 mb-20 lg:mb-36">
              <div className="text-center space-y-1 lg:space-y-2">
                {/* Current Payout Label */}
                <div className="text-gray-400 text-sm lg:text-xl font-medium tracking-[0.2em] uppercase italic">
                  Current Payout
                </div>

                {/* Multiplier Value with Metallic Gradient */}
                <div className="relative">
                  <div
                    className="text-4xl lg:text-8xl font-black tracking-tight font-mono"
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
                    {currentMultiplier.toFixed(2)}x
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

        {/* Countdown Timer Display - only during COUNTDOWN state */}
        {gameState.currentGame?.status === 'COUNTDOWN' && countdown >= 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none">
            {/* Ring effect - multiple expanding circles */}
            <div
              className="absolute w-32 h-32 lg:w-48 lg:h-48 rounded-full border-2 border-purple-400/30"
              style={{ animation: "slowRing 3s ease-out infinite" }}
            ></div>
            <div
              className="absolute w-32 h-32 lg:w-48 lg:h-48 rounded-full border-2 border-purple-400/20"
              style={{ animation: "slowRing 3s ease-out infinite 1s" }}
            ></div>
            <div
              className="absolute w-32 h-32 lg:w-48 lg:h-48 rounded-full border-2 border-purple-400/10"
              style={{ animation: "slowRing 2s ease-out infinite 2s" }}
            ></div>

            {/* Main countdown circle */}
            <div
              className="w-32 h-32 lg:w-48 lg:h-48 backdrop-blur-sm rounded-full border-purple-400/30 flex flex-col items-center justify-center shadow-2xl relative z-10"
              style={{
                background:
                  "linear-gradient(135deg, rgba(0,0,0,0.8) 0%, rgba(20,20,20,0.9) 50%, rgba(0,0,0,0.8) 100%)",
                border: "2px solid rgba(168, 85, 247, 0.3)",
                boxShadow:
                  "0 8px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <div className="text-center space-y-1 lg:space-y-2">
                {/* Countdown Label */}
                <div className="text-gray-400 text-sm lg:text-xl font-medium tracking-[0.2em] uppercase italic">
                  {isInitialCountdown ? "Game Starting" : "New Ride"}
                </div>

                {/* Countdown Value with Metallic Gradient */}
                <div className="relative">
                  <div
                    className="text-4xl lg:text-8xl font-black tracking-tight font-mono"
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
                    {countdown > 0 ? countdown : '0'}
                  </div>
                </div>

                {/* Starting In Label */}
                <div className="text-gray-400 text-sm lg:text-xl font-medium tracking-[0.2em] uppercase italic">
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
          className="absolute z-20 scale-[0.6] sm:scale-75 lg:scale-90"
          style={{
            top: rocketStartPosition, // Dynamically calculated to align with 1.00× marker
            y: rocketY, // Apply Y directly to style for instant update
            rotate: `${rocketRotation}deg`, // Apply rotation directly to style for instant update
            // Rocket visibility logic:
            // - Show during COUNTDOWN (preparing for launch)
            // - Show during RUNNING (actively flying)
            // - Hide when boom effect is active (explosion)
            // - Hide during COMPLETED state (after explosion)
            opacity: showBoomEffect 
              ? 0 
              : (isAnimating || gameState.currentGame?.status === 'COUNTDOWN' || !gameState.currentGame)
              ? 1
              : 0,
            willChange: 'transform, opacity', // Optimize for performance
          }}
          initial={{ x: "-150px" }}
          animate={
            isAnimating && gameState.currentGame?.status === 'RUNNING'
              ? {
                  x: rocketEndX,
                }
              : {
                  x: "-150px",
                }
          }
          transition={
            isAnimating && gameState.currentGame?.status === 'RUNNING'
              ? {
                  x: {
                    duration: 40,
                    ease: "linear",
                  },
                }
              : {
                  duration: 0.3,
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

