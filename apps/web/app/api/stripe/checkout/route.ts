import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createOrRetrieveCustomer, createCheckoutSession } from '@/lib/stripe/client';
import { SUBSCRIPTION_TIERS } from '@/lib/stripe/config';

// Ensure this route is not statically pre-rendered
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    
    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { tierId, annual } = await req.json();

    // Validate tier
    const tier = SUBSCRIPTION_TIERS[tierId.toUpperCase() as keyof typeof SUBSCRIPTION_TIERS];
    if (!tier || tier.id === 'free' || tier.id === 'enterprise') {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      );
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    // Create or retrieve Stripe customer
    const customer = await createOrRetrieveCustomer({
      userId: user.id,
      email: user.email!,
      name: profile.full_name || undefined,
    });

    // Update profile with Stripe customer ID if needed
    if (!profile.stripe_customer_id) {
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customer.id })
        .eq('id', user.id);
    }

    // Get the appropriate price ID (monthly or annual)
    let priceId = tier.stripePriceId;
    if (annual) {
      // For annual pricing, you would have separate price IDs
      // This is a placeholder - you need to create annual prices in Stripe
      priceId = process.env[`STRIPE_PRICE_${tier.id.toUpperCase()}_ANNUAL`] || priceId;
    }

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not configured for this tier' },
        { status: 500 }
      );
    }

    // Create checkout session
    const origin = req.headers.get('origin') || 'http://localhost:3000';
    const session = await createCheckoutSession({
      customerId: customer.id,
      priceId,
      successUrl: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/pricing`,
      metadata: {
        userId: user.id,
        tierId: tier.id,
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
