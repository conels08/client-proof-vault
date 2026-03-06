import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const PRO_ACCESS_STATUSES = new Set(['trialing', 'active']);

export type UserPlan = 'free' | 'pro';

export type SubscriptionRow = {
  user_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  updated_at: string;
};

export function getUserPlanFromStatus(status: string | null | undefined): UserPlan {
  return status && PRO_ACCESS_STATUSES.has(status) ? 'pro' : 'free';
}

export async function getUserPlan(
  supabase: any,
  userId: string
): Promise<UserPlan> {
  const { data } = await supabase.from('user_subscriptions').select('status').eq('user_id', userId).maybeSingle();
  return getUserPlanFromStatus(data?.status);
}

export function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error('Missing STRIPE_SECRET_KEY');
  }

  return new Stripe(key, {
    apiVersion: '2026-02-25.clover'
  });
}

export function getSupabaseAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRole) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  return createClient(supabaseUrl, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
