/**
 * Stripe Client Utilities
 */

import Stripe from 'stripe';
import { STRIPE_CONFIG } from './config';

// Initialize Stripe client
export const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: STRIPE_CONFIG.apiVersion,
  typescript: true,
});

/**
 * Create or retrieve a Stripe customer
 */
export async function createOrRetrieveCustomer({
  userId,
  email,
  name,
}: {
  userId: string;
  email: string;
  name?: string;
}): Promise<Stripe.Customer> {
  // First, try to retrieve existing customer by metadata
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  // Create new customer
  const customer = await stripe.customers.create({
    email,
    name,
    metadata: {
      userId,
    },
  });

  return customer;
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession({
  customerId,
  priceId,
  successUrl,
  cancelUrl,
  metadata = {},
}: {
  customerId: string;
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata,
    subscription_data: {
      trial_period_days: 14, // 14-day free trial
      metadata,
    },
    // Enable customer portal
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: {
      enabled: true, // For UK VAT
    },
  });

  return session;
}

/**
 * Create a one-time payment session for templates
 */
export async function createTemplatePaymentSession({
  customerId,
  templateId,
  amount,
  templateName,
  successUrl,
  cancelUrl,
}: {
  customerId: string;
  templateId: string;
  amount: number; // in pence
  templateName: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'payment',
    payment_method_types: ['card'],
    line_items: [
      {
        price_data: {
          currency: 'gbp',
          product_data: {
            name: `Template: ${templateName}`,
            description: 'One-time purchase of contract template',
            metadata: {
              templateId,
            },
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      templateId,
      type: 'template_purchase',
    },
  });

  return session;
}

/**
 * Get customer's subscriptions
 */
export async function getCustomerSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    expand: ['data.default_payment_method'],
  });

  return subscriptions.data;
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string,
  immediately: boolean = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return await stripe.subscriptions.cancel(subscriptionId);
  } else {
    // Cancel at period end
    return await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
  }
}

/**
 * Update subscription (upgrade/downgrade)
 */
export async function updateSubscription(
  subscriptionId: string,
  newPriceId: string
): Promise<Stripe.Subscription> {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  
  const updatedSubscription = await stripe.subscriptions.update(subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: newPriceId,
      },
    ],
    proration_behavior: 'create_prorations',
  });

  return updatedSubscription;
}

/**
 * Create a billing portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
): Promise<Stripe.BillingPortal.Session> {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return session;
}

/**
 * Get invoice history
 */
export async function getInvoiceHistory(
  customerId: string,
  limit: number = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
    expand: ['data.subscription'],
  });

  return invoices.data;
}

/**
 * Create usage record for API calls
 */
export async function createUsageRecord({
  subscriptionItemId,
  quantity,
  timestamp,
  action = 'increment',
}: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: number;
  action?: 'increment' | 'set';
}): Promise<Stripe.UsageRecord> {
  const usageRecord = await stripe.subscriptionItems.createUsageRecord(
    subscriptionItemId,
    {
      quantity,
      timestamp: timestamp || Math.floor(Date.now() / 1000),
      action,
    }
  );

  return usageRecord;
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_CONFIG.webhookSecret
  );
}

/**
 * Get product pricing information
 */
export async function getProductPrices(
  productId: string
): Promise<Stripe.Price[]> {
  const prices = await stripe.prices.list({
    product: productId,
    active: true,
    expand: ['data.product'],
  });

  return prices.data;
}

/**
 * Apply a coupon to a customer
 */
export async function applyCouponToCustomer(
  customerId: string,
  couponId: string
): Promise<Stripe.Customer> {
  const customer = await stripe.customers.update(customerId, {
    coupon: couponId,
  });

  return customer;
}

/**
 * Create a payment intent for custom amounts
 */
export async function createPaymentIntent({
  amount,
  currency = 'gbp',
  customerId,
  metadata = {},
}: {
  amount: number;
  currency?: string;
  customerId: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount,
    currency,
    customer: customerId,
    metadata,
    automatic_payment_methods: {
      enabled: true,
    },
  });

  return paymentIntent;
}
