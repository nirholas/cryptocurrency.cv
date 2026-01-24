/**
 * x402 Payment Lifecycle Hooks
 *
 * Best practice from top facilitators for analytics and payment tracking.
 * Enables before/after hooks for verify and settle operations.
 *
 * @example
 * ```ts
 * import { paymentHooks } from '@/lib/x402/hooks';
 *
 * paymentHooks.on('afterSettle', async (event) => {
 *   await analytics.track('payment_success', {
 *     amount: event.amount,
 *     wallet: event.payer,
 *     endpoint: event.resource,
 *   });
 * });
 * ```
 */

export interface PaymentEvent {
  requestId: string;
  resource: string;
  amount: string;
  network: string;
  payer: string;
  payTo: string;
  timestamp: Date;
  signature?: string;
}

export interface VerifyEvent extends PaymentEvent {
  valid: boolean;
  error?: string;
}

export interface SettleEvent extends PaymentEvent {
  transactionHash?: string;
  success: boolean;
  error?: string;
}

type HookHandler<T> = (event: T) => Promise<void> | void;

interface Hooks {
  beforeVerify: HookHandler<PaymentEvent>[];
  afterVerify: HookHandler<VerifyEvent>[];
  beforeSettle: HookHandler<PaymentEvent>[];
  afterSettle: HookHandler<SettleEvent>[];
  onError: HookHandler<{ event: PaymentEvent; error: Error }>[];
}

class PaymentHooksManager {
  private hooks: Hooks = {
    beforeVerify: [],
    afterVerify: [],
    beforeSettle: [],
    afterSettle: [],
    onError: [],
  };

  on<K extends keyof Hooks>(
    event: K,
    handler: Hooks[K][number]
  ): () => void {
    (this.hooks[event] as unknown[]).push(handler);
    return () => {
      const idx = (this.hooks[event] as unknown[]).indexOf(handler);
      if (idx > -1) {
        (this.hooks[event] as unknown[]).splice(idx, 1);
      }
    };
  }

  async emit<K extends keyof Hooks>(
    event: K,
    payload: Parameters<Hooks[K][number]>[0]
  ): Promise<void> {
    const handlers = this.hooks[event] as Array<(p: typeof payload) => Promise<void> | void>;
    for (const handler of handlers) {
      try {
        await handler(payload);
      } catch (error) {
        console.error(`[x402 hooks] Error in ${event} handler:`, error);
        if (event !== 'onError') {
          await this.emit('onError', {
            event: payload as PaymentEvent,
            error: error as Error,
          });
        }
      }
    }
  }

  /**
   * Wrap verify operation with hooks
   */
  async withVerify<T>(
    event: PaymentEvent,
    verifyFn: () => Promise<T>
  ): Promise<T> {
    await this.emit('beforeVerify', event);

    try {
      const result = await verifyFn();
      await this.emit('afterVerify', { ...event, valid: true });
      return result;
    } catch (error) {
      await this.emit('afterVerify', {
        ...event,
        valid: false,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  /**
   * Wrap settle operation with hooks
   */
  async withSettle<T extends { transactionHash?: string }>(
    event: PaymentEvent,
    settleFn: () => Promise<T>
  ): Promise<T> {
    await this.emit('beforeSettle', event);

    try {
      const result = await settleFn();
      await this.emit('afterSettle', {
        ...event,
        success: true,
        transactionHash: result.transactionHash,
      });
      return result;
    } catch (error) {
      await this.emit('afterSettle', {
        ...event,
        success: false,
        error: (error as Error).message,
      });
      throw error;
    }
  }
}

// Singleton instance
export const paymentHooks = new PaymentHooksManager();

// =============================================================================
// DEFAULT HOOKS (logging, analytics)
// =============================================================================

// Console logging hook (development)
if (process.env.NODE_ENV === 'development') {
  paymentHooks.on('afterVerify', (event) => {
    console.log(`[x402] Payment verified: ${event.resource} - ${event.valid ? '✓' : '✗'}`);
  });

  paymentHooks.on('afterSettle', (event) => {
    console.log(
      `[x402] Payment settled: ${event.resource} - ${event.success ? '✓' : '✗'}`,
      event.transactionHash ? `tx: ${event.transactionHash}` : ''
    );
  });
}

// =============================================================================
// ANALYTICS INTEGRATION EXAMPLES
// =============================================================================

/**
 * Example: Vercel Analytics integration
 */
export function setupVercelAnalytics() {
  if (process.env.VERCEL_ANALYTICS_ID) {
    paymentHooks.on('afterSettle', async (event) => {
      // Track with Vercel Analytics
      // await track('x402_payment', {
      //   amount: event.amount,
      //   resource: event.resource,
      //   success: event.success,
      // });
    });
  }
}

/**
 * Example: PostHog integration
 */
export function setupPostHogTracking() {
  paymentHooks.on('afterSettle', async (event) => {
    // posthog.capture('payment_completed', {
    //   amount: event.amount,
    //   payer: event.payer,
    //   resource: event.resource,
    // });
  });
}

/**
 * Example: Discord notification on large payments
 */
export function setupDiscordNotifications(webhookUrl: string, threshold = '1000000') {
  paymentHooks.on('afterSettle', async (event) => {
    if (BigInt(event.amount) >= BigInt(threshold) && event.success) {
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: `🎉 Large payment received! ${event.amount} for ${event.resource}`,
        }),
      });
    }
  });
}
