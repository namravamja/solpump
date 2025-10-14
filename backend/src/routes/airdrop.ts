import { Router } from 'express';

export const airdropRouter = Router();

airdropRouter.get('/', (_req, res) => {
  const amount = Number(process.env.AIRDROP_AMOUNT ?? 0.06);
  const periodSeconds = 9 * 60; // 9 minutes
  const remainingSeconds = Number(process.env.AIRDROP_REMAINING_SECONDS ?? 102); // 01:42 default
  const now = new Date();
  const endsAt = new Date(now.getTime() + remainingSeconds * 1000);
  res.json({ amount, now: now.toISOString(), endsAt: endsAt.toISOString(), periodSeconds });
});


