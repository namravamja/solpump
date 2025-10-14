import { Router } from 'express';

export const router = Router();

router.get('/', (_req, res) => {
  const initialBalance = Number(process.env.INITIAL_BALANCE ?? 1000);
  const ui = {
    brand: {
      title: 'SOLPUMP: SOLANA\'S MOST TRUSTED SOLANA CASINO'
    },
    defaults: {
      initialBalance
    }
  };
  res.json({ ok: true, uptime: process.uptime(), ui });
});


