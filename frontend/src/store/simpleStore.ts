// Simple state management without Redux dependencies
import { useState, useEffect, useCallback } from 'react';

// Global state store
class SimpleStore {
  private state: any = {};
  private listeners: Set<() => void> = new Set();

  getState() {
    return this.state;
  }

  setState(newState: any) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

export const store = new SimpleStore();

// Wallet state
export interface WalletInfo {
  address: string;
  name: string;
  email: string;
  balance: number;
}

interface WalletState {
  isConnected: boolean;
  walletInfo: WalletInfo | null;
  isConnecting: boolean;
  connectionError: string | null;
  initialized: boolean;
}

const initialWalletState: WalletState = {
  isConnected: false,
  walletInfo: null,
  isConnecting: false,
  connectionError: null,
  initialized: false,
};

// Game state
export interface Bet {
  id: string;
  user_id: string;
  user_address: string;
  user_name: string;
  amount: number;
  auto_cashout?: number;
  game_id: string;
  status: 'PENDING' | 'ACTIVE' | 'CASHED_OUT' | 'LOST';
  multiplier_at_cashout?: number;
  payout?: number;
  created_at: string;
}

export interface Game {
  id: string;
  target_multiplier: number;
  current_multiplier: number;
  status: 'COUNTDOWN' | 'RUNNING' | 'COMPLETED';
  final_multiplier?: number;
  created_at: string;
  started_at?: string;
  ended_at?: string;
}

export interface GameState {
  currentGame: Game | null;
  activeBets: Bet[];
  totalPlayers: number;
  totalBetAmount: number;
  countdown: number;
  isInitialCountdown: boolean;
}

interface GameSliceState {
  gameState: GameState;
  isSocketConnected: boolean;
  bettingError: string | null;
  bettingSuccess: string | null;
}

const initialGameState: GameSliceState = {
  gameState: {
    currentGame: null,
    activeBets: [],
    totalPlayers: 0,
    totalBetAmount: 0,
    countdown: 20,
    isInitialCountdown: true,
  },
  isSocketConnected: false,
  bettingError: null,
  bettingSuccess: null,
};

// User state
export interface User {
  address: string;
  name: string;
  email: string;
  balance?: number;
}

interface UserState {
  user: User | null;
}

const initialUserState: UserState = {
  user: null,
};

// Initialize store
store.setState({
  wallet: initialWalletState,
  game: initialGameState,
  user: initialUserState,
});

// Wallet actions
export const walletActions = {
  setInitialized: (initialized: boolean) => {
    const state = store.getState();
    store.setState({
      ...state,
      wallet: { ...state.wallet, initialized }
    });
  },
  setConnecting: (isConnecting: boolean) => {
    const state = store.getState();
    store.setState({
      ...state,
      wallet: { ...state.wallet, isConnecting }
    });
  },
  setConnectionError: (connectionError: string | null) => {
    const state = store.getState();
    store.setState({
      ...state,
      wallet: { ...state.wallet, connectionError }
    });
  },
  connectWallet: (walletInfo: WalletInfo) => {
    const state = store.getState();
    store.setState({
      ...state,
      wallet: {
        ...state.wallet,
        isConnected: true,
        walletInfo,
        isConnecting: false,
        connectionError: null,
      }
    });
  },
  disconnectWallet: () => {
    const state = store.getState();
    store.setState({
      ...state,
      wallet: {
        ...state.wallet,
        isConnected: false,
        walletInfo: null,
        isConnecting: false,
        connectionError: null,
      }
    });
  },
  updateBalance: (balance: number) => {
    const state = store.getState();
    if (state.wallet.walletInfo) {
      store.setState({
        ...state,
        wallet: {
          ...state.wallet,
          walletInfo: { ...state.wallet.walletInfo, balance }
        }
      });
    }
  },
  autoConnectWallet: (walletInfo: WalletInfo) => {
    const state = store.getState();
    store.setState({
      ...state,
      wallet: {
        ...state.wallet,
        isConnected: true,
        walletInfo,
        initialized: true,
      }
    });
  },
};

// Game actions
export const gameActions = {
  setSocketConnected: (isSocketConnected: boolean) => {
    const state = store.getState();
    store.setState({
      ...state,
      game: { ...state.game, isSocketConnected }
    });
  },
  setGameState: (gameState: GameState) => {
    const state = store.getState();
    store.setState({
      ...state,
      game: { ...state.game, gameState }
    });
  },
  updateGameState: (updates: Partial<GameState>) => {
    const state = store.getState();
    store.setState({
      ...state,
      game: {
        ...state.game,
        gameState: { ...state.game.gameState, ...updates }
      }
    });
  },
  setBettingError: (bettingError: string | null) => {
    const state = store.getState();
    store.setState({
      ...state,
      game: { ...state.game, bettingError }
    });
  },
  setBettingSuccess: (bettingSuccess: string | null) => {
    const state = store.getState();
    store.setState({
      ...state,
      game: { ...state.game, bettingSuccess }
    });
  },
  addBet: (bet: Bet) => {
    const state = store.getState();
    const existingIndex = state.game.gameState.activeBets.findIndex(
      (b: Bet) => b.id === bet.id
    );
    let newBets;
    if (existingIndex >= 0) {
      newBets = [...state.game.gameState.activeBets];
      newBets[existingIndex] = bet;
    } else {
      newBets = [...state.game.gameState.activeBets, bet];
    }
    store.setState({
      ...state,
      game: {
        ...state.game,
        gameState: { ...state.game.gameState, activeBets: newBets }
      }
    });
  },
  updateBet: (bet: Bet) => {
    const state = store.getState();
    const index = state.game.gameState.activeBets.findIndex(
      (b: Bet) => b.id === bet.id
    );
    if (index >= 0) {
      const newBets = [...state.game.gameState.activeBets];
      newBets[index] = bet;
      store.setState({
        ...state,
        game: {
          ...state.game,
          gameState: { ...state.game.gameState, activeBets: newBets }
        }
      });
    }
  },
  updateGameStats: (stats: { totalPlayers: number; totalBetAmount: number }) => {
    const state = store.getState();
    store.setState({
      ...state,
      game: {
        ...state.game,
        gameState: {
          ...state.game.gameState,
          totalPlayers: stats.totalPlayers,
          totalBetAmount: stats.totalBetAmount,
        }
      }
    });
  },
};

// User actions
export const userActions = {
  setUser: (user: User | null) => {
    const state = store.getState();
    store.setState({
      ...state,
      user: { user }
    });
  },
  updateUserBalance: (balance: number) => {
    const state = store.getState();
    if (state.user.user) {
      store.setState({
        ...state,
        user: {
          user: { ...state.user.user, balance }
        }
      });
    }
  },
  clearUser: () => {
    const state = store.getState();
    store.setState({
      ...state,
      user: { user: null }
    });
  },
};

// Custom hooks
export const useSimpleStore = () => {
  const [, forceUpdate] = useState({});
  
  useEffect(() => {
    const unsubscribe = store.subscribe(() => {
      forceUpdate({});
    });
    return unsubscribe;
  }, []);

  return store.getState();
};
