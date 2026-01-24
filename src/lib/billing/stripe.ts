/**
 * Stripe Client Service
 * 
 * Server-side Stripe operations for subscription management,
 * usage tracking, and billing portal access.
 */

import Stripe from 'stripe';
import { 
  STRIPE_CONFIG, 
  BILLING_TIERS, 
  USAGE_PRICING,
  BillingTier, 
  UsageType,
  CustomerBilling 
} from './config';

// Initialize Stripe client
const stripe = new Stripe(STRIPE_CONFIG.secretKey, {
  apiVersion: '2024-12-18.acacia',
  typescript: true,
});

/**
 * Create a new Stripe customer
 */
export async function createCustomer(params: {
  email: string;
  name?: string;
  metadata?: Record<string, string>;
}): Promise<Stripe.Customer> {
  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      source: 'free-crypto-news',
      ...params.metadata,
    },
  });
}

/**
 * Get or create a customer by email
 */
export async function getOrCreateCustomer(email: string): Promise<Stripe.Customer> {
  const existingCustomers = await stripe.customers.list({
    email,
    limit: 1,
  });

  if (existingCustomers.data.length > 0) {
    return existingCustomers.data[0];
  }

  return createCustomer({ email });
}

/**
 * Create a checkout session for subscription
 */
export async function createCheckoutSession(params: {
  customerId: string;
  tier: BillingTier;
  billingPeriod: 'monthly' | 'yearly';
  successUrl?: string;
  cancelUrl?: string;
}): Promise<Stripe.Checkout.Session> {
  const tierConfig = BILLING_TIERS[params.tier];
  
  if (!tierConfig || params.tier === 'free') {
    throw new Error('Invalid tier for checkout');
  }

  const priceId = params.billingPeriod === 'yearly' 
    ? tierConfig.stripePriceIdYearly 
    : tierConfig.stripePriceIdMonthly;

  if (!priceId) {
    throw new Error(`No Stripe price configured for ${params.tier} ${params.billingPeriod}`);
  }

  return stripe.checkout.sessions.create({
    customer: params.customerId,
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      metadata: {
        tier: params.tier,
      },
    },
    success_url: params.successUrl || STRIPE_CONFIG.successUrl,
    cancel_url: params.cancelUrl || STRIPE_CONFIG.cancelUrl,
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    tax_id_collection: { enabled: true },
  });
}

/**
 * Create a billing portal session
 */
export async function createPortalSession(customerId: string): Promise<Stripe.BillingPortal.Session> {
  return stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: STRIPE_CONFIG.portalReturnUrl,
  });
}

/**
 * Get customer's active subscription
 */
export async function getActiveSubscription(customerId: string): Promise<Stripe.Subscription | null> {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    status: 'active',
    limit: 1,
  });

  return subscriptions.data[0] || null;
}

/**
 * Get full billing information for a customer
 */
export async function getCustomerBilling(customerId: string): Promise<CustomerBilling | null> {
  try {
    const customer = await stripe.customers.retrieve(customerId);
    
    if (customer.deleted) {
      return null;
    }

    const subscription = await getActiveSubscription(customerId);
    
    let tier: BillingTier = 'free';
    let status: CustomerBilling['status'] = 'active';
    let subscriptionId: string | null = null;
    let cancelAtPeriodEnd = false;

    if (subscription) {
      subscriptionId = subscription.id;
      tier = (subscription.metadata.tier as BillingTier) || 'pro';
      status = subscription.status as CustomerBilling['status'];
      cancelAtPeriodEnd = subscription.cancel_at_period_end;
    }

    // Get current period usage
    const now = new Date();
    const periodStart = subscription 
      ? new Date(subscription.current_period_start * 1000)
      : new Date(now.getFullYear(), now.getMonth(), 1);
    const periodEnd = subscription
      ? new Date(subscription.current_period_end * 1000)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return {
      customerId,
      subscriptionId,
      tier,
      status,
      currentPeriod: {
        start: periodStart,
        end: periodEnd,
        usage: {
          apiRequests: 0,
          aiTokens: 0,
          webhookDeliveries: 0,
          dataExports: 0,
        },
        status: 'current',
      },
      paymentMethodId: customer.invoice_settings?.default_payment_method as string || null,
      cancelAtPeriodEnd,
    };
  } catch (error) {
    console.error('Error fetching customer billing:', error);
    return null;
  }
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(
  subscriptionId: string, 
  immediately = false
): Promise<Stripe.Subscription> {
  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId);
  }
  
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  });
}

/**
 * Resume a canceled subscription
 */
export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  });
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(params: {
  subscriptionId: string;
  newTier: BillingTier;
  billingPeriod: 'monthly' | 'yearly';
}): Promise<Stripe.Subscription> {
  const tierConfig = BILLING_TIERS[params.newTier];
  
  if (!tierConfig || params.newTier === 'free') {
    // Downgrade to free = cancel subscription
    return cancelSubscription(params.subscriptionId);
  }

  const priceId = params.billingPeriod === 'yearly' 
    ? tierConfig.stripePriceIdYearly 
    : tierConfig.stripePriceIdMonthly;

  if (!priceId) {
    throw new Error(`No Stripe price configured for ${params.newTier}`);
  }

  const subscription = await stripe.subscriptions.retrieve(params.subscriptionId);
  
  return stripe.subscriptions.update(params.subscriptionId, {
    items: [
      {
        id: subscription.items.data[0].id,
        price: priceId,
      },
    ],
    metadata: {
      tier: params.newTier,
    },
    proration_behavior: 'create_prorations',
  });
}

/**
 * Report usage for metered billing
 */
export async function reportUsage(params: {
  subscriptionItemId: string;
  quantity: number;
  timestamp?: Date;
  action?: 'increment' | 'set';
}): Promise<Stripe.UsageRecord> {
  return stripe.subscriptionItems.createUsageRecord(params.subscriptionItemId, {
    quantity: params.quantity,
    timestamp: params.timestamp ? Math.floor(params.timestamp.getTime() / 1000) : 'now',
    action: params.action || 'increment',
  });
}

/**
 * Get usage summary for a subscription item
 */
export async function getUsageSummary(subscriptionItemId: string): Promise<Stripe.UsageRecordSummary[]> {
  const summaries = await stripe.subscriptionItems.listUsageRecordSummaries(subscriptionItemId);
  return summaries.data;
}

/**
 * List all invoices for a customer
 */
export async function listInvoices(
  customerId: string, 
  limit = 10
): Promise<Stripe.Invoice[]> {
  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  });
  return invoices.data;
}

/**
 * Get upcoming invoice preview
 */
export async function getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
  try {
    return await stripe.invoices.retrieveUpcoming({
      customer: customerId,
    });
  } catch (error) {
    // No upcoming invoice (no active subscription)
    return null;
  }
}

/**
 * Construct Stripe webhook event
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(
    payload,
    signature,
    STRIPE_CONFIG.webhookSecret
  );
}

export { stripe };
