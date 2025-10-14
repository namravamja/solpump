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
  created_at: Date;
  updated_at: Date;
}

export interface Game {
  id: string;
  target_multiplier: number;
  current_multiplier: number;
  status: 'COUNTDOWN' | 'RUNNING' | 'COMPLETED' | 'CANCELLED';
  start_time?: Date;
  end_time?: Date;
  final_multiplier?: number;
  created_at: Date;
  updated_at: Date;
}

export interface GameState {
  currentGame: Game | null;
  countdown: number;
  isInitialCountdown: boolean;
  activeBets: Bet[];
  totalPlayers: number;
  totalBetAmount: number;
}

export interface PlaceBetRequest {
  user_address: string;
  amount: number;
  auto_cashout?: number;
}

export interface CashoutRequest {
  user_address: string;
  bet_id: string;
}

export interface GameUpdate {
  type: 'COUNTDOWN' | 'GAME_START' | 'MULTIPLIER_UPDATE' | 'GAME_END' | 'BET_PLACED' | 'BET_CASHED_OUT';
  data: any;
  timestamp: Date;
}
