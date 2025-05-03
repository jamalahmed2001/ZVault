import type { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { db } from "@/server/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig as string,
      webhookSecret as string
    );
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.metadata?.userId;
    if (userId) {
      // Top up all API keys for this user to 250
      await db.apiKey.updateMany({
        where: { userId },
        data: { usageLimit: 250 },
      });
      // Generate an API key for the user if they don't have one
      const existingKeys = await db.apiKey.count({ where: { userId } });
      if (existingKeys === 0) {
        const crypto = await import('crypto');
        const randomBytes = crypto.randomBytes(24);
        const apiKey = 'zv_live_' + randomBytes.toString('base64url');
        await db.apiKey.create({
          data: {
            key: apiKey,
            name: 'Default API Key',
            userId,
            transactionFee: 2.5,
          },
        });
      }
    }
  }

  res.status(200).json({ received: true });
}
