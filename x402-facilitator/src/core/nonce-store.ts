/**
 * In-memory LRU of (payer, nonce) pairs currently being settled or recently
 * settled. Prevents two concurrent /settle calls for the same authorization
 * from both reaching the chain; the on-chain authorizationState check remains
 * the source of truth across restarts.
 */
export class NonceStore {
  private readonly entries = new Map<string, number>();

  constructor(private readonly capacity = 10_000) {}

  private key(payer: string, nonce: string): string {
    return `${payer.toLowerCase()}:${nonce.toLowerCase()}`;
  }

  has(payer: string, nonce: string): boolean {
    return this.entries.has(this.key(payer, nonce));
  }

  /** Marks the pair in flight. Returns false when it was already present. */
  claim(payer: string, nonce: string): boolean {
    const k = this.key(payer, nonce);
    if (this.entries.has(k)) return false;
    this.entries.set(k, Date.now());
    if (this.entries.size > this.capacity) {
      const oldest = this.entries.keys().next().value;
      if (oldest !== undefined) this.entries.delete(oldest);
    }
    return true;
  }

  release(payer: string, nonce: string): void {
    this.entries.delete(this.key(payer, nonce));
  }

  get size(): number {
    return this.entries.size;
  }
}
