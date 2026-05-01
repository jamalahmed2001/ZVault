import { execFile } from 'child_process';
import { ZingoClientConfig, BalanceInfo, AddressEntry, SyncStatus } from './types';
import { walletLock } from './wallet-lock';

const CMD_TIMEOUT = 300_000;
const SYNC_TIMEOUT = 600_000;
const SYNC_HEIGHT_TOLERANCE = 1;
const ZCASH_MINIMUM_FEE = 10_000n;
const FEE_INCREMENT = 10_000n;

export class ZingoError extends Error {
  constructor(message: string, public readonly cause?: string) {
    super(message);
    this.name = 'ZingoError';
  }
}

export class ZingoTimeoutError extends ZingoError {
  constructor(cmd: string, timeout: number) {
    super(`zingo-cli timed out after ${timeout}ms: ${cmd}`);
    this.name = 'ZingoTimeoutError';
  }
}

/**
 * Typed zingo-cli wrapper. Supports host mode (direct exec) and container mode (docker exec).
 * All public methods acquire a per-wallet lock to prevent concurrent CLI access.
 */
export class ZingoClient {
  private cfg: ZingoClientConfig;
  private lockKey: string;

  constructor(config: ZingoClientConfig) {
    this.cfg = config;
    this.lockKey = config.mode === 'container'
      ? `container:${config.containerName}:${config.dataDir}`
      : `host:${config.dataDir}`;
  }

  // ── Low-level execution ──────────────────────────────────────────

  private exec(args: string[], timeout = CMD_TIMEOUT): Promise<string> {
    const serverArgs = this.cfg.serverUrl ? ['--server', this.cfg.serverUrl] : [];
    const zingoArgs = ['--data-dir', this.cfg.dataDir, ...serverArgs, ...args];

    let cmd: string;
    let fullArgs: string[];

    if (this.cfg.mode === 'container') {
      cmd = 'docker';
      fullArgs = ['exec', this.cfg.containerName!, 'zingo-cli', ...zingoArgs];
    } else {
      cmd = this.cfg.binaryPath || 'zingo-cli';
      fullArgs = zingoArgs;
    }

    return new Promise((resolve, reject) => {
      execFile(
        cmd,
        fullArgs,
        { timeout, env: { ...process.env, RUST_LOG: 'error' }, maxBuffer: 10 * 1024 * 1024 },
        (error, stdout, stderr) => {
          const output = (stdout || '') + (stderr || '');
          if (error) {
            if ((error as any).killed || error.message?.includes('ETIMEDOUT')) {
              return reject(new ZingoTimeoutError(args.join(' '), timeout));
            }
            return reject(new ZingoError(`zingo-cli error: ${output || error.message}`, output));
          }
          resolve(output);
        },
      );
    });
  }

  /** Run a command under the wallet lock */
  private async run(args: string[], timeout = CMD_TIMEOUT): Promise<string> {
    const release = await walletLock.acquire(this.lockKey);
    try {
      return await this.exec(args, timeout);
    } finally {
      release();
    }
  }

  // ── JSON parsing ─────────────────────────────────────────────────

  static extractJsonObject(raw: string): string {
    const start = raw.indexOf('{');
    if (start === -1) return '';
    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '{') depth++;
      else if (raw[i] === '}') { depth--; if (depth === 0) return raw.slice(start, i + 1); }
    }
    return '';
  }

  static extractJsonArray(raw: string): string {
    const start = raw.indexOf('[');
    if (start === -1) return '';
    let depth = 0;
    for (let i = start; i < raw.length; i++) {
      if (raw[i] === '[') depth++;
      else if (raw[i] === ']') { depth--; if (depth === 0) return raw.slice(start, i + 1); }
    }
    return '';
  }

  static parseJson<T = any>(raw: string): T {
    const objIdx = raw.indexOf('{');
    const arrIdx = raw.indexOf('[');
    if (objIdx >= 0 && (arrIdx < 0 || objIdx < arrIdx)) {
      const json = ZingoClient.extractJsonObject(raw);
      if (json) return JSON.parse(json);
    }
    if (arrIdx >= 0) {
      const json = ZingoClient.extractJsonArray(raw);
      if (json) return JSON.parse(json);
    }
    throw new ZingoError(`No JSON in zingo-cli output: ${raw.slice(0, 200)}`);
  }

  // ── Sync primitives ─────────────────────────────────────────────

  async chainHeight(): Promise<number> {
    const raw = await this.run(['info']);
    try {
      const data = ZingoClient.parseJson<{ latest_block_height?: number; block_height?: number }>(raw);
      const h = data.latest_block_height ?? data.block_height ?? 0;
      return typeof h === 'number' ? h : Number(h);
    } catch {
      return 0;
    }
  }

  async walletHeight(): Promise<number> {
    const raw = await this.run(['height']);
    try {
      const data = ZingoClient.parseJson<{ height?: number }>(raw);
      return data.height ?? 0;
    } catch {
      return 0;
    }
  }

  async sync(): Promise<void> {
    await this.run(['sync', 'run'], SYNC_TIMEOUT);
  }

  async rescan(): Promise<void> {
    await this.run(['rescan'], SYNC_TIMEOUT);
  }

  async save(): Promise<void> {
    await this.run(['save']).catch(() => {});
  }

  /**
   * Deterministic sync: verifies wallet reaches chain tip.
   * Escalates sync → rescan if incremental syncs fail to close the gap.
   */
  async ensureSynced(opts: {
    maxSyncAttempts?: number;
    label?: string;
    signal?: AbortSignal;
    allowRescan?: boolean;
    onProgress?: (status: SyncStatus, attempt: number) => void;
  } = {}): Promise<SyncStatus> {
    const { maxSyncAttempts = 5, label = 'ensureSynced', signal, allowRescan = false, onProgress } = opts;
    let rescanTriggered = false;

    const chain = await this.chainHeight();
    if (chain === 0) {
      try { await this.sync(); } catch { /* best effort */ }
      await this.save();
      const wh = await this.walletHeight();
      const status: SyncStatus = { walletHeight: wh, chainHeight: 0, synced: false, rescanTriggered: false };
      onProgress?.(status, 0);
      return status;
    }

    let wallet = await this.walletHeight();
    if (wallet >= chain - SYNC_HEIGHT_TOLERANCE) {
      const status: SyncStatus = { walletHeight: wallet, chainHeight: chain, synced: true, rescanTriggered: false };
      onProgress?.(status, 0);
      return status;
    }

    for (let attempt = 1; attempt <= maxSyncAttempts; attempt++) {
      if (signal?.aborted) throw new ZingoError(`${label}: aborted`);

      try { await this.sync(); } catch { /* continue to height check */ }
      await this.save();
      await sleep(1_000);

      wallet = await this.walletHeight();
      const status: SyncStatus = { walletHeight: wallet, chainHeight: chain, synced: wallet >= chain - SYNC_HEIGHT_TOLERANCE, rescanTriggered: false };
      onProgress?.(status, attempt);

      if (status.synced) return status;
    }

    // Only rescan if caller explicitly allows it — rescans are destructive to wallet state
    if (allowRescan) {
      if (signal?.aborted) throw new ZingoError(`${label}: aborted`);
      rescanTriggered = true;
      try { await this.rescan(); } catch { /* continue */ }
      await this.save();
      await sleep(5_000);
    }

    wallet = await this.walletHeight();
    const finalChain = await this.chainHeight();
    const status: SyncStatus = {
      walletHeight: wallet,
      chainHeight: finalChain || chain,
      synced: wallet >= (finalChain || chain) - SYNC_HEIGHT_TOLERANCE,
      rescanTriggered,
    };
    onProgress?.(status, maxSyncAttempts + 1);
    return status;
  }

  // ── Public wallet operations ─────────────────────────────────────

  async spendableBalance(): Promise<bigint> {
    try {
      const raw = await this.run(['spendable_balance']);
      const json = ZingoClient.extractJsonObject(raw);
      if (!json) return 0n;
      const data = JSON.parse(json);
      return BigInt(data.spendable_balance ?? 0);
    } catch {
      return 0n;
    }
  }

  async transparentBalance(): Promise<bigint> {
    try {
      const raw = await this.run(['balance']);
      const match = raw.match(/total_transparent_balance:\s*([0-9_]+)/);
      if (!match) return 0n;
      return BigInt(match[1].replace(/_/g, ''));
    } catch {
      return 0n;
    }
  }

  async fullBalance(): Promise<BalanceInfo> {
    const raw = await this.run(['balance']);
    const field = (name: string): bigint => {
      const re = new RegExp(`${name}:\\s*([0-9_]+)`);
      const m = raw.match(re);
      return m ? BigInt(m[1].replace(/_/g, '')) : 0n;
    };
    return {
      spendable: await this.spendableBalance(),
      transparent: field('total_transparent_balance'),
      sapling: field('sapling_balance'),
      orchard: field('orchard_balance'),
    };
  }

  async addresses(): Promise<AddressEntry[]> {
    const raw = await this.run(['addresses']);
    return ZingoClient.parseJson<AddressEntry[]>(raw);
  }

  async tAddresses(): Promise<string[]> {
    const raw = await this.run(['t_addresses']);
    const arr = ZingoClient.parseJson<Array<{ encoded_address?: string }>>(raw);
    return arr.map(a => a.encoded_address).filter(Boolean) as string[];
  }

  async initWallet(): Promise<AddressEntry[]> {
    const raw = await this.run(['--birthday', '0', '--nosync', 'addresses']);
    return ZingoClient.parseJson<AddressEntry[]>(raw);
  }

  /**
   * Returns the wallet's seed phrase + birthday height so we can escrow
   * recovery material. Only safe to call AFTER the wallet has been
   * initialized (i.e. after initWallet()).
   *
   * NEVER log the return value — caller must encrypt it before persisting.
   */
  async recoveryInfo(): Promise<{ seed: string; birthday: number; rawAccounts: number }> {
    const raw = await this.run(['recovery_info']);
    const json = ZingoClient.extractJsonObject(raw) ?? raw;
    let parsed: any;
    try { parsed = JSON.parse(json); } catch { /* fall through */ }
    if (!parsed || typeof parsed !== 'object') {
      throw new ZingoError(`recovery_info: unparseable output: ${raw.slice(0, 200)}`, raw);
    }
    const seed = parsed.seed_phrase ?? parsed.seed;
    if (typeof seed !== 'string' || seed.split(/\s+/).length < 12) {
      throw new ZingoError('recovery_info: missing/invalid seed phrase', raw);
    }
    return {
      seed,
      birthday: Number(parsed.birthday ?? 0),
      rawAccounts: Number(parsed.num_accounts ?? 1),
    };
  }

  async quickshield(): Promise<{ txid?: string; raw: string }> {
    const raw = await this.run(['quickshield']);
    if (raw.includes('"error"') || raw.includes('Err(')) {
      throw new ZingoError(`quickshield failed: ${raw.slice(0, 500)}`, raw);
    }
    let txid: string | undefined;
    try {
      const data = ZingoClient.parseJson<{ txid?: string; txids?: string[] }>(raw);
      txid = data.txid ?? data.txids?.[0];
    } catch { /* txid stays undefined */ }
    return { txid, raw };
  }

  async quicksend(to: string, amountZatoshi: bigint): Promise<{ txid: string; raw: string }> {
    const raw = await this.run(['quicksend', to, amountZatoshi.toString()]);
    // Check for error in JSON structure, not broad substring match
    const jsonStr = ZingoClient.extractJsonObject(raw);
    if (jsonStr) {
      try {
        const parsed = JSON.parse(jsonStr);
        if (parsed.error) {
          throw new ZingoError(`quicksend error: ${parsed.error}`, raw);
        }
        const txid = parsed.txid ?? parsed.txids?.[0] ?? '';
        if (txid) return { txid, raw };
      } catch (e) {
        if (e instanceof ZingoError) throw e;
        // JSON parse failed, fall through
      }
    }
    // Check for Rust-level errors
    if (raw.includes('Err(') || raw.startsWith('Error:')) {
      throw new ZingoError(`quicksend failed: ${raw.slice(0, 500)}`, raw);
    }
    // Try array format { "txids": [...] }
    let txid = '';
    try {
      const data = ZingoClient.parseJson<{ txid?: string; txids?: string[] }>(raw);
      txid = data.txid ?? data.txids?.[0] ?? '';
    } catch { /* empty */ }
    if (!txid) {
      throw new ZingoError(`quicksend: no txid in output: ${raw.slice(0, 500)}`, raw);
    }
    return { txid, raw };
  }

  /** Returns true if the error is a fee/balance issue that sendMax should retry with a higher fee buffer */
  private static isFeeRelatedError(msg: string): boolean {
    const lower = msg.toLowerCase();
    return lower.includes('insufficient') ||
           lower.includes('not enough') ||
           lower.includes('balance') ||
           lower.includes('fee') ||
           lower.includes('dust');
  }

  // ── Deterministic compound operations ────────────────────────────

  async syncAndGetSpendable(opts: {
    label?: string;
    signal?: AbortSignal;
    onSync?: (status: SyncStatus) => void;
  } = {}): Promise<{ balance: bigint; syncStatus: SyncStatus }> {
    const syncStatus = await this.ensureSynced({
      label: opts.label || 'syncAndGetSpendable',
      signal: opts.signal,
      onProgress: (s) => opts.onSync?.(s),
    });
    const balance = await this.spendableBalance();
    return { balance, syncStatus };
  }

  /**
   * Ensure synced, then attempt send. On failure: re-sync → rescan → fail.
   * Used for sends where the amount is specified (e.g., fee transfer).
   */
  async syncAndSend(
    to: string,
    amountZatoshi: bigint,
    opts: {
      maxRetries?: number;
      label?: string;
      signal?: AbortSignal;
      onProgress?: (msg: string) => void;
    } = {},
  ): Promise<string> {
    const { maxRetries = 5, label = 'send', signal, onProgress } = opts;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) throw new ZingoError(`${label}: aborted`);

      if (attempt > 1) {
        const waitMs = Math.min(15_000 * attempt, 60_000);
        onProgress?.(`Attempt ${attempt}: waiting ${waitMs / 1000}s before retry...`);
        await sleep(waitMs);
      }

      const syncStatus = await this.ensureSynced({ label: `${label} pre-send`, signal });
      const spendable = await this.spendableBalance();
      onProgress?.(`Attempt ${attempt}: synced=${syncStatus.walletHeight}/${syncStatus.chainHeight} spendable=${spendable}`);
      await sleep(2_000);

      try {
        const result = await this.quicksend(to, amountZatoshi);
        await this.save();
        onProgress?.(`Sent on attempt ${attempt}: txid=${result.txid}`);
        return result.txid;
      } catch (e) {
        lastError = (e as Error).message || '';
        onProgress?.(`Attempt ${attempt} failed: ${lastError.slice(0, 200)}`);

        if (lastError.includes('commitment tree') || lastError.includes('compute root')) {
          onProgress?.(`Tree corruption detected — rescanning wallet...`);
          try { await this.rescan(); } catch { /* continue */ }
          await this.save();
          await sleep(30_000);
        }
      }
    }

    throw new ZingoError(`${label}: failed after ${maxRetries} attempts — ${lastError.slice(0, 300)}`, lastError);
  }

  /**
   * Drain wallet: send the maximum possible amount to `to`.
   * Adaptively increases the fee buffer on insufficient-funds errors.
   * Rescans after each failure to clear zombie note locks.
   *
   * This is the right method for "send everything" transfers (W1→W2, W2→Exodus).
   */
  async sendMax(
    to: string,
    opts: {
      maxRetries?: number;
      label?: string;
      signal?: AbortSignal;
      onProgress?: (msg: string) => void;
    } = {},
  ): Promise<{ txid: string; amountSent: bigint }> {
    const { maxRetries = 5, label = 'sendMax', signal, onProgress } = opts;
    let feeMultiplier = 2;
    let lastError = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) throw new ZingoError(`${label}: aborted`);

      if (attempt > 1) {
        const waitMs = Math.min(15_000 * attempt, 60_000);
        onProgress?.(`Attempt ${attempt}: waiting ${waitMs / 1000}s before retry...`);
        await sleep(waitMs);
      }

      const syncStatus = await this.ensureSynced({ label: `${label} attempt-${attempt}`, signal });
      const spendable = await this.spendableBalance();
      const feeBuffer = ZCASH_MINIMUM_FEE * BigInt(feeMultiplier);
      const amount = spendable - feeBuffer;

      onProgress?.(
        `Attempt ${attempt}: synced=${syncStatus.walletHeight}/${syncStatus.chainHeight} ` +
        `spendable=${spendable} feeBuffer=${feeBuffer} sending=${amount}`,
      );

      if (amount <= 0n) {
        onProgress?.(`Attempt ${attempt}: amount ${amount} <= 0 (spendable=${spendable}, feeBuffer=${feeBuffer})`);
        if (spendable === 0n) {
          // Bail out to workflow level — let waitForSpendable handle recovery
          throw new ZingoError(`${label}: spendable is 0. Needs workflow-level recovery.`);
        }
        throw new ZingoError(`${label}: balance too low. spendable=${spendable}, feeBuffer=${feeBuffer}`);
      }

      await sleep(2_000);

      try {
        const result = await this.quicksend(to, amount);
        await this.save();
        onProgress?.(`Sent on attempt ${attempt}: txid=${result.txid} amount=${amount}`);
        return { txid: result.txid, amountSent: amount };
      } catch (e) {
        lastError = (e as Error).message || '';
        onProgress?.(`Attempt ${attempt} failed: ${lastError.slice(0, 200)}`);

        if (ZingoClient.isFeeRelatedError(lastError)) {
          feeMultiplier++;
          onProgress?.(`Increasing fee buffer to ${ZCASH_MINIMUM_FEE * BigInt(feeMultiplier)} for next attempt`);
        }

        // On tree/commitment errors, rescan once and let next attempt use clean state
        if (lastError.includes('commitment tree') || lastError.includes('compute root')) {
          onProgress?.(`Tree corruption detected — rescanning wallet...`);
          try { await this.rescan(); } catch { /* continue */ }
          await this.save();
          await sleep(30_000);
        }
      }
    }

    throw new ZingoError(`${label}: failed after ${maxRetries} attempts — ${lastError.slice(0, 300)}`, lastError);
  }

  /**
   * Poll until spendable balance >= requiredAmount.
   * Uses ensureSynced each cycle to guarantee wallet is at chain tip.
   */
  async waitForSpendable(
    requiredAmount: bigint,
    opts: {
      timeoutMs?: number;
      pollMs?: number;
      label?: string;
      signal?: AbortSignal;
      onPoll?: (balance: bigint, pollIndex: number, syncStatus: SyncStatus) => void;
    } = {},
  ): Promise<bigint> {
    const { timeoutMs = 1_800_000, pollMs = 15_000, label = 'waitForSpendable', signal, onPoll } = opts;
    const start = Date.now();
    let polls = 0;
    let zeroStreakStart: number | null = null;

    while (Date.now() - start < timeoutMs) {
      if (signal?.aborted) throw new ZingoError(`${label}: aborted`);
      polls++;

      const syncStatus = await this.ensureSynced({ label: `${label} poll-${polls}`, signal });
      const balance = await this.spendableBalance();
      onPoll?.(balance, polls, syncStatus);

      if (balance >= requiredAmount) {
        await this.save();
        return balance;
      }

      // If spendable has been 0 for >5 minutes, do a single rescan to recover
      if (balance === 0n) {
        if (!zeroStreakStart) zeroStreakStart = Date.now();
        const zeroMs = Date.now() - zeroStreakStart;
        if (zeroMs > 300_000 && polls > 10) {
          onPoll?.(balance, polls, { ...syncStatus, rescanTriggered: true });
          try { await this.rescan(); } catch { /* continue */ }
          await this.save();
          zeroStreakStart = Date.now();
          await sleep(60_000);
          continue;
        }
      } else {
        zeroStreakStart = null;
      }

      await sleep(pollMs);
    }

    throw new ZingoError(`${label}: timed out after ${timeoutMs / 1000}s waiting for ${requiredAmount} zatoshi spendable`);
  }

  /**
   * Shield transparent funds with escalation.
   */
  async shieldTransparent(
    opts: { timeoutMs?: number; label?: string; signal?: AbortSignal; onProgress?: (msg: string) => void } = {},
  ): Promise<string | undefined> {
    const { timeoutMs = 1_800_000, label = 'shieldTransparent', signal, onProgress } = opts;
    const start = Date.now();
    let polls = 0;

    while (Date.now() - start < timeoutMs) {
      if (signal?.aborted) throw new ZingoError(`${label}: aborted`);
      polls++;

      const syncStatus = await this.ensureSynced({ label: `${label} poll-${polls}`, signal });
      onProgress?.(`Poll ${polls}: wallet=${syncStatus.walletHeight} chain=${syncStatus.chainHeight}${syncStatus.rescanTriggered ? ' (rescanned)' : ''}`);
      await sleep(2_000);

      try {
        const result = await this.quickshield();
        onProgress?.(`Shield broadcast: txid=${result.txid || '(pending)'}`);
        return result.txid;
      } catch (e) {
        const msg = (e as Error).message || '';
        if (!msg.includes('Insufficient funds') && !msg.includes('"error"')) {
          throw e;
        }
        onProgress?.(`Poll ${polls}: shield not ready (${msg.slice(0, 80)})`);
      }

      await sleep(30_000);
    }

    throw new ZingoError(`${label}: timed out after ${timeoutMs / 1000}s`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
