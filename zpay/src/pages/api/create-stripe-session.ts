import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { auth } from "@/server/auth";
import { db } from "@/server/db";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { amount, currency, subscription, priceId } = req.body;
    if (subscription) {
      if (!priceId) {
        return res.status(400).json({ error: 'Missing Stripe priceId for subscription' });
      }
      const session = await auth(req, res);
      if (!session?.user?.id) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      let user = await db.user.findUnique({ where: { id: session.user.id } });
      let stripeCustomerId = user?.stripeCustomerId;
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user?.email || undefined,
          name: user?.username || undefined,
        });
        stripeCustomerId = customer.id;
        await db.user.update({ where: { id: session.user.id }, data: { stripeCustomerId } });
      }
      const sessionStripe = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${req.headers.origin}/account?payment=success`,
        cancel_url: `${req.headers.origin}/account?payment=cancel`,
        metadata: {
          userId: session.user.id,
        },
        customer: stripeCustomerId,
      });
      return res.status(200).json({ sessionId: sessionStripe.id });
    }

    if (!amount || !currency) {
      return res.status(400).json({ error: 'Missing amount or currency' });
    }

    const session = await auth(req, res);
    if (!session?.user?.id) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    let user = await db.user.findUnique({ where: { id: session.user.id } });
    let stripeCustomerId = user?.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user?.email || undefined,
        name: user?.username || undefined,
      });
      stripeCustomerId = customer.id;
      await db.user.update({ where: { id: session.user.id }, data: { stripeCustomerId } });
    }

    const sessionStripe = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency,
            product_data: {
              name: 'ZVault API Key Access',
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/account?payment=success`,
      cancel_url: `${req.headers.origin}/account?payment=cancel`,
      metadata: {
        userId: session.user.id,
      },
      customer: stripeCustomerId,
    });

    return res.status(200).json({ sessionId: sessionStripe.id });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
} 