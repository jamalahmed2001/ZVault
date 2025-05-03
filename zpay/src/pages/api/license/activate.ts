import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import { db } from '@/server/db';

const PRIVATE_KEY_PATH = path.join(
  process.cwd(),
  'config',
  'jwt-private.pem'
);

// Validate API key using Prisma
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
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { apiKey, usage, monthlyUsage, instanceId, version } = req.body;
  try {
    const key = await validateApiKey(apiKey);
    // Prevent license issuance if usage is more than 0
    if (key.monthlyUsage > 250 || monthlyUsage > 250) {
      return res.status(403).json({ error: 'Usage limit exceeded for this API key' });
    }
    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + 24 * 60 * 60;
    const payload = {
      licenseId: key.id,
      clientId: key.userId,
      tier: key.name || 'payg',
      txCap: key.usageLimit || 250,
      txUsed: key.monthlyUsage || 0, // TODO: Implement usage tracking
      issuedAt: now,
      expiresAt,
      instanceId,
    };
    // console.log('payload', payload);
    const privateKey = fs.readFileSync(PRIVATE_KEY_PATH, 'utf8');
    const token = jwt.sign(payload, privateKey, {
      algorithm: 'RS256',
      expiresIn: now + 24 * 60 * 60,
    });
    return res.status(200).json({ accessToken: token, expiresAt });
  } catch (err: any) {
    return res.status(401).json({ error: err.message });
  }
} 