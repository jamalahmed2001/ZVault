import type { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';
import { auth } from '@/server/auth';
import { db } from '@/server/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2022-11-15',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await auth(req, res);
  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Look up user in DB
  const user = await db.user.findUnique({ where: { id: session.user.id } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  let stripeCustomerId = user.stripeCustomerId;
  if (!stripeCustomerId) {
    // Create Stripe customer if not present
    const customer = await stripe.customers.create({
      email: user.email || undefined,
      name: user.username || undefined,
    });
    stripeCustomerId = customer.id;
    await db.user.update({ where: { id: user.id }, data: { stripeCustomerId } });
  }

  // Create portal session
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: 'http://localhost:3000/account',
  });

  // Redirect to portal
  res.redirect(303, portalSession.url);
} 