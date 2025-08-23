import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { validateWebhookSignature } from '@/lib/stripe/client';
import { createClient } from '@/utils/supabase/server';
import type Stripe from 'stripe';

// Ensure this route is not statically pre-rendered
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = headers().get('stripe-signature');

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = validateWebhookSignature(body, signature);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    );
  }

  const supabase = createClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        
        if (session.mode === 'subscription') {
          // Handle subscription creation
          await handleSubscriptionCreated(supabase, session);
        } else if (session.mode === 'payment') {
          // Handle one-time payment (template purchase)
          await handleTemplatePayment(supabase, session);
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function handleSubscriptionCreated(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;

  if (!userId) {
    throw new Error('Missing userId in session metadata');
  }

  // Get subscription details from Stripe
  const { getStripe } = await import('@/lib/stripe/client');
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId) as any;
  
  // Determine tier from price ID
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    throw new Error('No price ID found in subscription');
  }
  const tier = getTierFromPriceId(priceId);

  // Create subscription record
  const { error: subError } = await supabase
    .from('subscriptions')
    .insert({
      user_id: userId,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      stripe_price_id: priceId,
      tier_id: tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    });

  if (subError) {
    console.error('Error creating subscription:', subError);
    throw subError;
  }

  // Update user profile
  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      subscription_tier: tier,
      stripe_customer_id: customerId,
    })
    .eq('id', userId);

  if (profileError) {
    console.error('Error updating profile:', profileError);
  }

  // Set initial usage limits based on tier
  await setUsageLimits(supabase, userId, tier);
}

async function handleSubscriptionUpdate(
  supabase: any,
  subscription: any
) {
  const priceId = subscription.items.data[0]?.price?.id;
  if (!priceId) {
    throw new Error('No price ID found in subscription');
  }
  const tier = getTierFromPriceId(priceId);

  // Update subscription record
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      stripe_price_id: priceId,
      tier_id: tier,
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000),
      current_period_end: new Date(subscription.current_period_end * 1000),
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    })
    .eq('stripe_subscription_id', subscription.id)
    .select('user_id')
    .single();

  if (error) {
    console.error('Error updating subscription:', error);
    throw error;
  }

  // Update user profile tier
  if (data?.user_id) {
    await supabase
      .from('profiles')
      .update({ subscription_tier: tier })
      .eq('id', data.user_id);

    // Update usage limits
    await setUsageLimits(supabase, data.user_id, tier);
  }
}

async function handleSubscriptionCanceled(
  supabase: any,
  subscription: Stripe.Subscription
) {
  // Update subscription status
  const { data, error } = await supabase
    .from('subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date(),
    })
    .eq('stripe_subscription_id', subscription.id)
    .select('user_id')
    .single();

  if (error) {
    console.error('Error canceling subscription:', error);
    throw error;
  }

  // Downgrade user to free tier
  if (data?.user_id) {
    await supabase
      .from('profiles')
      .update({ subscription_tier: 'free' })
      .eq('id', data.user_id);

    await setUsageLimits(supabase, data.user_id, 'free');
  }
}

async function handleTemplatePayment(
  supabase: any,
  session: Stripe.Checkout.Session
) {
  const userId = session.metadata?.userId;
  const templateId = session.metadata?.templateId;
  
  if (!userId || !templateId) {
    throw new Error('Missing userId or templateId in session metadata');
  }

  const amountPaid = session.amount_total || 0;

  // Record payment
  const { data: payment, error: paymentError } = await supabase
    .from('payments')
    .insert({
      user_id: userId,
      stripe_payment_intent_id: session.payment_intent as string,
      amount: amountPaid,
      currency: session.currency,
      status: 'succeeded',
      type: 'template',
      metadata: { template_id: templateId },
    })
    .select()
    .single();

  if (paymentError) {
    console.error('Error recording payment:', paymentError);
    throw paymentError;
  }

  // Record template purchase
  const { error: purchaseError } = await supabase
    .from('template_purchases')
    .insert({
      user_id: userId,
      template_id: templateId,
      payment_id: payment.id,
      price_paid: amountPaid,
      currency: session.currency,
    });

  if (purchaseError) {
    console.error('Error recording template purchase:', purchaseError);
    throw purchaseError;
  }

  // Increment template usage count
  await supabase.rpc('increment', {
    table_name: 'templates',
    row_id: templateId,
    column_name: 'usage_count',
  });
}

async function handleInvoicePaid(
  supabase: any,
  invoice: Stripe.Invoice
) {
  const { error } = await supabase
    .from('invoices')
    .insert({
      user_id: invoice.metadata?.userId,
      stripe_invoice_id: invoice.id,
      stripe_invoice_url: invoice.hosted_invoice_url,
      stripe_pdf_url: invoice.invoice_pdf,
      amount_paid: invoice.amount_paid,
      amount_due: invoice.amount_due,
      currency: invoice.currency,
      status: 'paid',
      period_start: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
      period_end: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
      paid_at: new Date(),
    });

  if (error) {
    console.error('Error recording invoice:', error);
  }
}

async function handlePaymentFailed(
  supabase: any,
  invoice: any
) {
  // Notify user of payment failure
  console.log('Payment failed for invoice:', invoice.id);
  
  // You could send an email notification here
  // Or update subscription status to 'past_due'
  
  const subscriptionId = invoice.subscription as string;
  if (subscriptionId) {
    await supabase
      .from('subscriptions')
      .update({ status: 'past_due' })
      .eq('stripe_subscription_id', subscriptionId);
  }
}

function getTierFromPriceId(priceId: string): string {
  // Map price IDs to tiers
  const priceToTier: Record<string, string> = {
    [process.env.STRIPE_PRICE_STARTER_MONTHLY!]: 'starter',
    [process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY!]: 'professional',
    // Add more mappings as needed
  };
  
  return priceToTier[priceId] || 'free';
}

async function setUsageLimits(
  supabase: any,
  userId: string,
  tier: string
) {
  const { SUBSCRIPTION_TIERS } = await import('@/lib/stripe/config');
  const tierConfig = SUBSCRIPTION_TIERS[tier.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS];
  
  if (!tierConfig) return;

  const periodStart = new Date();
  periodStart.setDate(1); // Start of month
  periodStart.setHours(0, 0, 0, 0);
  
  const periodEnd = new Date(periodStart);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await supabase
    .from('usage_limits')
    .upsert({
      user_id: userId,
      contracts_limit: tierConfig.limits.contractsPerMonth === -1 ? null : tierConfig.limits.contractsPerMonth,
      ai_requests_limit: tierConfig.limits.aiRequestsPerMonth === -1 ? null : tierConfig.limits.aiRequestsPerMonth,
      api_calls_limit: (tierConfig.limits as any).apiCalls === -1 ? null : (tierConfig.limits as any).apiCalls,
      storage_limit_bytes: tierConfig.limits.storage === 'unlimited' ? null : parseStorageLimit(tierConfig.limits.storage),
      period_start: periodStart,
      period_end: periodEnd,
    }, {
      onConflict: 'user_id,period_start',
    });
}

function parseStorageLimit(storage: string): number {
  const units: Record<string, number> = {
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024,
  };
  
  const match = storage.match(/(\d+)(MB|GB)/);
  if (match) {
    return parseInt(match[1]!) * (units[match[2]!] || 0);
  }
  
  return 0;
}
