/**
 * In-memory async mutex keyed by wallet identifier (data dir path or container name).
 * Prevents concurrent zingo-cli operations against the same wallet.
 */
class WalletLock {
  private locks = new Map<string, Promise<void>>();

  async acquire(key: string): Promise<() => void> {
    while (this.locks.has(key)) {
      await this.locks.get(key);
    }

    let release!: () => void;
    const gate = new Promise<void>((resolve) => { release = resolve; });
    this.locks.set(key, gate);

    return () => {
      this.locks.delete(key);
      release();
    };
  }
}

export const walletLock = new WalletLock();
