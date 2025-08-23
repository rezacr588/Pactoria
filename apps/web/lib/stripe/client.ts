/**
 * Stripe Client Utilities
 */

import Stripe from 'stripe';
import { STRIPE_CONFIG } from './config';

// Lazy initialize Stripe client
let stripeInstance: Stripe | null = null;

export function getStripe(): Stripe {
  if (!stripeInstance) {
    if (!STRIPE_CONFIG.secretKey) {
      throw new Error('Stripe secret key is required');
    }
    stripeInstance = new Stripe(STRIPE_CONFIG.secretKey, {
      apiVersion: STRIPE_CONFIG.apiVersion,
      typescript: true,
    });
  }
  return stripeInstance;
}

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
  const existingCustomers = await getStripe().customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    const customer = existingCustomers.data[0];
    if (customer) {
      return customer;
    }
  }

  // Create new customer
  const customerData: any = {
    email,
    metadata: {
      userId,
    },
  };
  
  if (name) {
    customerData.name = name;
  }
  
  const customer = await getStripe().customers.create(customerData);

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
  const session = await getStripe().checkout.sessions.create({
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
  const session = await getStripe().checkout.sessions.create({
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
  const subscriptions = await getStripe().subscriptions.list({
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
    return await getStripe().subscriptions.cancel(subscriptionId);
  } else {
    // Cancel at period end
    return await getStripe().subscriptions.update(subscriptionId, {
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
  const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
  
  const firstItem = subscription.items.data[0];
  if (!firstItem) {
    throw new Error('No subscription items found');
  }
  
  const updatedSubscription = await getStripe().subscriptions.update(subscriptionId, {
    items: [
      {
        id: firstItem.id,
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
  const session = await getStripe().billingPortal.sessions.create({
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
  const invoices = await getStripe().invoices.list({
    customer: customerId,
    limit,
    expand: ['data.subscription'],
  });

  return invoices.data;
}

/**
 * Create usage record for API calls
 * Note: This function needs to be updated for the new Stripe API version
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
}): Promise<any> {
  // TODO: Update this for the new Stripe API
  console.warn('createUsageRecord not implemented for current Stripe API version');
  return { id: 'usage_record_placeholder', quantity, timestamp, action, subscriptionItemId };
}

/**
 * Validate webhook signature
 */
export function validateWebhookSignature(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return getStripe().webhooks.constructEvent(
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
  const prices = await getStripe().prices.list({
    product: productId,
    active: true,
    expand: ['data.product'],
  });

  return prices.data;
}

/**
 * Apply a coupon to a customer
 * Note: This function needs to be updated for the new Stripe API version
 */
export async function applyCouponToCustomer(
  customerId: string,
  _couponId: string
): Promise<Stripe.Customer> {
  // TODO: Update this for the new Stripe API - coupon application may need different approach
  console.warn('applyCouponToCustomer not implemented for current Stripe API version');
  const customerResponse = await getStripe().customers.retrieve(customerId);
  
  if ('deleted' in customerResponse && customerResponse.deleted) {
    throw new Error('Customer has been deleted');
  }
  
  return customerResponse;
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
  const paymentIntent = await getStripe().paymentIntents.create({
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
