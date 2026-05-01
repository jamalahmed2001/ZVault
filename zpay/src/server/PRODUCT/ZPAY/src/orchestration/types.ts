export enum WorkflowStage {
  BOOTSTRAP_CONTAINER = 'BOOTSTRAP_CONTAINER',
  INIT_WALLETS = 'INIT_WALLETS',
  WAIT_FOR_W1_FUNDS = 'WAIT_FOR_W1_FUNDS',
  SHIELD_W1_IF_TRANSPARENT = 'SHIELD_W1_IF_TRANSPARENT',
  WAIT_FOR_W1_SPENDABLE = 'WAIT_FOR_W1_SPENDABLE',
  SEND_FEE = 'SEND_FEE',
  WAIT_FOR_W1_CHANGE_SPENDABLE = 'WAIT_FOR_W1_CHANGE_SPENDABLE',
  SEND_W1_TO_W2 = 'SEND_W1_TO_W2',
  WAIT_FOR_W2_SPENDABLE = 'WAIT_FOR_W2_SPENDABLE',
  SEND_W2_TO_EXODUS = 'SEND_W2_TO_EXODUS',
  COMPLETE = 'COMPLETE',
  FAILED = 'FAILED',
}

export const TERMINAL_STAGES = new Set([WorkflowStage.COMPLETE, WorkflowStage.FAILED]);

export interface WorkflowData {
  w1TransparentAddr?: string;
  w1UnifiedAddr?: string;
  w2UnifiedAddr?: string;
  fundedViaShielded?: boolean;
  initialReceivedZatoshi?: number;
  feeAmountZatoshi?: number;
  feePercentage?: string;
  exodusWallet?: string;
  feeDestinationAddr?: string;
  txidShield?: string;
  txidFee?: string;
  txidW1ToW2?: string;
  txidW2ToExodus?: string;
  stageAttempts?: number;
  lastError?: string;
  webhookUrl?: string | null;
  webhookSecret?: string | null;
  /** RSA-OAEP-SHA256 ciphertext (base64) of W1's BIP-39 seed. */
  w1EscrowedSeed?: EscrowedSeedRecord;
  /** RSA-OAEP-SHA256 ciphertext (base64) of W2's BIP-39 seed. */
  w2EscrowedSeed?: EscrowedSeedRecord;
}

export interface EscrowedSeedRecord {
  cipher: string;
  birthday: number;
  pubkeyFingerprint: string;
  algo: 'rsa-oaep-sha256';
  ts: string;
}

export interface WorkflowRecord {
  transactionId: string;
  workflowStage: WorkflowStage;
  workflowData: WorkflowData;
  containerName: string;
  failureReason: string | null;
}

// Network fee buffer per transaction (zatoshi)
export const TX_FEE_ZATOSHI = 20_000;

export interface ZingoClientConfig {
  mode: 'host' | 'container';
  /** For host mode: path to zingo-cli binary */
  binaryPath?: string;
  /** For container mode: docker container name */
  containerName?: string;
  /** Wallet data directory (host path or container path) */
  dataDir: string;
  /** Optional lightwalletd server URL */
  serverUrl?: string;
}

export interface BalanceInfo {
  spendable: bigint;
  transparent: bigint;
  sapling: bigint;
  orchard: bigint;
}

export interface SyncStatus {
  walletHeight: number;
  chainHeight: number;
  /** true if wallet is within 1 block of chain tip */
  synced: boolean;
  rescanTriggered: boolean;
}

export interface AddressEntry {
  encoded_address?: string;
  address?: string;
  receivers?: {
    transparent?: string;
    sapling?: string;
    orchard?: string;
  };
}
