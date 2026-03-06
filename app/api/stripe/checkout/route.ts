import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getStripeClient, getUserPlan } from '@/lib/billing';

function originFromRequest(request: Request) {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, '');
  return new URL(request.url).origin;
}

export async function POST(request: Request) {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) {
    return NextResponse.redirect(new URL('/dashboard?billing=not_configured', request.url));
  }

  const plan = await getUserPlan(supabase, user.id);
  if (plan === 'pro') {
    return NextResponse.redirect(new URL('/dashboard?billing=already_pro', request.url));
  }

  const stripe = getStripeClient();
  const origin = originFromRequest(request);

  const { data: existing } = await supabase
    .from('user_subscriptions')
    .select('stripe_customer_id')
    .eq('user_id', user.id)
    .maybeSingle();

  let customerId = existing?.stripe_customer_id ?? null;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email ?? undefined,
      metadata: {
        supabase_user_id: user.id
      }
    });
    customerId = customer.id;

    await supabase.from('user_subscriptions').upsert(
      {
        user_id: user.id,
        stripe_customer_id: customer.id,
        status: 'inactive',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'user_id' }
    );
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1
      }
    ],
    allow_promotion_codes: true,
    success_url: `${origin}/dashboard?billing=success`,
    cancel_url: `${origin}/dashboard?billing=canceled`,
    subscription_data: {
      metadata: {
        supabase_user_id: user.id
      }
    }
  });

  if (!session.url) {
    return NextResponse.redirect(new URL('/dashboard?billing=error', request.url));
  }

  return NextResponse.redirect(session.url);
}
