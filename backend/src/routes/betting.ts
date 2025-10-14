import { Router } from 'express';
import { getSupabase } from '../services/supabase.js';
import type { PlaceBetRequest, CashoutRequest } from '../model/types.js';

export const bettingRouter = Router();

// GET /api/betting/game-state -> get current game state
bettingRouter.get('/game-state', async (req, res) => {
  try {
    // This will be handled by the game service via WebSocket
    // For now, return a basic response
    res.status(200).json({ 
      message: 'Use WebSocket connection for real-time game state' 
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// POST /api/betting/place-bet -> place a bet
bettingRouter.post('/place-bet', async (req, res) => {
  try {
    const { user_address, amount, auto_cashout }: PlaceBetRequest = req.body;

    if (!user_address || !amount || amount <= 0) {
      return res.status(400).json({ 
        error: 'user_address and amount (greater than 0) are required' 
      });
    }

    // Get user info
    const supabase = getSupabase();
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('address', user_address)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Get current game
    const { data: currentGame, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'COUNTDOWN')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (gameError || !currentGame) {
      return res.status(400).json({ error: 'No active game to bet on' });
    }

    // Deduct bet amount from user balance
    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance - amount })
      .eq('id', user.id);

    if (balanceError) {
      return res.status(500).json({ error: 'Failed to deduct balance' });
    }

    // Create bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .insert({
        user_id: user.id,
        user_address: user_address,
        user_name: user.name,
        amount,
        auto_cashout: auto_cashout,
        game_id: currentGame.id,
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
      
      return res.status(500).json({ error: 'Failed to place bet' });
    }

    res.status(200).json({ 
      success: true, 
      betId: bet.id,
      message: 'Bet placed successfully' 
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// POST /api/betting/cashout -> cashout a bet
bettingRouter.post('/cashout', async (req, res) => {
  try {
    const { user_address, bet_id }: CashoutRequest = req.body;

    if (!user_address || !bet_id) {
      return res.status(400).json({ 
        error: 'user_address and bet_id are required' 
      });
    }

    const supabase = getSupabase();

    // Get current game
    const { data: currentGame, error: gameError } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'RUNNING')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (gameError || !currentGame) {
      return res.status(400).json({ error: 'No active game to cashout from' });
    }

    // Get bet
    const { data: bet, error: betError } = await supabase
      .from('bets')
      .select('*')
      .eq('id', bet_id)
      .eq('user_address', user_address)
      .eq('status', 'ACTIVE')
      .single();

    if (betError || !bet) {
      return res.status(404).json({ error: 'Bet not found or not active' });
    }

    const currentMultiplier = currentGame.current_multiplier;
    const payout = bet.amount * currentMultiplier;

    // Update bet
    const { error: updateError } = await supabase
      .from('bets')
      .update({
        status: 'CASHED_OUT',
        multiplier_at_cashout: currentMultiplier,
        payout
      })
      .eq('id', bet_id);

    if (updateError) {
      return res.status(500).json({ error: 'Failed to update bet' });
    }

    // Add payout to user balance
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('balance')
      .eq('address', user_address)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { error: balanceError } = await supabase
      .from('users')
      .update({ balance: user.balance + payout })
      .eq('address', user_address);

    if (balanceError) {
      return res.status(500).json({ error: 'Failed to update balance' });
    }

    res.status(200).json({ 
      success: true, 
      payout,
      multiplier: currentMultiplier,
      message: 'Bet cashed out successfully' 
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// GET /api/betting/user-bets/:address -> get user's betting history
bettingRouter.get('/user-bets/:address', async (req, res) => {
  try {
    const { address } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const supabase = getSupabase();
    const { data: bets, error } = await supabase
      .from('bets')
      .select(`
        *,
        games!inner(target_multiplier, final_multiplier, status as game_status)
      `)
      .eq('user_address', address)
      .order('created_at', { ascending: false })
      .range(Number(offset), Number(offset) + Number(limit) - 1);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ bets: bets || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// GET /api/betting/active-bets -> get all active bets for current game
bettingRouter.get('/active-bets', async (req, res) => {
  try {
    const supabase = getSupabase();
    
    // Get current game
    const { data: currentGame, error: gameError } = await supabase
      .from('games')
      .select('*')
      .in('status', ['COUNTDOWN', 'RUNNING'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (gameError || !currentGame) {
      return res.status(200).json({ bets: [] });
    }

    // Get active bets
    const { data: bets, error } = await supabase
      .from('bets')
      .select('*')
      .eq('game_id', currentGame.id)
      .in('status', ['PENDING', 'ACTIVE'])
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ 
      bets: bets || [],
      gameId: currentGame.id,
      gameStatus: currentGame.status
    });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// GET /api/betting/recent-games -> get recent game results
bettingRouter.get('/recent-games', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const supabase = getSupabase();
    
    const { data: games, error } = await supabase
      .from('games')
      .select('*')
      .eq('status', 'COMPLETED')
      .order('created_at', { ascending: false })
      .limit(Number(limit));

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ games: games || [] });
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});
