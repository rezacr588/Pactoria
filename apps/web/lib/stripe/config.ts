/**
 * Stripe Configuration and Types
 */

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  secretKey: process.env.STRIPE_SECRET_KEY!,
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
  
  // API versions
  apiVersion: '2023-10-16' as const,
  
  // Customer portal configuration
  customerPortalUrl: process.env.NEXT_PUBLIC_STRIPE_CUSTOMER_PORTAL_URL,
} as const;

/**
 * Subscription Tiers
 * Based on BUSINESS_PLAN.md specifications
 */
export const SUBSCRIPTION_TIERS = {
  FREE: {
    id: 'free',
    name: 'Free',
    description: 'Perfect for trying out ContractFlow',
    price: 0,
    currency: 'gbp',
    interval: null,
    features: [
      '1 user',
      '5 contracts per month',
      'Basic AI assistance',
      'Standard templates',
      'Email support',
    ],
    limits: {
      users: 1,
      contractsPerMonth: 5,
      aiRequestsPerMonth: 50,
      storage: '100MB',
      templates: 'basic',
    },
  },
  STARTER: {
    id: 'starter',
    name: 'Starter',
    description: 'Ideal for freelancers and small teams',
    price: 49,
    currency: 'gbp',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_STARTER_MONTHLY,
    features: [
      'Up to 3 users',
      '50 contracts per month',
      'Advanced AI assistance',
      'Premium templates',
      'PDF/DOCX export',
      'Priority email support',
      'Basic analytics',
    ],
    limits: {
      users: 3,
      contractsPerMonth: 50,
      aiRequestsPerMonth: 500,
      storage: '5GB',
      templates: 'premium',
    },
  },
  PROFESSIONAL: {
    id: 'professional',
    name: 'Professional',
    description: 'Perfect for growing businesses',
    price: 149,
    currency: 'gbp',
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    features: [
      'Up to 10 users',
      'Unlimited contracts',
      'Premium AI with custom training',
      'All templates + custom',
      'Advanced export options',
      'API access',
      'Phone & email support',
      'Advanced analytics & reports',
      'Workflow automation',
      'Integration marketplace',
    ],
    limits: {
      users: 10,
      contractsPerMonth: -1, // unlimited
      aiRequestsPerMonth: 2000,
      storage: '50GB',
      templates: 'all',
      apiCalls: 10000,
    },
  },
  ENTERPRISE: {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Tailored solutions for large organizations',
    price: null, // Custom pricing
    currency: 'gbp',
    interval: 'month',
    stripePriceId: null, // Handled through sales
    features: [
      'Unlimited users',
      'Unlimited everything',
      'Dedicated AI model',
      'Custom integrations',
      'White-label options',
      'Dedicated support team',
      'SLA guarantees',
      'On-premise deployment option',
      'Custom training & onboarding',
      'Compliance & audit tools',
    ],
    limits: {
      users: -1,
      contractsPerMonth: -1,
      aiRequestsPerMonth: -1,
      storage: 'unlimited',
      templates: 'custom',
      apiCalls: -1,
    },
  },
} as const;

export type SubscriptionTierId = keyof typeof SUBSCRIPTION_TIERS;
export type SubscriptionTier = typeof SUBSCRIPTION_TIERS[SubscriptionTierId];

/**
 * Template Marketplace Pricing
 */
export const TEMPLATE_PRICING = {
  BASIC: {
    min: 0,
    max: 0,
    description: 'Free basic templates',
  },
  STANDARD: {
    min: 5,
    max: 15,
    description: 'Standard business templates',
  },
  PREMIUM: {
    min: 20,
    max: 50,
    description: 'Complex legal templates',
  },
  CUSTOM: {
    min: 100,
    max: 500,
    description: 'Industry-specific custom templates',
  },
} as const;

/**
 * API Usage Pricing
 */
export const API_PRICING = {
  RATE_PER_CALL: 0.10, // £0.10 per API call
  BULK_DISCOUNT: {
    1000: 0.08,
    10000: 0.06,
    100000: 0.04,
  },
} as const;

/**
 * Stripe Product IDs (to be set after creating products in Stripe)
 */
export const STRIPE_PRODUCTS = {
  SUBSCRIPTION: process.env.STRIPE_PRODUCT_SUBSCRIPTION,
  TEMPLATE: process.env.STRIPE_PRODUCT_TEMPLATE,
  API_USAGE: process.env.STRIPE_PRODUCT_API_USAGE,
} as const;

/**
 * Helper function to get tier by ID
 */
export function getSubscriptionTier(tierId: string): SubscriptionTier | null {
  const tier = SUBSCRIPTION_TIERS[tierId.toUpperCase() as SubscriptionTierId];
  return tier || null;
}

/**
 * Check if user has access to a feature based on their tier
 */
export function hasFeatureAccess(
  userTier: SubscriptionTierId,
  feature: 'api' | 'export' | 'advancedAnalytics' | 'customTemplates' | 'workflow'
): boolean {
  const tierHierarchy: SubscriptionTierId[] = ['FREE', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE'];
  const userTierIndex = tierHierarchy.indexOf(userTier);
  
  const featureRequirements: Record<string, SubscriptionTierId> = {
    api: 'PROFESSIONAL',
    export: 'STARTER',
    advancedAnalytics: 'PROFESSIONAL',
    customTemplates: 'PROFESSIONAL',
    workflow: 'PROFESSIONAL',
  };
  
  const requiredTier = featureRequirements[feature];
  if (!requiredTier) return true;
  
  const requiredIndex = tierHierarchy.indexOf(requiredTier);
  return userTierIndex >= requiredIndex;
}

/**
 * Calculate price with VAT (UK)
 */
export function calculatePriceWithVAT(price: number, vatRate: number = 0.20): {
  net: number;
  vat: number;
  gross: number;
} {
  const vat = price * vatRate;
  return {
    net: price,
    vat: Math.round(vat * 100) / 100,
    gross: Math.round((price + vat) * 100) / 100,
  };
}
