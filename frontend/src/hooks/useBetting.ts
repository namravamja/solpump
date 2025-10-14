"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWallet } from './useWallet';

export interface Bet {
  id: string;
  user_id: string;
  user_address: string;
  user_name: string;
  amount: number;
  auto_cashout?: number;
  game_id: string;
  status: 'PENDING' | 'ACTIVE' | 'CASHED_OUT' | 'LOST' | 'WON';
  multiplier_at_cashout?: number;
  payout?: number;
  created_at: string;
  updated_at: string;
}

export interface Game {
  id: string;
  target_multiplier: number;
  current_multiplier: number;
  status: 'COUNTDOWN' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  start_time?: string;
  end_time?: string;
  final_multiplier?: number;
  created_at: string;
  updated_at: string;
}

export interface GameState {
  currentGame: Game | null;
  countdown: number;
  isInitialCountdown: boolean;
  activeBets: Bet[];
  totalPlayers: number;
  totalBetAmount: number;
}

export interface User {
  id: string;
  address: string;
  name: string;
  email: string;
  balance: number;
  created_at: string;
  updated_at: string;
}

export const useBetting = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    currentGame: null,
    countdown: 20,
    isInitialCountdown: true,
    activeBets: [],
    totalPlayers: 0,
    totalBetAmount: 0,
  });
  const [user, setUser] = useState<User | null>(null);
  const [isSocketConnected, setIsSocketConnected] = useState(false);
  const [bettingError, setBettingError] = useState<string | null>(null);
  const [bettingSuccess, setBettingSuccess] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Use wallet hook
  const { isConnected: isWalletConnected, walletInfo, updateBalance, connectWallet, initialized: walletInitialized } = useWallet();

  // Initialize WebSocket connection
  useEffect(() => {
    const newSocket = io(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000');
    socketRef.current = newSocket;
    setSocket(newSocket);

    // Connection events
    newSocket.on('connect', () => {
      console.log('Connected to betting server');
      setIsSocketConnected(true);
      // Request current game state when connected
      newSocket.emit('getGameState');
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from betting server');
      setIsSocketConnected(false);
    });

    // Game state events
    newSocket.on('gameState', (state: GameState) => {
      console.log('Received game state:', state);
      setGameState(state);
    });

    // Handle game state response
    newSocket.on('gameStateResponse', (state: GameState) => {
      console.log('Received game state response:', state);
      setGameState(state);
    });

    newSocket.on('gameUpdate', (update: any) => {
      console.log('Received game update:', update);
      
      switch (update.type) {
        case 'COUNTDOWN':
          setGameState(prev => ({
            ...prev,
            countdown: update.data.countdown,
            isInitialCountdown: update.data.isInitial
          }));
          break;
        case 'GAME_START':
          setGameState(prev => ({
            ...prev,
            currentGame: update.data,
            countdown: 0
          }));
          break;
        case 'MULTIPLIER_UPDATE':
          setGameState(prev => ({
            ...prev,
            currentGame: prev.currentGame ? {
              ...prev.currentGame,
              current_multiplier: update.data.multiplier
            } : null
          }));
          break;
        case 'GAME_END':
          setGameState(prev => ({
            ...prev,
            currentGame: prev.currentGame ? {
              ...prev.currentGame,
              status: 'COMPLETED',
              final_multiplier: update.data.finalMultiplier
            } : null
          }));
          break;
        case 'BET_PLACED':
          // Update game state with new bet
          setGameState(prev => ({
            ...prev,
            activeBets: update.data.activeBets || prev.activeBets,
            totalPlayers: update.data.totalPlayers || prev.totalPlayers,
            totalBetAmount: update.data.totalBetAmount || prev.totalBetAmount
          }));
          break;
        case 'BET_CASHED_OUT':
          // Update game state after cashout
          setGameState(prev => ({
            ...prev,
            activeBets: update.data.activeBets || prev.activeBets,
            totalPlayers: update.data.totalPlayers || prev.totalPlayers,
            totalBetAmount: update.data.totalBetAmount || prev.totalBetAmount
          }));
          break;
      }
    });

    // Betting events
    newSocket.on('betResult', (result: any) => {
      console.log('Received betResult:', result);
      if (result.success) {
        setBettingSuccess('Bet placed successfully!');
        setBettingError(null);
        // Refresh user balance
        if (user && result.amount) {
          setUser(prev => prev ? { ...prev, balance: prev.balance - result.amount } : null);
        }
        // Update game state with new bet if provided
        if (result.bet) {
          console.log('Updating game state with new bet:', result.bet);
          setGameState(prev => ({
            ...prev,
            activeBets: [...prev.activeBets.filter(b => b.id !== result.bet.id), result.bet],
            totalPlayers: result.totalPlayers || prev.totalPlayers,
            totalBetAmount: result.totalBetAmount || prev.totalBetAmount
          }));
        }
      } else {
        setBettingError(result.error || 'Failed to place bet');
        setBettingSuccess(null);
      }
    });

    newSocket.on('cashoutResult', (result: any) => {
      if (result.success) {
        const multiplier = result.multiplier || 0;
        const payout = result.payout || 0;
        setBettingSuccess(`Cashed out at ${multiplier.toFixed(2)}x for ${payout.toFixed(4)}!`);
        setBettingError(null);
        // Refresh user balance
        if (user && payout > 0) {
          setUser(prev => prev ? { ...prev, balance: prev.balance + payout } : null);
        }
        // Update game state after cashout
        if (result.updatedBet) {
          setGameState(prev => ({
            ...prev,
            activeBets: prev.activeBets.map(bet => 
              bet.id === result.updatedBet.id ? result.updatedBet : bet
            ),
            totalPlayers: result.totalPlayers || prev.totalPlayers,
            totalBetAmount: result.totalBetAmount || prev.totalBetAmount
          }));
        }
      } else {
        setBettingError(result.error || 'Failed to cashout');
        setBettingSuccess(null);
      }
    });

    return () => {
      newSocket.close();
    };
  }, []);

  // Auto-login user when wallet connects
  useEffect(() => {
    if (isWalletConnected && walletInfo && socket && isSocketConnected && !user) {
      loginUser(walletInfo.address, walletInfo.name, walletInfo.email);
    }
  }, [isWalletConnected, walletInfo, socket, isSocketConnected, user]);

  // Note: Wallet auto-connection is now handled by useWallet hook

  // Clear messages after 3 seconds
  useEffect(() => {
    if (bettingError || bettingSuccess) {
      const timer = setTimeout(() => {
        setBettingError(null);
        setBettingSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [bettingError, bettingSuccess]);

  // Place a bet - only allowed during countdown after wallet connection
  const placeBet = useCallback((amount: number, autoCashout?: number) => {
    if (!isWalletConnected || !walletInfo) {
      setBettingError('Please connect your wallet first');
      return;
    }

    if (!socket || !user) {
      setBettingError('Not connected to game server');
      return;
    }

    if (amount <= 0) {
      setBettingError('Bet amount must be greater than 0');
      return;
    }

    if (walletInfo.balance < amount) {
      setBettingError('Insufficient balance');
      return;
    }

    // Only allow betting during countdown phase
    if (gameState.currentGame?.status !== 'COUNTDOWN') {
      setBettingError('Bets can only be placed during countdown phase');
      return;
    }

    // Check if countdown is still active
    if (gameState.countdown <= 0) {
      setBettingError('Countdown has ended, cannot place bet');
      return;
    }

    console.log('Placing bet:', {
      user_address: user.address,
      amount,
      auto_cashout: autoCashout,
      gameStatus: gameState.currentGame?.status,
      countdown: gameState.countdown
    });
    
    socket.emit('placeBet', {
      user_address: user.address,
      amount,
      auto_cashout: autoCashout
    });
  }, [isWalletConnected, walletInfo, socket, user, gameState.currentGame?.status, gameState.countdown]);

  // Cashout a bet
  const cashoutBet = useCallback((betId: string) => {
    if (!socket || !user) {
      setBettingError('Not connected or user not logged in');
      return;
    }

    if (gameState.currentGame?.status !== 'RUNNING') {
      setBettingError('Cannot cashout outside of active game');
      return;
    }

    socket.emit('cashout', {
      user_address: user.address,
      bet_id: betId
    });
  }, [socket, user, gameState.currentGame?.status]);

  // Login user
  const loginUser = useCallback(async (address: string, name: string, email: string) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address, name, email }),
      });

      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        return userData;
      } else {
        const error = await response.json();
        console.error('Login error response:', error);
        
        // If it's a duplicate key error, try to get the existing user
        if (error.error && error.error.includes('duplicate key value violates unique constraint')) {
          console.log('User already exists, fetching existing user...');
          try {
            const getUserResponse = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000'}/api/users/${address}`);
            if (getUserResponse.ok) {
              const existingUser = await getUserResponse.json();
              setUser(existingUser);
              return existingUser;
            }
          } catch (fetchError) {
            console.error('Error fetching existing user:', fetchError);
          }
        }
        
        throw new Error(error.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }, []);

  // Get user's active bets
  const getUserActiveBets = useCallback(() => {
    if (!user) return [];
    return gameState.activeBets.filter(bet => bet.user_address === user.address);
  }, [user, gameState.activeBets]);

  // Get user's bet for current game
  const getUserCurrentBet = useCallback(() => {
    if (!user || !gameState.currentGame) return null;
    return gameState.activeBets.find(bet => 
      bet.user_address === user.address && 
      bet.game_id === gameState.currentGame?.id
    );
  }, [user, gameState.currentGame, gameState.activeBets]);

  return {
    // State
    gameState,
    user,
    isConnected: isSocketConnected,
    isWalletConnected,
    walletInfo,
    walletInitialized,
    bettingError,
    bettingSuccess,
    
    // Actions
    placeBet,
    cashoutBet,
    loginUser,
    
    // Computed
    getUserActiveBets,
    getUserCurrentBet,
    
    // Betting conditions
    canPlaceBet: isWalletConnected && 
                 gameState.currentGame?.status === 'COUNTDOWN' && 
                 gameState.countdown > 0 && 
                 !getUserCurrentBet(),
  };
};
