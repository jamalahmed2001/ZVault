import { FastifyInstance } from 'fastify';
import { WorkflowStage, WorkflowData, WorkflowRecord, TERMINAL_STAGES, TX_FEE_ZATOSHI } from './types';
import { ZingoClient, ZingoError } from './zingo-client';
import { isContainerRunning } from '../docker';
import { config } from '../config';
import { getWebhookConfigByUserId } from '../db';
import fs from 'fs/promises';
import path from 'path';

interface StatusUpdate {
  status: string;
  addressesUsed?: string[];
  txHashes?: string[];
}

const CONTAINER_WALLET1_DIR = '/shared/wallet1';
const CONTAINER_WALLET2_DIR = '/shared/wallet2';
const LOG_FILENAME = 'shielding-process.log';

const activeWorkflows = new Map<string, AbortController>();

async function appendSharedLog(containerName: string, line: string): Promise<void> {
  const sharedDir = getSharedDirFromContainer(containerName);
  const logPath = path.join(sharedDir, LOG_FILENAME);
  const ts = new Date().toISOString();
  await fs.appendFile(logPath, `[${ts}] ${line}\n`).catch(() => {});
}

function logStage(containerName: string, stage: WorkflowStage, detail: string): void {
  appendSharedLog(containerName, `[${stage}] ${detail}`);
}

// ── Public API ─────────────────────────────────────────────────────

export function startWorkflow(fastify: FastifyInstance, transactionId: string, containerName: string): void {
  if (activeWorkflows.has(transactionId)) return;
  const controller = new AbortController();
  activeWorkflows.set(transactionId, controller);
  runWorkflow(fastify, transactionId, controller.signal).catch(err => {
    fastify.log.error(`Workflow ${transactionId} unhandled: ${err.message}`);
  });
}

export async function resumePendingWorkflows(fastify: FastifyInstance): Promise<void> {
  const pending = await getPendingWorkflows(fastify);
  fastify.log.info(`Resuming ${pending.length} pending workflow(s)`);
  for (const record of pending) {
    startWorkflow(fastify, record.transactionId, record.containerName);
  }
}

export function shutdownWorkflows(): void {
  for (const [, controller] of activeWorkflows) {
    controller.abort();
  }
  activeWorkflows.clear();
}

// ── Workflow execution loop ────────────────────────────────────────

async function runWorkflow(fastify: FastifyInstance, transactionId: string, signal: AbortSignal): Promise<void> {
  const log = fastify.log.child({ workflow: transactionId });
  try {
    let record = await getWorkflowRecord(fastify, transactionId);
    if (!record) { log.error('Workflow record not found'); return; }

    await appendSharedLog(record.containerName, '========== SHIELDING ORCHESTRATION ==========');
    await appendSharedLog(record.containerName, `Transaction: ${transactionId} | Container: ${record.containerName}`);
    await appendSharedLog(record.containerName, '-------------------------------------------');

    while (!TERMINAL_STAGES.has(record.workflowStage)) {
      if (signal.aborted) {
        await appendSharedLog(record.containerName, '[FILE] Workflow aborted (shutdown).');
        log.info('Workflow aborted (shutdown)');
        return;
      }

      log.info(`Executing stage: ${record.workflowStage}`);
      await appendSharedLog(record.containerName, `[STAGE] ${record.workflowStage}`);
      const { nextStage, data, statusUpdate } = await executeStage(fastify, record, signal);

      const effectiveStatusUpdate = statusUpdate ?? (nextStage === WorkflowStage.FAILED ? { status: 'FAILED' as const } : undefined);
      await updateWorkflowAndStatus(fastify, transactionId, nextStage, data, effectiveStatusUpdate);
      await appendSharedLog(record.containerName, `[STAGE] -> ${nextStage}`);
      record = await getWorkflowRecord(fastify, transactionId);
      if (!record) { log.error('Workflow record lost mid-execution'); return; }
    }

    await appendSharedLog(record.containerName, '-------------------------------------------');
    await appendSharedLog(record.containerName, `Terminal: ${record.workflowStage}`);
    await appendSharedLog(record.containerName, '========== END ==========');
    log.info(`Workflow terminal: ${record.workflowStage}`);

    if (record.workflowStage === WorkflowStage.COMPLETE) {
      await sendUserWebhook(log, record, fastify);
    }
  } catch (err: any) {
    log.error(`Workflow fatal error: ${err.message}`);
    try {
      const rec = await getWorkflowRecord(fastify, transactionId);
      if (rec) {
        await appendSharedLog(rec.containerName, '-------------------------------------------');
        await appendSharedLog(rec.containerName, `FATAL: ${err.message}`);
        await appendSharedLog(rec.containerName, `Stack: ${(err.stack || '').split('\n').slice(0, 3).join(' | ')}`);
        await appendSharedLog(rec.containerName, '========== END (FAILED) ==========');
      }
    } catch { /* ignore */ }
    await failWorkflow(fastify, transactionId, err.message).catch(() => {});
  } finally {
    activeWorkflows.delete(transactionId);
  }
}

// ── Stage dispatcher ───────────────────────────────────────────────

interface StageResult {
  nextStage: WorkflowStage;
  data: WorkflowData;
  statusUpdate?: StatusUpdate;
}

async function executeStage(
  fastify: FastifyInstance,
  record: WorkflowRecord,
  signal: AbortSignal,
): Promise<StageResult> {
  const { workflowStage: stage, workflowData: data, containerName } = record;
  const log = fastify.log.child({ workflow: record.transactionId, stage });
  let serverUrl = process.env.LIGHTWALLETD_SERVER || undefined;
  if (serverUrl && /localhost|127\.0\.0\.1/.test(serverUrl)) {
    const host = process.env.ZPAY_DOCKER_HOST_ALIAS || '172.17.0.1';
    serverUrl = serverUrl.replace(/localhost|127\.0\.0\.1/g, host);
  }

  const w1Client = new ZingoClient({ mode: 'container', containerName, dataDir: CONTAINER_WALLET1_DIR, serverUrl });
  const w2Client = new ZingoClient({ mode: 'container', containerName, dataDir: CONTAINER_WALLET2_DIR, serverUrl });

  try {
    switch (stage) {
      case WorkflowStage.BOOTSTRAP_CONTAINER: {
        logStage(containerName, stage, 'Waiting for container to be ready...');
        const maxWait = 60_000;
        const start = Date.now();
        while (Date.now() - start < maxWait) {
          if (signal.aborted) throw new ZingoError('aborted');
          const running = await isContainerRunning(fastify.log, containerName);
          if (running) {
            logStage(containerName, stage, `Container ready (${Math.round((Date.now() - start) / 1000)}s).`);
            return { nextStage: WorkflowStage.INIT_WALLETS, data };
          }
          await sleep(2_000);
        }
        throw new ZingoError('Container failed to start within 60s');
      }

      case WorkflowStage.INIT_WALLETS: {
        logStage(containerName, stage, 'Initializing wallets...');
        const sharedDir = getSharedDirFromContainer(containerName);

        const w1Addrs = await w1Client.initWallet();
        logStage(containerName, stage, 'W1 keys created, syncing to chain tip...');
        const w1Sync = await w1Client.ensureSynced({ label: 'W1 init', signal });
        logStage(containerName, stage, `W1 sync: wallet=${w1Sync.walletHeight} chain=${w1Sync.chainHeight} synced=${w1Sync.synced}`);

        const w2Addrs = await w2Client.initWallet();
        logStage(containerName, stage, 'W2 keys created, syncing to chain tip...');
        const w2Sync = await w2Client.ensureSynced({ label: 'W2 init', signal });
        logStage(containerName, stage, `W2 sync: wallet=${w2Sync.walletHeight} chain=${w2Sync.chainHeight} synced=${w2Sync.synced}`);

        // Extract addresses
        const w1Entry = w1Addrs[0];
        const w1Unified = w1Entry?.encoded_address || w1Entry?.address || '';
        const w1Transparent = w1Entry?.receivers?.transparent || '';

        // Also get transparent from t_addresses (v3.0.0 compat)
        let w1Taddr = w1Transparent;
        if (!w1Taddr) {
          const tAddrs = await w1Client.tAddresses().catch(() => [] as string[]);
          w1Taddr = tAddrs[0] || '';
        }

        const w2Entry = w2Addrs[0];
        const w2Unified = w2Entry?.encoded_address || w2Entry?.address || '';

        if (!w1Taddr || !w1Unified) throw new ZingoError('Failed to derive wallet1 addresses');
        if (!w2Unified) throw new ZingoError('Failed to derive wallet2 address');

        // Write address files for /address endpoint compatibility
        await fs.writeFile(
          path.join(sharedDir, 'wallet1-addresses.json'),
          JSON.stringify({ transparent_address: w1Taddr, unified_address: w1Unified }),
        );
        await fs.writeFile(
          path.join(sharedDir, 'wallet2-addresses.json'),
          JSON.stringify({ unified_address: w2Unified }),
        );

        const updatedData: WorkflowData = {
          ...data,
          w1TransparentAddr: w1Taddr,
          w1UnifiedAddr: w1Unified,
          w2UnifiedAddr: w2Unified,
        };

        logStage(containerName, stage, `W1 t-addr: ${w1Taddr.slice(0, 12)}...${w1Taddr.slice(-6)} | unified: ${w1Unified.slice(0, 12)}...`);
        logStage(containerName, stage, `W2 unified: ${w2Unified.slice(0, 12)}...${w2Unified.slice(-6)} | Monitoring for deposits.`);
        log.info(`Wallets initialized: W1 t-addr=${w1Taddr.slice(0, 12)}..., W2=${w2Unified.slice(0, 12)}...`);
        return { nextStage: WorkflowStage.WAIT_FOR_W1_FUNDS, data: updatedData };
      }

      case WorkflowStage.WAIT_FOR_W1_FUNDS: {
        logStage(containerName, stage, 'Polling W1 for incoming funds (transparent + shielded)...');
        const timeout = 86_400_000; // 24h — funds must reach Exodus
        const start = Date.now();
        let pollCount = 0;

        while (Date.now() - start < timeout) {
          if (signal.aborted) throw new ZingoError('aborted');
          pollCount++;

          const syncStatus = await w1Client.ensureSynced({ label: `W1 fund-poll-${pollCount}`, signal });
          if (pollCount <= 2 || pollCount % 3 === 0) {
            logStage(containerName, stage, `Poll ${pollCount}: wallet=${syncStatus.walletHeight} chain=${syncStatus.chainHeight} synced=${syncStatus.synced}${syncStatus.rescanTriggered ? ' (rescanned)' : ''}`);
          }

          const transparent = await w1Client.transparentBalance();
          const shielded = await w1Client.spendableBalance();
          log.info(`W1 balances: transparent=${transparent}, shielded=${shielded} | height=${syncStatus.walletHeight}/${syncStatus.chainHeight}`);

          if (shielded > 0n) {
            const received = Number(shielded);
            const feeAmount = Math.floor(received * parseFloat(data.feePercentage || '0') / 100);
            const updatedData: WorkflowData = {
              ...data,
              fundedViaShielded: true,
              initialReceivedZatoshi: received,
              feeAmountZatoshi: feeAmount,
            };
            logStage(containerName, stage, `FUNDS DETECTED (shielded): ${received} zatoshi | Fee ${data.feePercentage}% = ${feeAmount} zatoshi`);

            return {
              nextStage: WorkflowStage.WAIT_FOR_W1_SPENDABLE,
              data: updatedData,
              statusUpdate: { status: 'RECEIVED', addressesUsed: [data.w1TransparentAddr!, data.w1UnifiedAddr!] },
            };
          }

          if (transparent > 0n) {
            const received = Number(transparent);
            const feeAmount = Math.floor(received * parseFloat(data.feePercentage || '0') / 100);
            const updatedData: WorkflowData = {
              ...data,
              fundedViaShielded: false,
              initialReceivedZatoshi: received,
              feeAmountZatoshi: feeAmount,
            };
            logStage(containerName, stage, `FUNDS DETECTED (transparent): ${received} zatoshi | Fee ${data.feePercentage}% = ${feeAmount} zatoshi | Will shield next.`);

            return {
              nextStage: WorkflowStage.SHIELD_W1_IF_TRANSPARENT,
              data: updatedData,
              statusUpdate: { status: 'RECEIVED', addressesUsed: [data.w1TransparentAddr!, data.w1UnifiedAddr!] },
            };
          }

          await sleep(10_000);
        }

        throw new ZingoError('Timeout waiting for funds in wallet 1 (24h)');
      }

      case WorkflowStage.SHIELD_W1_IF_TRANSPARENT: {
        if (data.fundedViaShielded) {
          logStage(containerName, stage, 'Skipped (funds arrived shielded).');
          return { nextStage: WorkflowStage.WAIT_FOR_W1_SPENDABLE, data };
        }

        logStage(containerName, stage, 'Quickshield broadcast... waiting for confirmations.');
        const txid = await w1Client.shieldTransparent({
          label: 'shield W1',
          signal,
          onProgress: (msg) => logStage(containerName, stage, msg),
        });
        const updatedData: WorkflowData = { ...data, txidShield: txid };
        logStage(containerName, stage, `Shield tx broadcast: ${txid || '(txid pending)'}`);

        return {
          nextStage: WorkflowStage.WAIT_FOR_W1_SPENDABLE,
          data: updatedData,
          statusUpdate: { status: 'PROCESSING', addressesUsed: [data.w1TransparentAddr!, data.w1UnifiedAddr!] },
        };
      }

      case WorkflowStage.WAIT_FOR_W1_SPENDABLE: {
        logStage(containerName, stage, 'Shielded notes need ~1 block confirmation (ZEC ~75s/block). Polling every 15s...');
        const balance = await w1Client.waitForSpendable(1n, {
          label: 'W1 spendable',
          signal,
          timeoutMs: 86_400_000,
          onPoll: (b, n, ss) => {
            if (n <= 1 || n % 2 === 0 || b > 0n) {
              logStage(containerName, stage, `Poll ${n}: spendable=${b} zat | height=${ss.walletHeight}/${ss.chainHeight}${ss.rescanTriggered ? ' (rescanned)' : ''}${b === 0n ? ' (waiting for confirmations)' : ''}`);
            }
          },
        });
        logStage(containerName, stage, `W1 spendable: ${balance} zatoshi | Proceeding to fee.`);
        log.info(`W1 spendable: ${balance} zatoshi`);

        const statusUpdate = !data.fundedViaShielded
          ? { status: 'PROCESSING' as const, addressesUsed: [data.w1TransparentAddr!, data.w1UnifiedAddr!] }
          : undefined;
        return { nextStage: WorkflowStage.SEND_FEE, data, statusUpdate };
      }

      case WorkflowStage.SEND_FEE: {
        const feeAmount = BigInt(data.feeAmountZatoshi || 0);
        const feeDest = data.feeDestinationAddr || data.exodusWallet || '';

        if (feeAmount <= 0n || !feeDest) {
          logStage(containerName, stage, 'Skipped (fee amount 0 or no destination).');
          return { nextStage: WorkflowStage.WAIT_FOR_W1_CHANGE_SPENDABLE, data };
        }

        const { balance: spendable, syncStatus: feeSyncStatus } = await w1Client.syncAndGetSpendable({ label: 'fee pre-send', signal });
        logStage(containerName, stage, `Synced: height=${feeSyncStatus.walletHeight}/${feeSyncStatus.chainHeight} | spendable=${spendable}`);
        const minRequired = feeAmount + BigInt(TX_FEE_ZATOSHI);

        if (spendable < minRequired) {
          logStage(containerName, stage, `Skipped: spendable=${spendable}, need ${minRequired} (fee ${feeAmount} + tx ${TX_FEE_ZATOSHI}).`);
          return { nextStage: WorkflowStage.WAIT_FOR_W1_CHANGE_SPENDABLE, data };
        }

        logStage(containerName, stage, `Sending fee ${feeAmount} zatoshi -> ${feeDest.slice(0, 12)}...`);
        const txid = await w1Client.syncAndSend(feeDest, feeAmount, {
          label: 'fee transfer',
          signal,
          onProgress: (msg) => logStage(containerName, stage, msg),
        });
        logStage(containerName, stage, `Fee sent. txid: ${txid || '(pending)'}`);
        return { nextStage: WorkflowStage.WAIT_FOR_W1_CHANGE_SPENDABLE, data: { ...data, txidFee: txid } };
      }

      case WorkflowStage.WAIT_FOR_W1_CHANGE_SPENDABLE: {
        logStage(containerName, stage, 'Waiting for W1 spendable balance (~1 block). Polling...');
        const balance = await w1Client.waitForSpendable(1n, {
          label: 'W1 change spendable',
          signal,
          timeoutMs: 86_400_000,
          onPoll: (b, n, ss) => {
            if (n <= 1 || n % 2 === 0 || b > 0n) {
              logStage(containerName, stage, `Poll ${n}: spendable=${b} zat | height=${ss.walletHeight}/${ss.chainHeight}${ss.rescanTriggered ? ' (rescanned)' : ''}`);
            }
          },
        });

        logStage(containerName, stage, `W1 spendable: ${balance} | Ready for W1->W2 drain.`);
        // Preserve stageAttempts — retry path increments it, don't reset here
        return { nextStage: WorkflowStage.SEND_W1_TO_W2, data };
      }

      case WorkflowStage.SEND_W1_TO_W2: {
        const stageAttempts = data.stageAttempts || 0;
        logStage(containerName, stage, `Draining W1 -> W2 (${data.w2UnifiedAddr?.slice(0, 14)}...) [attempt ${stageAttempts + 1}]`);

        // On repeated failures, do a rescan before retrying
        if (stageAttempts > 0 && stageAttempts % 3 === 0) {
          logStage(containerName, stage, `Attempt ${stageAttempts + 1}: rescanning W1 to recover wallet state...`);
          try { await w1Client.rescan(); } catch { /* continue */ }
          await w1Client.save();
          await sleep(60_000);
        }

        try {
          const { txid, amountSent } = await w1Client.sendMax(data.w2UnifiedAddr!, {
            label: 'W1->W2',
            signal,
            onProgress: (msg) => logStage(containerName, stage, msg),
          });
          logStage(containerName, stage, `W1->W2 sent: ${amountSent} zat, txid=${txid}`);
          return { nextStage: WorkflowStage.WAIT_FOR_W2_SPENDABLE, data: { ...data, txidW1ToW2: txid, stageAttempts: 0 } };
        } catch (e) {
          const errMsg = (e as Error).message || '';
          logStage(containerName, stage, `sendMax failed: ${errMsg.slice(0, 200)} — retrying from WAIT_FOR_W1_CHANGE_SPENDABLE`);
          return {
            nextStage: WorkflowStage.WAIT_FOR_W1_CHANGE_SPENDABLE,
            data: { ...data, stageAttempts: stageAttempts + 1, lastError: errMsg },
          };
        }
      }

      case WorkflowStage.WAIT_FOR_W2_SPENDABLE: {
        logStage(containerName, stage, 'Waiting for W2 to receive W1->W2 tx (~1 block). Polling...');
        const balance = await w2Client.waitForSpendable(1n, {
          label: 'W2 spendable',
          signal,
          timeoutMs: 86_400_000,
          onPoll: (b, n, ss) => {
            if (n <= 1 || n % 2 === 0 || b > 0n) {
              logStage(containerName, stage, `Poll ${n}: spendable=${b} zat | height=${ss.walletHeight}/${ss.chainHeight}${ss.rescanTriggered ? ' (rescanned)' : ''}`);
            }
          },
        });
        logStage(containerName, stage, `W2 spendable: ${balance} zatoshi | Proceeding to Exodus.`);
        // Preserve stageAttempts — retry path increments it, don't reset here
        return { nextStage: WorkflowStage.SEND_W2_TO_EXODUS, data };
      }

      case WorkflowStage.SEND_W2_TO_EXODUS: {
        const stageAttempts = data.stageAttempts || 0;
        const exodus = data.exodusWallet!;
        logStage(containerName, stage, `Draining W2 -> Exodus (${exodus.slice(0, 14)}...) [attempt ${stageAttempts + 1}]`);

        // On repeated failures, do a rescan before retrying
        if (stageAttempts > 0 && stageAttempts % 3 === 0) {
          logStage(containerName, stage, `Attempt ${stageAttempts + 1}: rescanning W2 to recover wallet state...`);
          try { await w2Client.rescan(); } catch { /* continue */ }
          await w2Client.save();
          await sleep(60_000);
        }

        try {
          const { txid, amountSent } = await w2Client.sendMax(exodus, {
            label: 'W2->Exodus',
            signal,
            onProgress: (msg) => logStage(containerName, stage, msg),
          });
          logStage(containerName, stage, `W2->Exodus sent: ${amountSent} zat, txid=${txid}`);

          const zec = (Number(amountSent) / 1e8).toFixed(8);
          logStage(containerName, stage, `=== COMPLETE === Received ${data.initialReceivedZatoshi} zat | Fee ${data.feeAmountZatoshi || 0} zat | Final payout ${amountSent} zat (${zec} ZEC)`);
          logStage(containerName, stage, `TX chain: shield=${data.txidShield || '-'} | fee=${data.txidFee || '-'} | w1w2=${data.txidW1ToW2 || '-'} | exodus=${txid || '-'}`);

          const txHashes = [data.txidFee, data.txidW1ToW2, txid].filter(Boolean) as string[];
          const addresses = [
            data.w1TransparentAddr, data.w1UnifiedAddr, data.w2UnifiedAddr,
            data.feeDestinationAddr, data.exodusWallet,
          ].filter(Boolean) as string[];

          return {
            nextStage: WorkflowStage.COMPLETE,
            data: { ...data, txidW2ToExodus: txid },
            statusUpdate: { status: 'COMPLETED', addressesUsed: addresses, txHashes },
          };
        } catch (e) {
          const errMsg = (e as Error).message || '';
          logStage(containerName, stage, `sendMax failed: ${errMsg.slice(0, 200)} — retrying from WAIT_FOR_W2_SPENDABLE`);
          return {
            nextStage: WorkflowStage.WAIT_FOR_W2_SPENDABLE,
            data: { ...data, stageAttempts: stageAttempts + 1, lastError: errMsg },
          };
        }
      }

      default:
        throw new ZingoError(`Unknown stage: ${stage}`);
    }
  } catch (err: any) {
    log.error(`Stage ${stage} failed: ${err.message}`);
    logStage(containerName, stage, `FAILED: ${err.message}`);
    const updatedData: WorkflowData = { ...data, lastError: err.message };
    return { nextStage: WorkflowStage.FAILED, data: updatedData };
  }
}

// ── DB helpers ─────────────────────────────────────────────────────

async function getWorkflowRecord(fastify: FastifyInstance, transactionId: string): Promise<WorkflowRecord | null> {
  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, "workflowStage", "workflowData", "containerName", "failureReason"
       FROM "Transaction" WHERE id = $1`,
      [transactionId],
    );
    if (!rows.length) return null;
    const r = rows[0];
    return {
      transactionId: r.id,
      workflowStage: r.workflowStage as WorkflowStage,
      workflowData: (r.workflowData || {}) as WorkflowData,
      containerName: r.containerName || '',
      failureReason: r.failureReason,
    };
  } finally {
    client.release();
  }
}

async function getPendingWorkflows(fastify: FastifyInstance): Promise<WorkflowRecord[]> {
  const client = await fastify.pg.connect();
  try {
    const { rows } = await client.query(
      `SELECT id, "workflowStage", "workflowData", "containerName", "failureReason"
       FROM "Transaction"
       WHERE "workflowStage" IS NOT NULL
         AND "workflowStage" NOT IN ('COMPLETE', 'FAILED')
       ORDER BY "createdAt" ASC`,
    );
    return rows.map(r => ({
      transactionId: r.id,
      workflowStage: r.workflowStage as WorkflowStage,
      workflowData: (r.workflowData || {}) as WorkflowData,
      containerName: r.containerName || '',
      failureReason: r.failureReason,
    }));
  } finally {
    client.release();
  }
}

async function updateWorkflowAndStatus(
  fastify: FastifyInstance,
  transactionId: string,
  stage: WorkflowStage,
  data: WorkflowData,
  statusUpdate?: StatusUpdate,
  failureReason?: string,
): Promise<void> {
  const client = await fastify.pg.connect();
  try {
    const setClauses = [
      `"workflowStage" = $1`,
      `"workflowData" = $2`,
      `"failureReason" = $3`,
      `"updatedAt" = NOW()`,
    ];
    const params: any[] = [stage, JSON.stringify(data), failureReason ?? null];
    let idx = 4;

    if (statusUpdate) {
      setClauses.push(`status = $${idx}`);
      params.push(statusUpdate.status);
      idx++;
      if (statusUpdate.addressesUsed) {
        setClauses.push(`"addressesUsed" = $${idx}`);
        params.push(statusUpdate.addressesUsed);
        idx++;
      }
      if (statusUpdate.txHashes) {
        setClauses.push(`"txHashes" = $${idx}`);
        params.push(statusUpdate.txHashes);
        idx++;
      }
      if (statusUpdate.status === 'COMPLETED' || statusUpdate.status === 'FAILED') {
        setClauses.push(`"completedAt" = NOW()`);
      }
    }

    params.push(transactionId);
    await client.query(
      `UPDATE "Transaction" SET ${setClauses.join(', ')} WHERE id = $${idx}`,
      params,
    );
  } finally {
    client.release();
  }
}

async function failWorkflow(fastify: FastifyInstance, transactionId: string, reason: string): Promise<void> {
  const client = await fastify.pg.connect();
  try {
    await client.query(
      `UPDATE "Transaction"
       SET "workflowStage" = $1, "failureReason" = $2, status = 'FAILED', "updatedAt" = NOW(), "completedAt" = NOW()
       WHERE id = $3`,
      [WorkflowStage.FAILED, reason, transactionId],
    );
  } finally {
    client.release();
  }
}

// ── Helpers ────────────────────────────────────────────────────────

function getSharedDirFromContainer(containerName: string): string {
  // Container name format: DBUID-{dbUserId}_UID-{userId}_IID-{invoiceId}
  const parts = containerName.split('_');
  const dbUserId = (parts[0] || '').replace('DBUID-', '');
  const userId = (parts[1] || '').replace('UID-', '');
  const invoiceId = (parts[2] || '').replace('IID-', '');

  return path.join(config.sharedBaseDir, dbUserId, userId, invoiceId);
}

async function sendUserWebhook(log: any, record: WorkflowRecord, fastify?: FastifyInstance): Promise<void> {
  const data = record.workflowData;
  const parts = record.containerName.split('_');
  const dbUserId = (parts[0] || '').replace('DBUID-', '');
  let webhookUrl = data.webhookUrl && data.webhookUrl !== 'null' ? data.webhookUrl : null;
  let webhookSecret = data.webhookSecret && data.webhookSecret !== 'null' ? data.webhookSecret : null;

  if ((!webhookUrl || !webhookSecret) && fastify) {
    const fallback = await getWebhookConfigByUserId(fastify, dbUserId);
    if (fallback?.url && fallback?.secret) {
      webhookUrl = fallback.url;
      webhookSecret = fallback.secret;
      log.info(`Webhook credentials loaded from DB fallback for user ${dbUserId}`);
    }
  }
  if (!webhookUrl || !webhookSecret) {
    log.info(`Webhook skipped: no URL or secret configured for transaction ${record.transactionId}`);
    return;
  }

  const userId = (parts[1] || '').replace('UID-', '');
  const invoiceId = (parts[2] || '').replace('IID-', '');
  const txIds = [
    data.txidShield,
    data.txidFee,
    data.txidW1ToW2,
    data.txidW2ToExodus,
  ].filter(Boolean) as string[];
  const payload = JSON.stringify({
    json: {
      status: 'complete',
      transactionId: record.transactionId,
      invoiceId,
      userId,
      dbUserId,
      txIds,
      txidShield: data.txidShield ?? null,
      txidFee: data.txidFee ?? null,
      txidW1ToW2: data.txidW1ToW2 ?? null,
      txidW2ToExodus: data.txidW2ToExodus ?? null,
      addresses: {
        w1Transparent: data.w1TransparentAddr ?? null,
        w1Unified: data.w1UnifiedAddr ?? null,
        w2Unified: data.w2UnifiedAddr ?? null,
        exodusWallet: data.exodusWallet ?? null,
        feeDestination: data.feeDestinationAddr ?? null,
      },
      amounts: {
        initialReceivedZatoshi: data.initialReceivedZatoshi ?? null,
        feeAmountZatoshi: data.feeAmountZatoshi ?? null,
        feePercentage: data.feePercentage ?? null,
        fundedViaShielded: data.fundedViaShielded ?? null,
      },
    },
  });

  try {
    const urlOrigin = (() => { try { return new URL(webhookUrl).origin; } catch { return '(invalid-url)'; } })();
    log.info(`Sending webhook to ${urlOrigin} for transaction ${record.transactionId}`);
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${webhookSecret}`,
      },
      body: payload,
    });
    if (res.ok) {
      log.info(`Webhook delivered successfully for transaction ${record.transactionId} (${res.status})`);
    } else {
      log.warn(`Webhook returned non-2xx for transaction ${record.transactionId}: ${res.status} ${res.statusText}`);
    }
  } catch (e) {
    log.warn(`Webhook request failed for transaction ${record.transactionId}: ${(e as Error).message}`);
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}
