/**
 * Stripe payment service for Supabase Edge Functions
 */

import {ApiError, ErrorCodes} from './errors.ts';

// Stripe API configuration
const STRIPE_SECRET_KEY = Deno.env.get('STRIPE_SECRET_KEY') || '';
const STRIPE_API_VERSION = '2023-10-16';
const STRIPE_API_BASE = 'https://api.stripe.com/v1';

// Subscription price (monthly)
const MONTHLY_PRICE_CENTS = 399; // $3.99
const MONTHLY_PRICE_ID = Deno.env.get('STRIPE_PRICE_ID') || 'price_1234567890'; // Set in environment

/**
 * Make a Stripe API request
 */
async function stripeRequest(
  endpoint: string,
  method: string = 'GET',
  data?: Record<string, any>,
): Promise<any> {
  if (!STRIPE_SECRET_KEY) {
    throw new ApiError(
      'Stripe secret key not configured',
      500,
      ErrorCodes.STRIPE_ERROR,
    );
  }

  const url = `${STRIPE_API_BASE}${endpoint}`;
  const auth = btoa(`${STRIPE_SECRET_KEY}:`);

  let body: string | undefined;
  if (data) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
      if (typeof value === 'object' && value !== null) {
        for (const [nestedKey, nestedValue] of Object.entries(value)) {
          params.append(`${key}[${nestedKey}]`, String(nestedValue));
        }
      } else {
        params.append(key, String(value));
      }
    }
    body = params.toString();
  }

  try {
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Stripe-Version': STRIPE_API_VERSION,
      },
      ...(body && {body}),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('Stripe API error:', responseData);
      throw new ApiError(
        responseData.error?.message || 'Stripe API error',
        response.status,
        ErrorCodes.STRIPE_ERROR,
      );
    }

    return responseData;
  } catch (error) {
    console.error('Stripe request error:', error);

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(
      'Failed to communicate with Stripe',
      500,
      ErrorCodes.STRIPE_ERROR,
    );
  }
}

/**
 * Create or retrieve a Stripe customer
 */
export async function createOrGetCustomer(
  userId: string,
  phone: string,
  stripeCustomerId?: string | null,
): Promise<string> {
  // If customer already exists, return ID
  if (stripeCustomerId) {
    try {
      // Verify customer exists
      await stripeRequest(`/customers/${stripeCustomerId}`);
      return stripeCustomerId;
    } catch (error) {
      console.log('Customer not found, creating new one');
    }
  }

  // Create new customer
  const customer = await stripeRequest('/customers', 'POST', {
    phone,
    metadata: {
      user_id: userId,
    },
  });

  return customer.id;
}

/**
 * Attach payment method to customer
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string,
): Promise<void> {
  await stripeRequest(`/payment_methods/${paymentMethodId}/attach`, 'POST', {
    customer: customerId,
  });

  // Set as default payment method
  await stripeRequest(`/customers/${customerId}`, 'POST', {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  });
}

/**
 * Create a subscription
 */
export async function createSubscription(
  customerId: string,
  userId: string,
): Promise<any> {
  const subscription = await stripeRequest('/subscriptions', 'POST', {
    customer: customerId,
    items: [
      {
        price: MONTHLY_PRICE_ID,
      },
    ],
    metadata: {
      user_id: userId,
    },
    expand: ['latest_invoice.payment_intent'],
  });

  return subscription;
}

/**
 * Cancel a subscription (at period end)
 */
export async function cancelSubscription(subscriptionId: string): Promise<any> {
  const subscription = await stripeRequest(
    `/subscriptions/${subscriptionId}`,
    'DELETE',
    {
      cancel_at_period_end: true,
    },
  );

  return subscription;
}

/**
 * Cancel a subscription immediately
 */
export async function cancelSubscriptionImmediately(
  subscriptionId: string,
): Promise<any> {
  const subscription = await stripeRequest(
    `/subscriptions/${subscriptionId}`,
    'DELETE',
  );

  return subscription;
}

/**
 * Reactivate a canceled subscription
 */
export async function reactivateSubscription(
  subscriptionId: string,
): Promise<any> {
  const subscription = await stripeRequest(
    `/subscriptions/${subscriptionId}`,
    'POST',
    {
      cancel_at_period_end: false,
    },
  );

  return subscription;
}

/**
 * Get subscription details
 */
export async function getSubscription(subscriptionId: string): Promise<any> {
  const subscription = await stripeRequest(`/subscriptions/${subscriptionId}`);
  return subscription;
}

/**
 * Get customer's payment methods
 */
export async function getPaymentMethods(customerId: string): Promise<any[]> {
  const response = await stripeRequest(
    `/payment_methods?customer=${customerId}&type=card`,
  );
  return response.data || [];
}

/**
 * Detach payment method from customer
 */
export async function detachPaymentMethod(
  paymentMethodId: string,
): Promise<void> {
  await stripeRequest(`/payment_methods/${paymentMethodId}/detach`, 'POST');
}

/**
 * Update payment method
 */
export async function updatePaymentMethod(
  customerId: string,
  oldPaymentMethodId: string,
  newPaymentMethodId: string,
): Promise<void> {
  // Attach new payment method
  await attachPaymentMethod(newPaymentMethodId, customerId);

  // Detach old payment method
  try {
    await detachPaymentMethod(oldPaymentMethodId);
  } catch (error) {
    console.error('Failed to detach old payment method:', error);
    // Don't throw - the important part (attaching new method) succeeded
  }
}

/**
 * Retry failed invoice
 */
export async function retryInvoice(invoiceId: string): Promise<any> {
  const invoice = await stripeRequest(`/invoices/${invoiceId}/pay`, 'POST');
  return invoice;
}

/**
 * Get upcoming invoice for customer
 */
export async function getUpcomingInvoice(customerId: string): Promise<any> {
  try {
    const invoice = await stripeRequest(
      `/invoices/upcoming?customer=${customerId}`,
    );
    return invoice;
  } catch (error) {
    // No upcoming invoice
    return null;
  }
}

/**
 * Parse webhook event
 */
export function parseWebhookEvent(payload: string): any {
  try {
    return JSON.parse(payload);
  } catch (error) {
    throw new ApiError(
      'Invalid webhook payload',
      400,
      ErrorCodes.VALIDATION_ERROR,
    );
  }
}

/**
 * Format price for display
 */
export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Get subscription status display text
 */
export function getSubscriptionStatusText(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'Active',
    past_due: 'Past Due',
    canceled: 'Canceled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    trialing: 'Trial',
    unpaid: 'Unpaid',
  };

  return statusMap[status] || status;
}

/**
 * Check if subscription is active
 */
export function isSubscriptionActive(status: string): boolean {
  return ['active', 'trialing'].includes(status);
}

/**
 * Check if subscription needs payment attention
 */
export function subscriptionNeedsAttention(status: string): boolean {
  return ['past_due', 'incomplete', 'unpaid'].includes(status);
}

/**
 * Get monthly price
 */
export function getMonthlyPrice(): {cents: number; formatted: string} {
  return {
    cents: MONTHLY_PRICE_CENTS,
    formatted: formatPrice(MONTHLY_PRICE_CENTS),
  };
}
