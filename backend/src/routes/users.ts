import { Router } from 'express';
import { getSupabase } from '../services/supabase.js';

export const usersRouter = Router();

// GET /api/users -> list recent users
usersRouter.get('/', async (_req, res) => {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('id, address, name, email, balance, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json({ users: data ?? [] });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// POST /api/users -> login/signup: prefer existing user by name; else by address; else create
usersRouter.post('/', async (req, res) => {
  const { address, name, email } = req.body as { address?: string; name?: string; email?: string };

  if (!address || !name || !email) {
    return res.status(400).json({ error: 'address, name, and email are required' });
  }

  try {
    const supabase = getSupabase();
    // 1) Try by name (deterministically pick earliest created)
    const byName = await supabase
      .from('users')
      .select('*')
      .eq('name', name)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (byName.error) return res.status(500).json({ error: byName.error.message });
    if (byName.data) {
      // If wallet address differs, attach the latest address for convenience
      if (address && byName.data.address !== address) {
        const updated = await supabase
          .from('users')
          .update({ address, email })
          .eq('id', byName.data.id)
          .select()
          .single();
        if (updated.error) return res.status(500).json({ error: updated.error.message });
        return res.status(200).json(updated.data);
      }
      return res.status(200).json(byName.data);
    }

    // 2) Try by address
    const byAddr = await supabase.from('users').select('*').eq('address', address).maybeSingle();
    if (byAddr.error) return res.status(500).json({ error: byAddr.error.message });
    if (byAddr.data) {
      // attach name/email if missing or changed
      const updated = await supabase
        .from('users')
        .update({ name, email })
        .eq('id', byAddr.data.id)
        .select()
        .single();
      if (updated.error) return res.status(500).json({ error: updated.error.message });
      return res.status(200).json(updated.data);
    }

    // 3) Create new user with initial balance
    const initialBalance = Number(process.env.INITIAL_BALANCE ?? 1000);
    const created = await supabase
      .from('users')
      .insert({ address, name, email, balance: initialBalance })
      .select()
      .single();
    if (created.error) return res.status(500).json({ error: created.error.message });
    return res.status(200).json(created.data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// GET /api/users/:address -> fetch user by wallet address
usersRouter.get('/:address', async (req, res) => {
  const { address } = req.params;
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('address', address)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data) return res.status(404).json({ error: 'User not found' });
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});

// PUT /api/users/:address/balance -> update user balance
usersRouter.put('/:address/balance', async (req, res) => {
  const { address } = req.params;
  const { balance } = req.body as { balance: number };

  if (typeof balance !== 'number' || balance < 0) {
    return res.status(400).json({ error: 'Valid balance (number >= 0) is required' });
  }

  try {
    const supabase = getSupabase();
    
    // First check if user exists
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('address', address)
      .maybeSingle();

    if (fetchError) return res.status(500).json({ error: fetchError.message });
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    // Update balance
    const { data, error } = await supabase
      .from('users')
      .update({ balance })
      .eq('address', address)
      .select()
      .single();

    if (error) return res.status(500).json({ error: error.message });
    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Unknown error' });
  }
});


