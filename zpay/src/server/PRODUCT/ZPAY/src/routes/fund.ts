import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../config';
import { getUserConfigByApiKey } from '../db';
import { BadRequestError, InternalServerError } from '../errors';
import { ZingoClient } from '../orchestration/zingo-client';

interface FundRequestBody {
  api_key?: string;
  address?: string;
  amount_zatoshi?: number | string;
}

interface BalanceQuerystring {
  api_key?: string;
}

function isValidFundRequest(data: any): data is { api_key: string; address: string; amount_zatoshi: string | number } {
  return data &&
    typeof data.api_key === 'string' && data.api_key.trim() !== '' &&
    typeof data.address === 'string' && data.address.trim() !== '' &&
    (typeof data.amount_zatoshi === 'number' || typeof data.amount_zatoshi === 'string') &&
    BigInt(data.amount_zatoshi) > 0n;
}

function isValidZcashAddress(addr: string): boolean {
  return /^(t1|t3|zs|u1)[a-zA-Z0-9]{20,}$/.test(addr);
}

function toZec(z: bigint): string {
  return (Number(z) / 1e8).toFixed(8);
}

function getHostClient(): ZingoClient {
  return new ZingoClient({
    mode: 'host',
    binaryPath: config.zingoBinaryPath,
    dataDir: config.zingoDataDir,
    serverUrl: config.lightwalletdServer,
  });
}

export default async function fundRoute(fastify: FastifyInstance) {

  // POST /fund — send ZEC from host wallet to a given address
  fastify.post('/fund', async (request: FastifyRequest<{ Body: FundRequestBody }>, reply: FastifyReply) => {
    const log = request.log;
    const data = request.body;

    if (!isValidFundRequest(data)) {
      throw new BadRequestError('Required: api_key (string), address (string), amount_zatoshi (positive integer)');
    }

    const { api_key: apiKey, address, amount_zatoshi } = data;
    const zatoshi = BigInt(amount_zatoshi);

    if (!isValidZcashAddress(address)) {
      throw new BadRequestError(`Invalid Zcash address format: ${address}`);
    }

    await getUserConfigByApiKey(fastify, apiKey);
    log.info(`Fund request: ${zatoshi} zatoshi -> ${address}`);

    const client = getHostClient();

    // Stage 1: Ensure synced to chain tip and check balances
    log.info('Syncing host wallet to chain tip...');
    const syncStatus = await client.ensureSynced({ label: 'fund pre-check' });
    log.info(`Host wallet synced: height=${syncStatus.walletHeight}/${syncStatus.chainHeight} synced=${syncStatus.synced}${syncStatus.rescanTriggered ? ' (rescanned)' : ''}`);

    let spendable = await client.spendableBalance();
    const transparent = await client.transparentBalance();
    log.info(`Host wallet: spendable=${spendable}, transparent=${transparent}`);

    // Stage 2: Shield transparent funds if needed
    if (spendable < zatoshi && transparent > 0n) {
      log.info(`Shielding transparent funds (${transparent} zatoshi)...`);
      try {
        await client.shieldTransparent({ label: 'fund shield', timeoutMs: 600_000 });
        log.info('Shield broadcast, waiting for spendable...');
      } catch (e: any) {
        log.warn(`Shield failed: ${e.message}`);
      }
    }

    // Stage 3: Wait for spendable balance (testing: use 1 zatoshi minimum, not full amount)
    if (spendable < zatoshi) {
      try {
        spendable = await client.waitForSpendable(1n, {
          timeoutMs: 600_000,
          label: 'fund spendable wait',
        });
      } catch {
        throw new BadRequestError(
          `Insufficient spendable balance after waiting. Funds may need more block confirmations.`,
        );
      }
    }

    // Stage 4: Send with deterministic retries
    log.info(`Sending ${zatoshi} zatoshi -> ${address}`);
    let txid: string;
    try {
      txid = await client.syncAndSend(address, zatoshi, { label: 'fund send' });
    } catch (e: any) {
      if (e.message?.includes('Insufficient funds')) {
        throw new BadRequestError(`Insufficient funds: ${e.message}`);
      }
      throw new InternalServerError(`Send failed: ${e.message}`);
    }

    log.info(`Fund sent. txid=${txid}`);

    // Post-send: ensure wallet reflects the outgoing tx
    try {
      const postSync = await client.ensureSynced({ label: 'fund post-send' });
      log.info(`Post-send sync: height=${postSync.walletHeight}/${postSync.chainHeight}`);
    } catch (e: any) {
      log.warn(`Post-fund sync failed: ${e.message}`);
    }

    return reply.code(200).send({
      status: 'sent',
      txid,
      address,
      amount_zatoshi: zatoshi.toString(),
      amount_zec: toZec(zatoshi),
    });
  });

  // GET /fund/balance
  fastify.get('/fund/balance', async (request: FastifyRequest<{ Querystring: BalanceQuerystring }>, reply: FastifyReply) => {
    const log = request.log;
    const apiKey = (request.query as BalanceQuerystring).api_key;
    if (!apiKey || apiKey.trim() === '') {
      throw new BadRequestError('api_key query parameter required');
    }

    await getUserConfigByApiKey(fastify, apiKey);

    const client = getHostClient();

    log.info('Syncing host wallet for balance check...');
    const balSyncStatus = await client.ensureSynced({ label: 'fund balance' });
    log.info(`Balance sync: height=${balSyncStatus.walletHeight}/${balSyncStatus.chainHeight} synced=${balSyncStatus.synced}`);

    const balance = await client.fullBalance();

    let deposit_addresses: { unified?: string; transparent?: string } = {};
    try {
      const addrs = await client.addresses();
      if (addrs[0]) {
        const addr = addrs[0].encoded_address || addrs[0].address;
        if (addr) deposit_addresses.unified = addr;
        const t = addrs[0].receivers?.transparent;
        if (t && typeof t === 'string') deposit_addresses.transparent = t;
      }
    } catch { /* deposit_addresses stays empty */ }

    if (!deposit_addresses.transparent) {
      try {
        const tAddrs = await client.tAddresses();
        if (tAddrs[0]) deposit_addresses.transparent = tAddrs[0];
      } catch { /* ignore */ }
    }

    return reply.code(200).send({
      spendable_zatoshi: balance.spendable.toString(),
      spendable_zec: toZec(balance.spendable),
      sapling_zatoshi: balance.sapling.toString(),
      sapling_zec: toZec(balance.sapling),
      orchard_zatoshi: balance.orchard.toString(),
      orchard_zec: toZec(balance.orchard),
      transparent_zatoshi: balance.transparent.toString(),
      transparent_zec: toZec(balance.transparent),
      deposit_addresses,
    });
  });
}
