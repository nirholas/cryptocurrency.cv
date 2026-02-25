/**
 * CryptoNewsWS — WebSocket Client SDK
 *
 * Full-featured client for the Free Crypto News WebSocket server.
 * Handles reconnection with exponential backoff, subscription restoration,
 * and server-initiated reconnect messages (graceful shutdown).
 *
 * @example
 * ```typescript
 * import { CryptoNewsWS } from '@free-crypto-news/sdk';
 *
 * const ws = new CryptoNewsWS('wss://ws.cryptocurrency.cv');
 *
 * ws.on('news', (article) => console.log(article));
 * ws.on('prices', (prices) => console.log(prices));
 *
 * ws.subscribe({ coins: ['bitcoin', 'ethereum'] });
 * ws.joinChannel('defi');
 * ws.streamPrices(true);
 *
 * // Later...
 * ws.disconnect();
 * ```
 */

export type MessageType =
  | 'connected'
  | 'news'
  | 'breaking'
  | 'prices'
  | 'whales'
  | 'sentiment'
  | 'alert'
  | 'topic'
  | 'subscribed'
  | 'unsubscribed'
  | 'channel_joined'
  | 'channel_left'
  | 'alerts_subscribed'
  | 'alerts_unsubscribed'
  | 'restored'
  | 'restore_failed'
  | 'reconnect'
  | 'pong'
  | 'error'
  | 'rate_limited';

export interface CryptoNewsWSOptions {
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Maximum reconnect attempts before giving up (default: Infinity) */
  maxReconnectAttempts?: number;
  /** Base delay for exponential backoff in ms (default: 1000) */
  reconnectBaseDelay?: number;
  /** Maximum reconnect delay in ms (default: 30000) */
  reconnectMaxDelay?: number;
  /** Ping interval to keep connection alive in ms (default: 25000) */
  pingInterval?: number;
  /** Connection timeout in ms (default: 10000) */
  connectTimeout?: number;
}

type EventCallback = (data: unknown) => void;

export class CryptoNewsWS {
  private url: string;
  private ws: WebSocket | null = null;
  private options: Required<CryptoNewsWSOptions>;

  // State
  private clientId: string | null = null;
  private previousClientId: string | null = null;
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalClose = false;

  // Saved subscriptions for restore on reconnect
  private subscriptions: {
    sources: string[];
    categories: string[];
    keywords: string[];
    coins: string[];
  } = { sources: [], categories: [], keywords: [], coins: [] };
  private channels = new Set<string>();
  private alertSubscriptions = new Set<string>();
  private streamFlags = {
    prices: false,
    whales: false,
    sentiment: false,
  };

  // Event listeners
  private listeners = new Map<string, Set<EventCallback>>();

  constructor(url: string, options: CryptoNewsWSOptions = {}) {
    this.url = url;
    this.options = {
      autoReconnect: options.autoReconnect ?? true,
      maxReconnectAttempts: options.maxReconnectAttempts ?? Infinity,
      reconnectBaseDelay: options.reconnectBaseDelay ?? 1000,
      reconnectMaxDelay: options.reconnectMaxDelay ?? 30000,
      pingInterval: options.pingInterval ?? 25000,
      connectTimeout: options.connectTimeout ?? 10000,
    };

    this.connect();
  }

  // ===========================================================================
  // PUBLIC API
  // ===========================================================================

  /** Subscribe to news filters (additive). */
  subscribe(payload: {
    sources?: string[];
    categories?: string[];
    keywords?: string[];
    coins?: string[];
  }): void {
    // Merge locally
    if (payload.sources)
      this.subscriptions.sources = [
        ...new Set([...this.subscriptions.sources, ...payload.sources]),
      ];
    if (payload.categories)
      this.subscriptions.categories = [
        ...new Set([...this.subscriptions.categories, ...payload.categories]),
      ];
    if (payload.keywords)
      this.subscriptions.keywords = [
        ...new Set([...this.subscriptions.keywords, ...payload.keywords]),
      ];
    if (payload.coins)
      this.subscriptions.coins = [
        ...new Set([...this.subscriptions.coins, ...payload.coins]),
      ];

    this.send({ type: 'subscribe', payload });
  }

  /** Unsubscribe from news filters. */
  unsubscribe(payload: {
    sources?: string[];
    categories?: string[];
    keywords?: string[];
    coins?: string[];
  }): void {
    if (payload.sources)
      this.subscriptions.sources = this.subscriptions.sources.filter(
        (s) => !payload.sources!.includes(s),
      );
    if (payload.categories)
      this.subscriptions.categories = this.subscriptions.categories.filter(
        (c) => !payload.categories!.includes(c),
      );
    if (payload.keywords)
      this.subscriptions.keywords = this.subscriptions.keywords.filter(
        (k) => !payload.keywords!.includes(k),
      );
    if (payload.coins)
      this.subscriptions.coins = this.subscriptions.coins.filter(
        (c) => !payload.coins!.includes(c),
      );

    this.send({ type: 'unsubscribe', payload });
  }

  /** Join a topic channel (bitcoin, defi, nft, etc.). */
  joinChannel(channel: string): void {
    this.channels.add(channel);
    this.send({ type: 'join_channel', payload: { channel } });
  }

  /** Leave a topic channel. */
  leaveChannel(channel: string): void {
    this.channels.delete(channel);
    this.send({ type: 'leave_channel', payload: { channel } });
  }

  /** Subscribe to price streaming. */
  streamPrices(enabled = true): void {
    this.streamFlags.prices = enabled;
    this.send({ type: 'stream_prices', payload: { enabled } });
  }

  /** Subscribe to whale alert streaming. */
  streamWhales(enabled = true): void {
    this.streamFlags.whales = enabled;
    this.send({ type: 'stream_whales', payload: { enabled } });
  }

  /** Subscribe to sentiment streaming. */
  streamSentiment(enabled = true): void {
    this.streamFlags.sentiment = enabled;
    this.send({ type: 'stream_sentiment', payload: { enabled } });
  }

  /** Subscribe to alerts. */
  subscribeAlerts(ruleIds?: string[]): void {
    const ids = ruleIds ?? ['*'];
    for (const id of ids) this.alertSubscriptions.add(id);
    this.send({ type: 'subscribe_alerts', payload: { ruleIds: ids } });
  }

  /** Unsubscribe from alerts. */
  unsubscribeAlerts(ruleIds?: string[]): void {
    if (ruleIds) {
      for (const id of ruleIds) this.alertSubscriptions.delete(id);
    } else {
      this.alertSubscriptions.clear();
    }
    this.send({ type: 'unsubscribe_alerts', payload: { ruleIds } });
  }

  /** Register an event listener. */
  on(event: MessageType | 'open' | 'close' | 'reconnecting', callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /** Remove an event listener. */
  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  /** Intentionally disconnect (no auto-reconnect). */
  disconnect(): void {
    this.isIntentionalClose = true;
    this.cleanup();
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }

  /** Current connection state. */
  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /** Current client ID assigned by server. */
  get id(): string | null {
    return this.clientId;
  }

  // ===========================================================================
  // INTERNALS
  // ===========================================================================

  private connect(): void {
    this.cleanup();

    try {
      this.ws = new WebSocket(this.url);
    } catch {
      this.scheduleReconnect();
      return;
    }

    // Connection timeout
    this.connectTimer = setTimeout(() => {
      if (this.ws?.readyState !== WebSocket.OPEN) {
        this.ws?.close();
        this.scheduleReconnect();
      }
    }, this.options.connectTimeout);

    this.ws.onopen = () => {
      if (this.connectTimer) {
        clearTimeout(this.connectTimer);
        this.connectTimer = null;
      }
      this.reconnectAttempts = 0;
      this.emit('open', {});
      this.startPing();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data as string);
        this.handleServerMessage(msg);
      } catch {
        // ignore non-JSON
      }
    };

    this.ws.onclose = () => {
      this.stopPing();
      this.emit('close', {});
      if (!this.isIntentionalClose) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      // onclose will fire after onerror
    };
  }

  private handleServerMessage(msg: { type: string; payload?: unknown; timestamp?: string }): void {
    switch (msg.type) {
      case 'connected':
        // Save client ID for reconnection
        this.previousClientId = this.clientId;
        this.clientId = (msg.payload as { clientId: string })?.clientId ?? null;

        // Try to restore previous session
        if (this.previousClientId && this.reconnectAttempts === 0) {
          this.send({
            type: 'restore',
            payload: { previousClientId: this.previousClientId },
          });
        } else {
          // Fresh connection — replay local state
          this.replaySubscriptions();
        }
        break;

      case 'restored':
        // Session restored successfully — no need to replay
        this.emit('restored', msg.payload);
        break;

      case 'restore_failed':
        // Couldn't restore — replay manually
        this.replaySubscriptions();
        this.emit('restore_failed', msg.payload);
        break;

      case 'reconnect':
        // Server-initiated reconnect (graceful shutdown)
        if (this.ws) {
          this.ws.close(1000, 'Server requested reconnect');
        }
        // Don't wait for onclose — trigger reconnect immediately
        this.scheduleReconnect();
        break;

      default:
        this.emit(msg.type as MessageType, msg.payload);
        break;
    }
  }

  /** Replay all locally-cached subscriptions/channels/streams to the server. */
  private replaySubscriptions(): void {
    // Re-subscribe to news filters
    const hasSubs =
      this.subscriptions.sources.length > 0 ||
      this.subscriptions.categories.length > 0 ||
      this.subscriptions.keywords.length > 0 ||
      this.subscriptions.coins.length > 0;
    if (hasSubs) {
      this.send({ type: 'subscribe', payload: this.subscriptions });
    }

    // Re-join channels
    for (const ch of this.channels) {
      this.send({ type: 'join_channel', payload: { channel: ch } });
    }

    // Re-subscribe to alerts
    if (this.alertSubscriptions.size > 0) {
      this.send({
        type: 'subscribe_alerts',
        payload: { ruleIds: Array.from(this.alertSubscriptions) },
      });
    }

    // Re-enable streams
    if (this.streamFlags.prices) this.send({ type: 'stream_prices', payload: { enabled: true } });
    if (this.streamFlags.whales) this.send({ type: 'stream_whales', payload: { enabled: true } });
    if (this.streamFlags.sentiment)
      this.send({ type: 'stream_sentiment', payload: { enabled: true } });
  }

  private scheduleReconnect(): void {
    if (!this.options.autoReconnect) return;
    if (this.reconnectAttempts >= this.options.maxReconnectAttempts) return;

    const delay = Math.min(
      this.options.reconnectBaseDelay * 2 ** this.reconnectAttempts,
      this.options.reconnectMaxDelay,
    );
    const jitter = Math.random() * 1000;

    this.emit('reconnecting', {
      attempt: this.reconnectAttempts + 1,
      delay: delay + jitter,
    });

    this.reconnectTimer = setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay + jitter);
  }

  private send(msg: Record<string, unknown>): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  private startPing(): void {
    this.pingTimer = setInterval(() => {
      this.send({ type: 'ping' });
    }, this.options.pingInterval);
  }

  private stopPing(): void {
    if (this.pingTimer) {
      clearInterval(this.pingTimer);
      this.pingTimer = null;
    }
  }

  private cleanup(): void {
    this.stopPing();
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.connectTimer) {
      clearTimeout(this.connectTimer);
      this.connectTimer = null;
    }
  }

  private emit(event: string, data: unknown): void {
    const cbs = this.listeners.get(event);
    if (cbs) {
      for (const cb of cbs) {
        try {
          cb(data);
        } catch {
          // don't let listener errors break the client
        }
      }
    }
  }
}

export default CryptoNewsWS;
