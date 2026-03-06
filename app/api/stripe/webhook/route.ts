import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { getStripeClient, getSupabaseAdminClient, getUserPlanFromStatus } from '@/lib/billing';

export const runtime = 'nodejs';

function toIsoOrNull(value: number | null | undefined) {
  if (!value) return null;
  return new Date(value * 1000).toISOString();
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const supabase = getSupabaseAdminClient();
  const raw = subscription as Stripe.Subscription & {
    current_period_end?: number;
    cancel_at_period_end?: boolean;
  };

  const stripeCustomerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer?.id;
  const stripePriceId = subscription.items.data[0]?.price?.id ?? null;
  const stripeProduct = subscription.items.data[0]?.price?.product;
  const stripeProductId = typeof stripeProduct === 'string' ? stripeProduct : stripeProduct?.id ?? null;
  const stripeSubscriptionId = subscription.id;
  const status = subscription.status;
  const currentPeriodEnd = toIsoOrNull(raw.current_period_end);
  const cancelAtPeriodEnd = Boolean(raw.cancel_at_period_end);
  const userIdFromMetadata = subscription.metadata?.supabase_user_id ?? null;

  let userId = userIdFromMetadata;
  if (!userId && stripeCustomerId) {
    const { data: existing } = await supabase
      .from('user_subscriptions')
      .select('user_id')
      .eq('stripe_customer_id', stripeCustomerId)
      .maybeSingle();
    userId = existing?.user_id ?? null;
  }

  if (!userId) {
    return;
  }

  await supabase.from('user_subscriptions').upsert(
    {
      user_id: userId,
      stripe_customer_id: stripeCustomerId,
      stripe_subscription_id: stripeSubscriptionId,
      stripe_price_id: stripePriceId,
      stripe_product_id: stripeProductId,
      status,
      current_period_end: currentPeriodEnd,
      cancel_at_period_end: cancelAtPeriodEnd,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: 'user_id'
    }
  );

  if (getUserPlanFromStatus(status) !== 'pro') {
    await supabase
      .from('proof_pages')
      .update({
        cta_enabled: false,
        cta_label: null,
        cta_url: null
      })
      .eq('user_id', userId);
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;
  if (!subscriptionId) return;

  const stripe = getStripeClient();
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  await syncSubscription(subscription);
}

export async function POST(request: Request) {
  const stripe = getStripeClient();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: 'missing_webhook_secret' }, { status: 500 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'missing_signature' }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
  }

  if (
    event.type === 'customer.subscription.created' ||
    event.type === 'customer.subscription.updated' ||
    event.type === 'customer.subscription.deleted'
  ) {
    await syncSubscription(event.data.object as Stripe.Subscription);
  }

  return NextResponse.json({ received: true });
}
