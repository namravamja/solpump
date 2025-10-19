"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import RocketEffect from "./RocketEffect";
import ConfirmationModal from "./ConfirmationModal";
import { useBettingSimple } from "../hooks/useBettingSimple";
import { useWalletSimple } from "../hooks/useWalletSimple";
import type { Bet } from "../store/simpleStore";

// Scale overlay is rendered inside RocketEffect to align with the video container

export default function CenterGame() {
  const [betAmount, setBetAmount] = useState("0");
  const [autoCashout, setAutoCashout] = useState("0.00");
  const [advancedBetting, setAdvancedBetting] = useState(false);
  const [isPlacingBet, setIsPlacingBet] = useState(false);
  const [balanceUpdate, setBalanceUpdate] = useState<{
    amount: number;
    type: "bet" | "cashout";
  } | null>(null);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: "disconnect" | "bet" | "cashout" | null;
    data?: any;
  }>({
    isOpen: false,
    type: null,
  });
  const [betHistory, setBetHistory] = useState<Bet[]>([]);

  const {
    gameState,
    user,
    isConnected,
    isWalletConnected,
    walletInfo,
    bettingError,
    bettingSuccess,
    placeBet,
    cashoutBet,
    getUserCurrentBet,
    canPlaceBet,
    forceUpdate,
    fetchBetHistory,
    fetchRecentGames,
  } = useBettingSimple();

  const {
    connectWallet,
    disconnectWallet,
    isConnecting,
    connectionError,
    initialized,
  } = useWalletSimple();

  const currentBet = getUserCurrentBet();
  const canCashout =
    gameState.currentGame?.status === "RUNNING" &&
    (gameState.currentGame?.current_multiplier ?? 1) > 1 &&
    currentBet?.status === "ACTIVE";

  // Debug current bet and cashout status
  useEffect(() => {
    console.log("🎯 CenterGame - Current bet status:", {
      currentBet,
      gameStatus: gameState.currentGame?.status,
      canCashout,
      currentMultiplier: gameState.currentGame?.current_multiplier,
    });
  }, [
    currentBet,
    gameState.currentGame?.status,
    canCashout,
    gameState.currentGame?.current_multiplier,
  ]);

  // Update balance when user data changes
  useEffect(() => {
    if (user && walletInfo) {
      // Sync balance between user and wallet
      if (user.balance !== walletInfo.balance) {
        // Balance will be updated by the betting system
      }
    }
  }, [user, walletInfo]);

  // Track balance changes for visual feedback
  useEffect(() => {
    if (bettingSuccess) {
      if (bettingSuccess.includes("Cashed out")) {
        // Extract payout amount from success message
        const payoutMatch = bettingSuccess.match(/for ([\d.]+)/);
        if (payoutMatch) {
          const payout = Number.parseFloat(payoutMatch[1]);
          setBalanceUpdate({ amount: payout, type: "cashout" });
          setTimeout(() => setBalanceUpdate(null), 3000);
        }
      } else if (bettingSuccess.includes("Bet placed")) {
        // Extract bet amount from the bet amount state
        const betAmountNum = Number.parseFloat(betAmount);
        if (betAmountNum > 0) {
          setBalanceUpdate({ amount: betAmountNum, type: "bet" });
          setTimeout(() => setBalanceUpdate(null), 3000);
        }
      }
    }
  }, [bettingSuccess, betAmount]);

  // Fetch bet history when user is connected
  useEffect(() => {
    if (isWalletConnected && user?.address) {
      const loadBetHistory = async () => {
        const history = await fetchBetHistory(20);
        setBetHistory(history);
      };
      loadBetHistory();
    }
  }, [isWalletConnected, user?.address, fetchBetHistory]);

  // Refresh bet history when betting actions occur
  useEffect(() => {
    if (bettingSuccess && isWalletConnected && user?.address) {
      const refreshHistory = async () => {
        const history = await fetchBetHistory(20);
        setBetHistory(history);
      };
      refreshHistory();
    }
  }, [bettingSuccess, isWalletConnected, user?.address, fetchBetHistory]);

  // Recent games history
  const [recentGames, setRecentGames] = useState<any[]>([]);
  useEffect(() => {
    const loadRecentGames = async () => {
      const games = await fetchRecentGames(20);
      setRecentGames(games);
    };
    loadRecentGames();
  }, [fetchRecentGames]);

  const handlePlaceBet = () => {
    if (!user || !canPlaceBet) return;

    const amount = Number.parseFloat(betAmount);
    const autoCashoutValue = Number.parseFloat(autoCashout) || undefined;

    if (amount <= 0) {
      toast.error("Please enter a valid bet amount");
      return;
    }

    setConfirmationModal({
      isOpen: true,
      type: "bet",
      data: { amount, autoCashoutValue },
    });
  };

  const confirmPlaceBet = async () => {
    const { amount, autoCashoutValue } = confirmationModal.data;
    setIsPlacingBet(true);
    setConfirmationModal({ isOpen: false, type: null });

    try {
      await placeBet(amount, autoCashoutValue);
      setBetAmount("0");
      setAutoCashout("0.00");
      toast.success(`Bet placed successfully! ${amount.toFixed(4)} SOL`);
    } catch (error) {
      console.error("Failed to place bet:", error);
      toast.error("Failed to place bet. Please try again.");
    } finally {
      setIsPlacingBet(false);
    }
  };

  const handleCashout = () => {
    if (!currentBet || !canCashout) return;

    setConfirmationModal({
      isOpen: true,
      type: "cashout",
      data: {
        betId: currentBet.id,
        currentMultiplier: gameState.currentGame?.current_multiplier,
      },
    });
  };

  const confirmCashout = async () => {
    const { betId } = confirmationModal.data;
    setConfirmationModal({ isOpen: false, type: null });

    try {
      await cashoutBet(betId);
      toast.success("Cashout successful!");
    } catch (error) {
      console.error("Failed to cashout:", error);
      toast.error("Failed to cashout. Please try again.");
    }
  };

  const handleQuickBet = (multiplier: number) => {
    if (!user) return;

    const newAmount = user.balance * multiplier;
    setBetAmount(newAmount.toFixed(4));
  };

  const handleClearAutoCashout = () => {
    setAutoCashout("0.00");
  };

  const handleDisconnect = () => {
    setConfirmationModal({
      isOpen: true,
      type: "disconnect",
    });
  };

  const confirmDisconnect = async () => {
    setConfirmationModal({ isOpen: false, type: null });
    try {
      await disconnectWallet();
      toast.success("Wallet disconnected successfully");
    } catch (error) {
      console.error("Failed to disconnect:", error);
      toast.error("Failed to disconnect wallet");
    }
  };

  // Show loading state while wallet is initializing
  if (!initialized) {
    return (
      <div className="flex-1 flex items-center justify-center bg-black min-h-screen">
        <div className="text-gray-400 text-sm">Loading wallet...</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-black min-h-screen overflow-hidden">
      <div className="w-full lg:w-64 bg-gray-900/90 backdrop-blur-sm border-r border-gray-800 flex flex-col overflow-hidden lg:h-3/4 mt-4 order-2 lg:order-1">
        {/* Bet Amount Section */}
        <div className="p-2 sm:p-3 lg:p-5 border-b border-gray-800 overflow-y-auto">
          {/* Connection Status */}
          <div className="mb-3">
            {gameState.countdown > 0 &&
              gameState.currentGame?.status === "COUNTDOWN" && (
                <div className="text-xs text-yellow-400">
                  ⏰ Betting Time: {gameState.countdown}s remaining
                </div>
              )}
          </div>

          {/* Wallet Connection (show when not connected OR countdown is active but wallet not yet ready) */}
          {!isWalletConnected && (
            <div className="mb-4 p-2 sm:p-3 bg-yellow-900/30 border border-yellow-500/30 rounded">
              <div className="text-xs text-yellow-300 mb-2">
                Connect Wallet to Place Bets
              </div>
              <button
                onClick={() => {
                  // Prefer opening the profile + wallet modal flow if available
                  const ev = new Event("open-wallet-modal");
                  window.dispatchEvent(ev);
                }}
                disabled={isConnecting}
                className="w-full bg-gradient-to-r from-yellow-600 via-yellow-700 to-orange-600 hover:from-yellow-500 hover:via-yellow-600 hover:to-orange-500 text-white font-bold text-xs sm:text-sm py-2 rounded transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isConnecting ? "CONNECTING..." : "CONNECT WALLET"}
              </button>
              {connectionError && (
                <div className="text-xs text-red-300 mt-2">
                  {connectionError}
                </div>
              )}
            </div>
          )}

          {/* Betting Form - Only show when wallet is connected */}
          {isWalletConnected && (
            <>
              <div className="mb-4 sm:mb-5">
                <label className="block text-gray-300 text-xs font-medium mb-2">
                  Bet Amount (
                  {walletInfo ? walletInfo.balance.toFixed(4) : "0.0000"} SOL)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    disabled={!canPlaceBet}
                    className={`w-full bg-gray-800 border border-gray-700 rounded px-2 sm:px-3 py-2 text-white font-mono text-xs sm:text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none ${
                      !canPlaceBet ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    placeholder="0"
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-[8px] sm:text-xs">
                        S
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1 sm:space-x-2 mt-2">
                  <button
                    onClick={() => handleQuickBet(0.5)}
                    disabled={!canPlaceBet}
                    className="px-2 sm:px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    1/2
                  </button>
                  <button
                    onClick={() => handleQuickBet(2)}
                    disabled={!canPlaceBet}
                    className="px-2 sm:px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    2x
                  </button>
                  <button
                    onClick={() => handleQuickBet(1)}
                    disabled={!canPlaceBet}
                    className="px-2 sm:px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    MAX
                  </button>
                </div>
              </div>

              {/* Auto Cashout */}
              <div className="mb-4 sm:mb-5">
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
                    disabled={!canPlaceBet}
                    className={`w-full bg-gray-800 border border-gray-700 rounded px-2 sm:px-3 py-2 text-white font-mono text-xs sm:text-sm focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none ${
                      !canPlaceBet ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                    placeholder="X 0.00"
                  />
                  <button
                    onClick={handleClearAutoCashout}
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white text-sm"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Current Bet Status */}
              {currentBet && (
                <div className="mb-4 p-2 sm:p-3 bg-purple-900/30 border border-purple-500/30 rounded">
                  <div className="text-xs text-purple-300 mb-1">Your Bet</div>
                  <div className="text-white text-xs sm:text-sm font-mono">
                    {currentBet.amount
                      ? currentBet.amount.toFixed(4)
                      : "0.0000"}{" "}
                    SOL
                    {currentBet.auto_cashout && (
                      <span className="text-purple-300 ml-2">
                        @ {currentBet.auto_cashout.toFixed(2)}x
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    Status: {currentBet.status}
                  </div>
                </div>
              )}

              {/* Place Bet / Cashout Button */}
              {canPlaceBet ? (
                <button
                  onClick={handlePlaceBet}
                  disabled={isPlacingBet}
                  className="w-full bg-gradient-to-r from-purple-600 via-purple-700 to-pink-600 hover:from-purple-500 hover:via-purple-600 hover:to-pink-500 text-white font-bold text-xs sm:text-sm py-2 sm:py-3 rounded transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-purple-500/25 mb-4 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isPlacingBet ? "PLACING..." : "PLACE BET"}
                </button>
              ) : canCashout ? (
                <button
                  onClick={handleCashout}
                  className="w-full bg-gradient-to-r from-green-600 via-green-700 to-emerald-600 hover:from-green-500 hover:via-green-600 hover:to-emerald-500 text-white font-bold text-xs sm:text-sm py-2 sm:py-3 rounded transition-all duration-300 transform hover:scale-105 hover:shadow-lg hover:shadow-green-500/25 mb-4"
                >
                  CASHOUT NOW @{" "}
                  {gameState.currentGame?.current_multiplier?.toFixed(2) ||
                    "0.00"}
                  x
                </button>
              ) : (
                <button
                  disabled
                  className="w-full bg-gray-600 text-gray-400 font-bold text-xs sm:text-sm py-2 sm:py-3 rounded mb-4 cursor-not-allowed"
                >
                  {gameState.currentGame?.status === "RUNNING"
                    ? "GAME IN PROGRESS"
                    : gameState.currentGame?.status === "COUNTDOWN" &&
                      gameState.countdown > 0
                    ? `COUNTDOWN: ${gameState.countdown}s`
                    : gameState.countdown <= 0
                    ? "BETTING CLOSED"
                    : "WAITING FOR COUNTDOWN"}
                </button>
              )}
            </>
          )}

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
        <div className="flex-1 p-2 sm:p-3 lg:p-5 overflow-y-auto">
          <div className="mb-4">
            <div className="text-gray-300 text-xs mb-1">
              <span className="font-bold text-white">
                {gameState.totalPlayers}
              </span>{" "}
              Playing
            </div>
            <div className="text-gray-300 text-xs">
              Total:{" "}
              <span className="font-bold text-white">
                {gameState.totalBetAmount
                  ? gameState.totalBetAmount.toFixed(4)
                  : "0.0000"}
              </span>{" "}
              SOL
            </div>
          </div>

          <div className="space-y-2">
            {gameState.activeBets.length > 0 ? (
              gameState.activeBets.map((bet: Bet) => (
                <div
                  key={bet.id}
                  className={`bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded p-2 sm:p-3 flex items-center justify-between ${
                    bet.user_address === user?.address
                      ? "ring-2 ring-purple-500/50"
                      : ""
                  }`}
                >
                  <div className="flex items-center space-x-2 sm:space-x-3 min-w-0">
                    <div className="w-5 h-5 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                    <div className="min-w-0">
                      <div className="text-white text-xs font-medium truncate">
                        {bet.user_name}
                      </div>
                      <div className="text-gray-400 text-xs truncate">
                        {bet.amount ? bet.amount.toFixed(4) : "0.0000"} SOL
                        {bet.auto_cashout && (
                          <span className="text-purple-300 ml-1">
                            @ {bet.auto_cashout.toFixed(2)}x
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 font-medium flex-shrink-0">
                    {bet.status === "PENDING"
                      ? "JOINED"
                      : bet.status === "ACTIVE"
                      ? "IN-PLAY"
                      : bet.status}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-500 text-xs py-8">
                No active bets
              </div>
            )}
          </div>
        </div>

        {/* Recent Games Section */}
        <div className="mt-4 px-2 sm:px-3 lg:px-5">
          <div className="mb-3">
            <h3 className="text-white font-semibold text-xs sm:text-sm">
              Recent Games
            </h3>
          </div>
          <div className="overflow-x-auto">
            {recentGames.length > 0 ? (
              <div className="flex space-x-2 sm:space-x-3 pb-2">
                {recentGames.map((g) => (
                  <div
                    key={g.id}
                    className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded p-2 sm:p-3 flex-shrink-0 min-w-[120px] sm:min-w-[140px]"
                  >
                    <div className="text-xs text-gray-300">Final</div>
                    <div
                      className={`text-xs sm:text-sm font-semibold ${
                        Number(g.final_multiplier) >= 2
                          ? "text-green-400"
                          : "text-gray-200"
                      }`}
                    >
                      {Number(
                        g.final_multiplier || g.target_multiplier
                      ).toFixed(2)}
                      x
                    </div>
                    <div className="text-[10px] text-gray-500 mt-1">
                      {new Date(g.created_at).toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-gray-500 text-xs py-4">
                No games yet
              </div>
            )}
          </div>
        </div>

        {/* Bet History Section */}
        {isWalletConnected && (
          <div className="mt-4 px-2 sm:px-3 lg:px-5">
            <div className="mb-3">
              <h3 className="text-white font-semibold text-xs sm:text-sm">
                Bet History
              </h3>
            </div>

            <div className="overflow-x-auto">
              {betHistory.length > 0 ? (
                <div className="flex space-x-2 sm:space-x-3 pb-2">
                  {betHistory.map((bet: Bet) => (
                    <div
                      key={bet.id}
                      className="bg-gray-800/50 backdrop-blur-sm border border-gray-700/50 rounded p-2 sm:p-3 flex-shrink-0 min-w-[160px] sm:min-w-[200px]"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-white text-xs font-medium">
                          {bet.amount ? bet.amount.toFixed(4) : "0.0000"} SOL
                        </div>
                        <div
                          className={`text-xs px-2 py-0.5 rounded ${
                            bet.status === "CASHED_OUT"
                              ? "bg-green-600/20 text-green-400"
                              : bet.status === "LOST"
                              ? "bg-red-600/20 text-red-400"
                              : bet.status === "ACTIVE"
                              ? "bg-blue-600/20 text-blue-400"
                              : "bg-gray-600/20 text-gray-400"
                          }`}
                        >
                          {bet.status}
                        </div>
                      </div>

                      {bet.status === "CASHED_OUT" &&
                        bet.multiplier_at_cashout &&
                        bet.payout && (
                          <div className="text-xs text-gray-300">
                            <div>
                              Cashed at: {bet.multiplier_at_cashout.toFixed(2)}x
                            </div>
                            <div className="text-green-400 font-medium">
                              Won: {bet.payout.toFixed(4)} SOL
                            </div>
                          </div>
                        )}

                      {bet.auto_cashout && (
                        <div className="text-xs text-purple-300 mt-1">
                          Auto: {bet.auto_cashout.toFixed(2)}x
                        </div>
                      )}

                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(bet.created_at).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 text-xs py-8">
                  No bet history yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center Game Area */}
      <div className="flex-1 relative bg-gradient-to-br from-purple-900/20 via-black to-black overflow-hidden pt-2 sm:pt-4 lg:pt-6 mt-4 order-1 lg:order-2">
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

        {/* Scale overlay moved to RocketEffect for exact alignment with video */}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={() => setConfirmationModal({ isOpen: false, type: null })}
        onConfirm={() => {
          switch (confirmationModal.type) {
            case "disconnect":
              confirmDisconnect();
              break;
            case "bet":
              confirmPlaceBet();
              break;
            case "cashout":
              confirmCashout();
              break;
          }
        }}
        title={
          confirmationModal.type === "disconnect"
            ? "Disconnect Wallet"
            : confirmationModal.type === "bet"
            ? "Place Bet"
            : "Cashout Bet"
        }
        message={
          confirmationModal.type === "disconnect"
            ? "Are you sure you want to disconnect your wallet? You'll need to reconnect to place bets."
            : confirmationModal.type === "bet"
            ? `Place a bet of ${confirmationModal.data?.amount?.toFixed(
                4
              )} SOL${
                confirmationModal.data?.autoCashoutValue
                  ? ` with auto-cashout at ${confirmationModal.data.autoCashoutValue.toFixed(
                      2
                    )}x`
                  : ""
              }?`
            : `Cashout your bet at ${confirmationModal.data?.currentMultiplier?.toFixed(
                2
              )}x multiplier?`
        }
        confirmText={
          confirmationModal.type === "disconnect"
            ? "Disconnect"
            : confirmationModal.type === "bet"
            ? "Place Bet"
            : "Cashout"
        }
        type={confirmationModal.type === "disconnect" ? "danger" : "info"}
        isLoading={isPlacingBet}
      />
    </div>
  );
}
