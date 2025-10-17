"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';
import { useSimpleStore, gameActions, userActions, walletActions, store, type Bet, type GameState } from '../store/simpleStore';
import { useWalletSimple } from './useWalletSimple';

export const useBettingSimple = () => {
  const state = useSimpleStore();
  const { gameState, isSocketConnected, bettingError, bettingSuccess } = state.game;
  const { user } = state.user;
  const { isConnected: isWalletConnected, walletInfo, updateBalance } = useWalletSimple();
  
  const socketRef = useRef<Socket | null>(null);

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000');
    socketRef.current = newSocket;

    // Connection events
    newSocket.on('connect', () => {
      console.log('✅ Connected to betting server - Socket ID:', newSocket.id);
      gameActions.setSocketConnected(true);
      // Request current game state when connected
      newSocket.emit('getGameState');
    });

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Disconnected from betting server - Reason:', reason);
      gameActions.setSocketConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('🚨 Connection error:', error);
    });

    // Game state events
    newSocket.on('gameState', (state: GameState) => {
      console.log('🎮 Received game state:', state);
      console.log('🎮 Current game:', state.currentGame);
      console.log('🎮 Target multiplier:', state.currentGame?.target_multiplier);
      console.log('🎮 Countdown:', state.countdown);
      console.log('🎮 Is initial countdown:', state.isInitialCountdown);
      console.log('🎮 Game status:', state.currentGame?.status);
      gameActions.setGameState(state);
    });

    // Handle game state response
    newSocket.on('gameStateResponse', (state: GameState) => {
      console.log('🎮 Received game state response:', state);
      console.log('🎮 Current game:', state.currentGame);
      console.log('🎮 Target multiplier:', state.currentGame?.target_multiplier);
      console.log('🎮 Countdown:', state.countdown);
      console.log('🎮 Is initial countdown:', state.isInitialCountdown);
      console.log('🎮 Game status:', state.currentGame?.status);
      gameActions.setGameState(state);
    });

    newSocket.on('gameUpdate', (update: any) => {
      console.log('Received game update:', update);
      
      switch (update.type) {
        case 'COUNTDOWN':
          console.log('🎮 Countdown update:', update.data);
          console.log('🎮 Countdown value:', update.data.countdown);
          console.log('🎮 Is initial:', update.data.isInitial);
          {
            const currentState = store.getState();
            const currentGame = currentState.game.gameState.currentGame
              ? { ...currentState.game.gameState.currentGame, status: 'COUNTDOWN' as const }
              : null;
            gameActions.updateGameState({
              countdown: update.data.countdown,
              isInitialCountdown: update.data.isInitial,
              currentGame,
            });
          }
          break;
        case 'GAME_START':
          console.log('🎮 Game started with data:', update.data);
          gameActions.updateGameState({
            currentGame: update.data,
            countdown: 0,
            isInitialCountdown: false
          });
          break;
        case 'MULTIPLIER_UPDATE':
          // Get current state from store
          const currentState = store.getState();
          gameActions.updateGameState({
            currentGame: currentState.game.gameState.currentGame ? {
              ...currentState.game.gameState.currentGame,
              current_multiplier: update.data.multiplier
            } : null
          });
          break;
        case 'GAME_END':
          console.log('🎮 Game ended with data:', update.data);
          // Get current state from store
          const currentStateEnd = store.getState();
          gameActions.updateGameState({
            currentGame: currentStateEnd.game.gameState.currentGame ? {
              ...currentStateEnd.game.gameState.currentGame,
              status: 'COMPLETED',
              final_multiplier: update.data.finalMultiplier
            } : null
          });
          break;
        case 'GAME_INITIALIZED':
          console.log('🎮 Game initialized with data:', update.data);
          gameActions.updateGameState({
            currentGame: update.data
          });
          break;
        case 'BET_PLACED':
          console.log('🎮 Bet placed:', update.data);
          // Update game state with new bet
          const currentStateBet = store.getState();
          const newActiveBets = update.data.bet ? 
            [...currentStateBet.game.gameState.activeBets.filter((b: Bet) => b.id !== update.data.bet.id), update.data.bet] :
            currentStateBet.game.gameState.activeBets;
          
          gameActions.updateGameState({
            activeBets: newActiveBets,
            totalPlayers: update.data.totalPlayers || currentStateBet.game.gameState.totalPlayers,
            totalBetAmount: update.data.totalBetAmount || currentStateBet.game.gameState.totalBetAmount
          });
          break;
        case 'BET_CASHED_OUT':
          console.log('🎮 Bet cashed out:', update.data);
          // Update game state after cashout
          const currentStateCashout = store.getState();
          const updatedActiveBets = update.data.updatedBet ? 
            currentStateCashout.game.gameState.activeBets.map((b: Bet) => 
              b.id === update.data.updatedBet.id ? update.data.updatedBet : b
            ) :
            currentStateCashout.game.gameState.activeBets;
          
          gameActions.updateGameState({
            activeBets: updatedActiveBets,
            totalPlayers: update.data.totalPlayers || currentStateCashout.game.gameState.totalPlayers,
            totalBetAmount: update.data.totalBetAmount || currentStateCashout.game.gameState.totalBetAmount
          });
          break;
      }
    });

    // Betting events
    newSocket.on('betResult', async (result: any) => {
      console.log('Received betResult:', result);
      if (result.success) {
        // Fetch updated balance from database (backend already deducted the amount)
        const currentState = store.getState();
        if (currentState.wallet.walletInfo?.address) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/${encodeURIComponent(currentState.wallet.walletInfo.address)}`);
            if (response.ok) {
              const userData = await response.json();
              const newBalance = userData.balance || 0;
              console.log('Fetched updated balance from database:', newBalance);
              userActions.updateUserBalance(newBalance);
              walletActions.updateBalance(newBalance);
              // Update cookies
              document.cookie = `user_balance=${encodeURIComponent(newBalance.toString())};path=/;max-age=31536000;SameSite=Lax`;
            }
          } catch (error) {
            console.error('Failed to fetch updated balance:', error);
          }
        }
        // Update game state with new bet if provided
        if (result.bet) {
          console.log('Updating game state with new bet:', result.bet);
          gameActions.addBet(result.bet);
          const currentState = store.getState();
          gameActions.updateGameStats({
            totalPlayers: result.totalPlayers || currentState.game.gameState.totalPlayers,
            totalBetAmount: result.totalBetAmount || currentState.game.gameState.totalBetAmount
          });
          // Force state update to trigger re-renders
          gameActions.updateGameState({});
        }
      } else {
        toast.error(result.error || 'Failed to place bet');
      }
    });

    newSocket.on('cashoutResult', async (result: any) => {
      if (result.success) {
        const multiplier = result.multiplier || 0;
        const payout = result.payout || 0;
        toast.success(`Cashed out at ${multiplier.toFixed(2)}x for ${payout.toFixed(4)} SOL!`);
        
        // Fetch updated balance from database (backend already added the payout)
        const currentState = store.getState();
        if (currentState.wallet.walletInfo?.address) {
          try {
            const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/${encodeURIComponent(currentState.wallet.walletInfo.address)}`);
            if (response.ok) {
              const userData = await response.json();
              const newBalance = userData.balance || 0;
              console.log('Fetched updated balance from database after cashout:', newBalance);
              userActions.updateUserBalance(newBalance);
              walletActions.updateBalance(newBalance);
              // Update cookies
              document.cookie = `user_balance=${encodeURIComponent(newBalance.toString())};path=/;max-age=31536000;SameSite=Lax`;
            }
          } catch (error) {
            console.error('Failed to fetch updated balance after cashout:', error);
          }
        }
        // Update game state after cashout
        if (result.updatedBet) {
          gameActions.updateBet(result.updatedBet);
          const currentState = store.getState();
          gameActions.updateGameStats({
            totalPlayers: result.totalPlayers || currentState.game.gameState.totalPlayers,
            totalBetAmount: result.totalBetAmount || currentState.game.gameState.totalBetAmount
          });
          // Force state update to trigger re-renders
          gameActions.updateGameState({});
        }
      } else {
        toast.error(result.error || 'Failed to cashout');
      }
    });

    newSocket.on('loginResult', (result: any) => {
      console.log('Login result:', result);
      if (result.success) {
        console.log('✅ User logged in successfully');
      } else {
        console.error('❌ Login failed:', result.error);
      }
    });

    return () => {
      newSocket.close();
    };
  }, []); // Empty dependency array - only run once on mount

  // Login user function
  const loginUser = useCallback((address: string, name: string, email: string) => {
    if (socketRef.current) {
      console.log('Logging in user:', { address, name, email });
      socketRef.current.emit('login', { address, name, email });
      const currentState = store.getState();
      const currentBalance = currentState.wallet.walletInfo?.balance || 1000;
      userActions.setUser({ address, name, email, balance: currentBalance });
    }
  }, []);

  // Auto-login user when wallet connects
  useEffect(() => {
    if (isWalletConnected && walletInfo && socketRef.current && isSocketConnected && !user) {
      console.log('🔄 Auto-logging in user due to wallet connection');
      loginUser(walletInfo.address, walletInfo.name, walletInfo.email);
    }
  }, [isWalletConnected, walletInfo, isSocketConnected, user, loginUser]);

  // Handle wallet connection changes
  useEffect(() => {
    if (isWalletConnected && walletInfo && socketRef.current && isSocketConnected) {
      console.log('🔄 Wallet connected, ensuring user is logged in');
      if (!user) {
        loginUser(walletInfo.address, walletInfo.name, walletInfo.email);
      }
      // Request fresh game state when wallet connects
      socketRef.current.emit('getGameState');
    }
  }, [isWalletConnected, walletInfo, isSocketConnected, user, loginUser]);

  // Force game state refresh when socket connects
  useEffect(() => {
    if (isSocketConnected && socketRef.current) {
      console.log('🔄 Socket connected, requesting fresh game state');
      socketRef.current.emit('getGameState');
    }
  }, [isSocketConnected]);

  // Periodic state refresh to ensure components stay in sync
  useEffect(() => {
    if (isSocketConnected && socketRef.current) {
      const interval = setInterval(() => {
        console.log('🔄 Periodic game state refresh');
        socketRef.current?.emit('getGameState');
      }, 5000); // Refresh every 5 seconds
      
      return () => clearInterval(interval);
    }
  }, [isSocketConnected]);

  // Clear messages after 3 seconds
  useEffect(() => {
    if (bettingError || bettingSuccess) {
      const timer = setTimeout(() => {
        gameActions.setBettingError(null);
        gameActions.setBettingSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bettingError, bettingSuccess]);

  // Place a bet - only allowed during countdown after wallet connection
  const placeBet = useCallback((amount: number, autoCashout?: number) => {
    if (!isWalletConnected || !walletInfo) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!socketRef.current || !user) {
      toast.error('Not connected to game server');
      return;
    }

    if (amount <= 0) {
      toast.error('Bet amount must be greater than 0');
      return;
    }

    const currentState = store.getState();
    const currentBalance = currentState.wallet.walletInfo?.balance || 0;
    console.log('Placing bet:', { amount, currentBalance, userAddress: walletInfo.address });
    
    if (currentBalance < amount) {
      toast.error('Insufficient balance');
      return;
    }
    
    // Only allow betting during countdown phase
    if (currentState.game.gameState.currentGame?.status !== 'COUNTDOWN') {
      toast.error('Bets can only be placed during countdown phase');
      return;
    }

    // Check if countdown is still active
    if (currentState.game.gameState.countdown <= 0) {
      toast.error('Countdown has ended, cannot place bet');
      return;
    }

    console.log('Placing bet:', {
      user_address: user.address,
      amount,
      auto_cashout: autoCashout,
      gameStatus: currentState.game.gameState.currentGame?.status,
      countdown: currentState.game.gameState.countdown
    });
    
    socketRef.current.emit('placeBet', {
      user_address: user.address,
      amount,
      auto_cashout: autoCashout
    });
  }, [isWalletConnected, walletInfo, user]);

  // Cashout a bet
  const cashoutBet = useCallback((betId: string) => {
    if (!socketRef.current || !user) {
      toast.error('Not connected to game server');
      return;
    }

    const currentState = store.getState();
    if (currentState.game.gameState.currentGame?.status !== 'RUNNING') {
      toast.error('Can only cashout during active game');
      return;
    }

    console.log('Cashing out bet:', betId);
    socketRef.current.emit('cashout', {
      user_address: user.address,
      bet_id: betId
    });
  }, [user]);

  // Get user's active bets for current game
  const getUserActiveBets = useCallback(() => {
    const currentState = store.getState();
    if (!user || !currentState.game.gameState.currentGame) return [];
    return currentState.game.gameState.activeBets.filter((bet: Bet) => 
      bet.user_address === user.address && 
      bet.game_id === currentState.game.gameState.currentGame?.id
    );
  }, [user]);

  // Get user's bet for current game
  const getUserCurrentBet = useCallback(() => {
    const currentState = store.getState();
    if (!user || !currentState.game.gameState.currentGame) return null;
    
    const currentBet = currentState.game.gameState.activeBets.find((bet: Bet) => 
      bet.user_address === user.address && 
      bet.game_id === currentState.game.gameState.currentGame?.id
    );
    
    console.log('🎯 getUserCurrentBet:', {
      user: user?.address,
      currentGame: currentState.game.gameState.currentGame?.id,
      activeBets: currentState.game.gameState.activeBets.length,
      currentBet
    });
    
    return currentBet;
  }, [user, gameState.currentGame?.id, gameState.activeBets]);

  // Force refresh game state
  const refreshGameState = useCallback(() => {
    if (socketRef.current && isSocketConnected) {
      console.log('🔄 Manually refreshing game state');
      socketRef.current.emit('getGameState');
    }
  }, [isSocketConnected]);

  // Force state update to ensure components re-render
  const forceUpdate = useCallback(() => {
    console.log('🔄 Forcing state update');
    // Trigger a state update by updating a dummy value
    gameActions.updateGameState({});
  }, []);

  // Fetch user bet history
  const fetchBetHistory = useCallback(async (limit: number = 20) => {
    if (!user?.address) return [];
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/betting/user-bets/${encodeURIComponent(user.address)}?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.bets || [];
      }
    } catch (error) {
      console.error('Failed to fetch bet history:', error);
    }
    return [];
  }, [user?.address]);

  // Fetch recent completed games history
  const fetchRecentGames = useCallback(async (limit: number = 20) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/betting/recent-games?limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.games || [];
      }
    } catch (error) {
      console.error('Failed to fetch recent games:', error);
    }
    return [];
  }, []);

  return {
    // State
    gameState,
    user,
    isConnected: isSocketConnected,
    isWalletConnected,
    walletInfo,
    bettingError,
    bettingSuccess,
    
    // Actions
    placeBet,
    cashoutBet,
    loginUser,
    refreshGameState,
    forceUpdate,
    fetchBetHistory,
    fetchRecentGames,
    
    // Computed
    getUserActiveBets,
    getUserCurrentBet,
    
    // Betting conditions
    canPlaceBet: (() => {
      const canBet = isWalletConnected && 
                     gameState.currentGame?.status === 'COUNTDOWN' && 
                     gameState.countdown > 0 && 
                     !getUserCurrentBet();
      console.log('🎯 canPlaceBet calculation:', {
        isWalletConnected,
        gameStatus: gameState.currentGame?.status,
        countdown: gameState.countdown,
        hasCurrentBet: !!getUserCurrentBet(),
        canBet
      });
      return canBet;
    })(),
  };
};
