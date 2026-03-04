import { customAlphabet } from 'nanoid'; // Using nanoid for CUID-like functionality
import { config } from './config';
import Decimal from 'decimal.js';
import crypto from 'crypto';

// Configure Decimal globally
Decimal.set({ precision: config.decimalPrecision });

// Generate CUID-like strings using nanoid
// CUIDs start with 'c' and are 25 chars long, using base36 [0-9a-z]
// nanoid can generate similar entropy and format
const alphabet = '0123456789abcdefghijklmnopqrstuvwxyz';
const nanoidCuid = customAlphabet(alphabet, 24); // 24 chars + 'c' prefix = 25
export const generateCuid = (): string => `c${nanoidCuid()}`;

// Quantize Decimal values like ROUND_DOWN in Python
export const quantizeDecimal = (value: Decimal, precisionDecimal: Decimal | string): Decimal => {
    // Decimal.js rounding modes: https://mikemcl.github.io/decimal.js/#rounding-modes
    // ROUND_DOWN = 1
    return value.toDecimalPlaces(new Decimal(precisionDecimal).decimalPlaces(), Decimal.ROUND_DOWN);
};

// Helper to generate safe names (similar to Python version)
export const getSafeDockerName = (dbUserId: string, userId: string, invoiceId: string): string => {
    const safeDbUserId = String(dbUserId).replace(/[^a-zA-Z0-9-_]/g, '');
    const safeUserId = String(userId).replace(/[^a-zA-Z0-9-_]/g, '');
    const safeInvoiceId = String(invoiceId).replace(/[^a-zA-Z0-9-_]/g, '');
    const name = `DBUID-${safeDbUserId}_UID-${safeUserId}_IID-${safeInvoiceId}`;
    // Limit length for hostname compatibility
    return name.substring(0, 63);
};

// Delay helper
export const delay = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

export async function getAccessToken({
  apiKey,
  instanceId,
  version,
  totalTransactions,
  calendarMonthUsage,
}: {
  apiKey: string;
  instanceId: string;
  version?: string;
  totalTransactions: number;
  calendarMonthUsage?: number;
}): Promise<{ accessToken: string; expiresAt: number }> {
  const res = await fetch('https://z-vault.vercel.app/api/license/activate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ apiKey, usage: totalTransactions, instanceId, version, calendarMonthUsage }),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error('Failed to get access token');
  }
  return res.json() as Promise<{ accessToken: string; expiresAt: number }>;
}

// Verifies a JWT-like access token (synchronous, minimal dependencies)
// Throws on invalid token, returns decoded payload if valid
export function verifyToken(token: string, secretOrPublicKey: string): any {
  // Only use built-in Buffer and JSON, no extra packages
  // Assumes JWT format: header.payload.signature (base64url)
  const [headerB64, payloadB64, signatureB64] = token.split('.');
  if (!headerB64 || !payloadB64 || !signatureB64) {
    throw new Error('Invalid token format');
  }
  // Decode header to check algorithm
  const headerJson = Buffer.from(headerB64, 'base64').toString('utf8');
  let header;
  try {
    header = JSON.parse(headerJson);
  } catch {
    throw new Error('Invalid token header');
  }
  const alg = header.alg;
  const data = `${headerB64}.${payloadB64}`;
  const signature = signatureB64
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    + '==='.slice((signatureB64.length + 3) % 4); // pad base64
  let valid = false;
  if (alg === 'RS256') {
    // RSA SHA256
    valid = crypto.verify(
      'RSA-SHA256',
      Buffer.from(data),
      {
        key: secretOrPublicKey,
        padding: crypto.constants.RSA_PKCS1_PADDING,
      },
      Buffer.from(signature, 'base64')
    );
  } else if (alg === 'HS256') {
    // HMAC SHA256
    const expectedSig = crypto
      .createHmac('sha256', secretOrPublicKey)
      .update(data)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
    valid = signatureB64 === expectedSig;
  } else {
    throw new Error('Unsupported JWT algorithm');
  }
  if (!valid) {
    throw new Error('Invalid token signature');
  }
  // Decode payload
  const payloadJson = Buffer.from(payloadB64, 'base64').toString('utf8');
  return JSON.parse(payloadJson);
}

// Increment usage for a license (similar to getAccessToken)
export async function incrementUsage({
  apiKey,
  instanceId,
  version,
  totalTransactions,
  calendarMonthUsage,
}: {
  apiKey: string;
  instanceId: string;
  version?: string;
  totalTransactions: number;
  calendarMonthUsage?: number;
}): Promise<{ success: boolean }> {
  const body: any = { apiKey, usage: totalTransactions, instanceId, version };
  if (typeof calendarMonthUsage === 'number') {
    body.calendarMonthUsage = calendarMonthUsage;
  }
  const res = await fetch('https://z-vault.vercel.app/api/license/increment-usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const error = await res.json();
    throw new Error('Failed to increment usage');
  }
  return res.json() as Promise<{ success: boolean }>;
}
