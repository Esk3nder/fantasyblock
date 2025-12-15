import { NextRequest, NextResponse } from 'next/server';
import { logger, generateRequestId, formatError } from '@/lib/logger';
import crypto from 'crypto';

/**
 * Autumn Webhook Handler
 *
 * Handles subscription lifecycle events from Autumn:
 * - subscription.created
 * - subscription.updated
 * - subscription.canceled
 * - payment.succeeded
 * - payment.failed
 *
 * Webhook secret should be set in AUTUMN_WEBHOOK_SECRET env variable
 */

interface AutumnWebhookEvent {
  id: string;
  type: string;
  created: number;
  data: {
    customer_id: string;
    customer_email?: string;
    product_id?: string;
    subscription_id?: string;
    status?: string;
    [key: string]: unknown;
  };
}

/**
 * Verify webhook signature from Autumn
 */
function verifySignature(payload: string, signature: string | null, secret: string): boolean {
  if (!signature) {
    return false;
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    return false;
  }
}

/**
 * Handle subscription created event
 */
async function handleSubscriptionCreated(event: AutumnWebhookEvent, requestId: string) {
  const { customer_id, product_id, subscription_id } = event.data;

  logger.info('Subscription created', {
    requestId,
    customerId: customer_id,
    productId: product_id,
    subscriptionId: subscription_id,
  });

  // TODO: Update user record with subscription info if needed
  // For now, Autumn handles subscription state, and we query it via the API
}

/**
 * Handle subscription updated event
 */
async function handleSubscriptionUpdated(event: AutumnWebhookEvent, requestId: string) {
  const { customer_id, product_id, subscription_id, status } = event.data;

  logger.info('Subscription updated', {
    requestId,
    customerId: customer_id,
    productId: product_id,
    subscriptionId: subscription_id,
    status,
  });

  // TODO: Handle plan upgrades/downgrades if needed
}

/**
 * Handle subscription canceled event
 */
async function handleSubscriptionCanceled(event: AutumnWebhookEvent, requestId: string) {
  const { customer_id, subscription_id } = event.data;

  logger.info('Subscription canceled', {
    requestId,
    customerId: customer_id,
    subscriptionId: subscription_id,
  });

  // TODO: Send email notification about cancellation
  // TODO: Handle any cleanup needed
}

/**
 * Handle payment succeeded event
 */
async function handlePaymentSucceeded(event: AutumnWebhookEvent, requestId: string) {
  const { customer_id } = event.data;

  logger.info('Payment succeeded', {
    requestId,
    customerId: customer_id,
  });

  // Payment successful - no action needed typically
}

/**
 * Handle payment failed event
 */
async function handlePaymentFailed(event: AutumnWebhookEvent, requestId: string) {
  const { customer_id, customer_email } = event.data;

  logger.warn('Payment failed', {
    requestId,
    customerId: customer_id,
    customerEmail: customer_email,
  });

  // TODO: Send email notification about failed payment
  // TODO: Consider downgrading to free plan after X failed attempts
}

/**
 * POST /api/autumn/webhooks - Handle Autumn webhook events
 */
export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  const log = {
    info: (msg: string, data?: Record<string, unknown>) => logger.info(msg, { ...data, requestId }),
    error: (msg: string, data?: Record<string, unknown>) => logger.error(msg, { ...data, requestId }),
    warn: (msg: string, data?: Record<string, unknown>) => logger.warn(msg, { ...data, requestId }),
  };

  try {
    // Get raw body for signature verification
    const payload = await request.text();
    const signature = request.headers.get('x-autumn-signature');

    // Verify signature if webhook secret is configured
    const webhookSecret = process.env.AUTUMN_WEBHOOK_SECRET;
    if (webhookSecret) {
      if (!verifySignature(payload, signature, webhookSecret)) {
        log.warn('Webhook signature verification failed');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      log.warn('AUTUMN_WEBHOOK_SECRET not configured - skipping signature verification');
    }

    // Parse event
    let event: AutumnWebhookEvent;
    try {
      event = JSON.parse(payload);
    } catch (e) {
      log.error('Failed to parse webhook payload');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    log.info('Received Autumn webhook', {
      eventId: event.id,
      eventType: event.type,
      customerId: event.data?.customer_id,
    });

    // Handle event based on type
    switch (event.type) {
      case 'subscription.created':
        await handleSubscriptionCreated(event, requestId);
        break;

      case 'subscription.updated':
        await handleSubscriptionUpdated(event, requestId);
        break;

      case 'subscription.canceled':
        await handleSubscriptionCanceled(event, requestId);
        break;

      case 'payment.succeeded':
        await handlePaymentSucceeded(event, requestId);
        break;

      case 'payment.failed':
        await handlePaymentFailed(event, requestId);
        break;

      default:
        log.info('Unhandled webhook event type', { eventType: event.type });
    }

    // Always return 200 to acknowledge receipt
    // (Autumn will retry if we return an error)
    return NextResponse.json({ received: true, eventId: event.id });
  } catch (error) {
    log.error('Error processing Autumn webhook', formatError(error));

    // Return 500 so Autumn will retry
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
