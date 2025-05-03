import type { NextApiRequest, NextApiResponse } from 'next';
import { db } from '@/server/db';

// Validate API key using Prisma (copied from activate.ts for reuse)
async function validateApiKey(apiKey: string) {
  if (!apiKey) throw new Error('API key required');
  const key = await db.apiKey.findUnique({
    where: { key: apiKey },
  });
  if (!key || !key.isActive) throw new Error('Invalid or inactive API key');
  return key;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { apiKey, usage, monthlyUsage } = req.body;

  try {
    const key = await validateApiKey(apiKey);
    let updateData = {};
    if (
      (typeof usage === 'number' && usage > key.totalUsage) ||
      (typeof monthlyUsage === 'number' && monthlyUsage > key.monthlyUsage)
    ) {
      updateData = {
        totalUsage: typeof usage === 'number' && usage > key.totalUsage ? usage : { increment: 1 },
        monthlyUsage: typeof monthlyUsage === 'number' && monthlyUsage > key.monthlyUsage ? monthlyUsage : { increment: 1 },
      };
    } else {
      updateData = { totalUsage: { increment: 1 }, monthlyUsage: { increment: 1 } };
    }
    const updated = await db.apiKey.update({
      where: { id: key.id },
      data: updateData,
    });
    return res.status(200).json({ totalUsage: updated.totalUsage, monthlyUsage: updated.monthlyUsage });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
} 