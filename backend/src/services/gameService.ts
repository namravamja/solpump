import { v4 as uuidv4 } from 'uuid';
import { getSupabase } from './supabase.js';
import type { Game, GameState, Bet } from '../model/types.js';

export class GameService {
  private currentGame: Game | null = null;
  private countdown: number = 20;
  private isInitialCountdown: boolean = true;
  private gameInterval: NodeJS.Timeout | null = null;
  private countdownInterval: NodeJS.Timeout | null = null;
  private multiplierUpdateInterval: NodeJS.Timeout | null = null;
  private onGameUpdate: ((update: any) => void) | null = null;

  constructor() {
    this.initializeGame();
  }

  public setGameUpdateCallback(callback: (update: any) => void) {
    this.onGameUpdate = callback;
  }

  private emitUpdate(type: string, data: any) {
    if (this.onGameUpdate) {
      this.onGameUpdate({
        type,
        data,
        timestamp: new Date()
      });
    }
  }

  private async initializeGame() {
    // Create initial game with random target multiplier
    const targetMultiplier = Math.random() * 6 + 1; // Random between 1-7
    const supabase = getSupabase();
    
    console.log('🎮 Creating initial game with target multiplier:', targetMultiplier.toFixed(2));
    
    const { data: game, error } = await supabase
      .from('games')
      .insert({
        target_multiplier: parseFloat(targetMultiplier.toFixed(2)),
        current_multiplier: 1.0,
        status: 'COUNTDOWN'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create initial game:', error);
      return;
    }

    console.log('🎮 Initial game created:', game);
    this.currentGame = game;
    this.startInitialCountdown();
    
    // Emit initial game state
    this.emitUpdate('GAME_INITIALIZED', this.currentGame);
  }

  private startInitialCountdown() {
    this.countdown = 20;
    this.isInitialCountdown = true;
    this.emitUpdate('COUNTDOWN', { countdown: this.countdown, isInitial: true });

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      this.emitUpdate('COUNTDOWN', { countdown: this.countdown, isInitial: this.isInitialCountdown });

      if (this.countdown <= 0) {
        this.startGame();
      }
    }, 1000);
  }

  private async startGame() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }

    if (!this.currentGame) return;

    const supabase = getSupabase();
    
    // Update game status to RUNNING
    const { error } = await supabase
      .from('games')
      .update({ 
        status: 'RUNNING',
        start_time: new Date().toISOString()
      })
      .eq('id', this.currentGame.id);

    if (error) {
      console.error('Failed to start game:', error);
      return;
    }

    this.currentGame.status = 'RUNNING';
    this.currentGame.start_time = new Date();
    this.isInitialCountdown = false;

    this.emitUpdate('GAME_START', this.currentGame);

    this.startMultiplierAnimation();
  }

  private startMultiplierAnimation() {
    if (!this.currentGame) return;

    const startTime = Date.now();
    const initialDelay = 3000; // 3 seconds delay at 1.00× position
    const fixedSpeed = 0.1; // Fixed speed: 0.1× per second

    const updateMultiplier = () => {
      const elapsed = Date.now() - startTime;
      
      if (elapsed <= initialDelay) {
        // Stay at 1.00× for initial delay
        this.updateCurrentMultiplier(1.0);
        this.multiplierUpdateInterval = setTimeout(updateMultiplier, 100);
      } else {
        // Calculate multiplier with fixed speed
        const animationElapsed = elapsed - initialDelay;
        const secondsElapsed = animationElapsed / 1000;
        const value = 1.0 + fixedSpeed * secondsElapsed;
        const cappedValue = Math.min(value, this.currentGame!.target_multiplier);

        this.updateCurrentMultiplier(parseFloat(cappedValue.toFixed(2)));

        if (value < this.currentGame!.target_multiplier) {
          this.multiplierUpdateInterval = setTimeout(updateMultiplier, 100);
        } else {
          this.endGame();
        }
      }
    };

    updateMultiplier();
  }

  private async updateCurrentMultiplier(multiplier: number) {
    if (!this.currentGame) return;

    const supabase = getSupabase();
    
    const { error } = await supabase
      .from('games')
      .update({ current_multiplier: multiplier })
      .eq('id', this.currentGame.id);

    if (error) {
      console.error('Failed to update multiplier:', error);
      return;
    }

    this.currentGame.current_multiplier = multiplier;
    this.emitUpdate('MULTIPLIER_UPDATE', { 
      multiplier,
      gameId: this.currentGame.id 
    });

    // Check for auto-cashouts
    await this.checkAutoCashouts(multiplier);
  }

  private async checkAutoCashouts(currentMultiplier: number) {
    if (!this.currentGame) return;

    const supabase = getSupabase();
    
    // Get all active bets with auto-cashout at or below current multiplier
    const { data: autoCashoutBets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('game_id', this.currentGame.id)
      .eq('status', 'ACTIVE')
      .not('auto_cashout', 'is', null)
      .lte('auto_cashout', currentMultiplier);

    if (error) {
      console.error('Failed to fetch auto-cashout bets:', error);
      return;
    }

    // Process auto-cashouts
    for (const bet of autoCashoutBets || []) {
      await this.processCashout(bet.id, bet.user_address, currentMultiplier);
    }
  }

  private async endGame() {
    if (!this.currentGame) return;

    const finalMultiplier = this.currentGame.target_multiplier;
    const supabase = getSupabase();

    // Update game status
    const { error: gameError } = await supabase
      .from('games')
      .update({ 
        status: 'COMPLETED',
        end_time: new Date().toISOString(),
        final_multiplier: finalMultiplier
      })
      .eq('id', this.currentGame.id);

    if (gameError) {
      console.error('Failed to end game:', gameError);
    }

    // Process remaining active bets (they all lose)
    const { data: activeBets, error: betsError } = await supabase
      .from('bets')
      .select('*')
      .eq('game_id', this.currentGame.id)
      .eq('status', 'ACTIVE');

    if (betsError) {
      console.error('Failed to fetch active bets:', betsError);
    } else {
      for (const bet of activeBets || []) {
        await supabase
          .from('bets')
          .update({ status: 'LOST' })
          .eq('id', bet.id);
      }
    }

    this.emitUpdate('GAME_END', { 
      gameId: this.currentGame.id,
      finalMultiplier 
    });

    // Start countdown for next game
    setTimeout(() => {
      this.startNextGame();
    }, 1000); // 1 second delay before next countdown
  }

  private async startNextGame() {
    // Create new game
    const targetMultiplier = Math.random() * 6 + 1;
    const supabase = getSupabase();
    
    const { data: newGame, error } = await supabase
      .from('games')
      .insert({
        target_multiplier: parseFloat(targetMultiplier.toFixed(2)),
        current_multiplier: 1.0,
        status: 'COUNTDOWN'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create new game:', error);
      return;
    }

    this.currentGame = newGame;
    this.startCountdown();
  }

  private startCountdown() {
    this.countdown = 20;
    this.isInitialCountdown = false;
    this.emitUpdate('COUNTDOWN', { countdown: this.countdown, isInitial: false });

    this.countdownInterval = setInterval(() => {
      this.countdown--;
      this.emitUpdate('COUNTDOWN', { countdown: this.countdown, isInitial: false });

      if (this.countdown <= 0) {
        this.startGame();
      }
    }, 1000);
  }

  public async placeBet(userAddress: string, amount: number, autoCashout?: number): Promise<{ success: boolean; betId?: string; bet?: any; amount?: number; totalPlayers?: number; totalBetAmount?: number; error?: string }> {
    if (!this.currentGame) {
      return { success: false, error: 'No active game' };
    }

    if (this.currentGame.status !== 'COUNTDOWN') {
      return { success: false, error: 'Cannot place bet during active game' };
    }

    const supabase = getSupabase();

    // Get user info
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('address', userAddress)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    if (user.balance < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    // Deduct bet amount from user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance - amount })
      .eq('id', user.id);

    if (balanceError) {
      return { success: false, error: 'Failed to deduct balance' };
    }

    // Create bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: user.id,
        user_address: userAddress,
        user_name: user.name,
        amount,
        auto_cashout: autoCashout,
        game_id: this.currentGame.id,
        status: 'PENDING'
      })
      .select()
      .single();

    if (betError) {
      // Refund the balance
      await supabase
        .from('users')
        .update({ balance: user.balance })
        .eq('id', user.id);
      
      return { success: false, error: 'Failed to place bet' };
    }

    // Update bet status to ACTIVE when game starts
    if (this.currentGame.status === 'COUNTDOWN') {
      await supabase
        .from('bets')
        .update({ status: 'ACTIVE' })
        .eq('id', bet.id);
    }

    // Get updated game state
    const gameState = await this.getGameState();
    
    this.emitUpdate('BET_PLACED', { bet, gameState });
    return { 
      success: true, 
      betId: bet.id,
      bet: bet,
      amount: amount,
      totalPlayers: gameState.totalPlayers,
      totalBetAmount: gameState.totalBetAmount
    };
  }

  public async cashoutBet(userAddress: string, betId: string): Promise<{ success: boolean; payout?: number; multiplier?: number; updatedBet?: any; totalPlayers?: number; totalBetAmount?: number; error?: string }> {
    if (!this.currentGame || this.currentGame.status !== 'RUNNING') {
      return { success: false, error: 'Cannot cashout outside of active game' };
    }

    const currentMultiplier = this.currentGame.current_multiplier;
    return await this.processCashout(betId, userAddress, currentMultiplier);
  }

  private async processCashout(betId: string, userAddress: string, multiplier: number): Promise<{ success: boolean; payout?: number; multiplier?: number; updatedBet?: any; totalPlayers?: number; totalBetAmount?: number; error?: string }> {
    const supabase = getSupabase();

    // Get bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
      .eq('user_address', userAddress)
      .eq('status', 'ACTIVE')
      .single();

    if (betError || !bet) {
      return { success: false, error: 'Bet not found or not active' };
    }

    const payout = bet.amount * multiplier;

    // Update bet
    const { error: updateError } = await supabase
      .from('bets')
      .update({
        status: 'CASHED_OUT',
        multiplier_at_cashout: multiplier,
        payout
      })
      .eq('id', betId);

    if (updateError) {
      return { success: false, error: 'Failed to update bet' };
    }

    // Add payout to user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('address', userAddress)
      .single();

    if (userError || !user) {
      return { success: false, error: 'User not found' };
    }

    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance + payout })
      .eq('address', userAddress);

    if (balanceError) {
      return { success: false, error: 'Failed to update balance' };
    }

    // Get updated bet and game state
    const { data: updatedBet } = await supabase
      .from('bets')
      .select('*')
      .eq('id', betId)
      .single();
    
    const gameState = await this.getGameState();
    
    this.emitUpdate('BET_CASHED_OUT', { betId, multiplier, payout, updatedBet, gameState });
    return { 
      success: true, 
      payout,
      multiplier,
      updatedBet,
      totalPlayers: gameState.totalPlayers,
      totalBetAmount: gameState.totalBetAmount
    };
  }

  public async getGameState(): Promise<GameState> {
    const supabase = getSupabase();
    
    // Get active bets for current game
    let activeBets: Bet[] = [];
    if (this.currentGame) {
      const { data: bets } = await supabase
        .from('bets')
        .select('*')
        .eq('game_id', this.currentGame.id)
        .in('status', ['PENDING', 'ACTIVE'])
        .order('created_at', { ascending: false });
      
      activeBets = bets || [];
    }

    const totalPlayers = activeBets.length;
    const totalBetAmount = activeBets.reduce((sum, bet) => sum + bet.amount, 0);

    const gameState = {
      currentGame: this.currentGame,
      countdown: this.countdown,
      isInitialCountdown: this.isInitialCountdown,
      activeBets,
      totalPlayers,
      totalBetAmount
    };

    console.log('🎮 getGameState called, returning:', gameState);
    console.log('🎮 Current game target multiplier:', this.currentGame?.target_multiplier);

    return gameState;
  }

  public cleanup() {
    if (this.gameInterval) clearInterval(this.gameInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    if (this.multiplierUpdateInterval) clearTimeout(this.multiplierUpdateInterval);
  }
}
