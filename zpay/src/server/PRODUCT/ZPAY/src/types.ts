import { Decimal } from 'decimal.js';

export interface UserConfig {
    dbUserId: string;
    apiKeyId: string;
    zcashAddress: string;
    webhookUrl: string | null;
    webhookSecret: string | null;
    transactionFee: Decimal; // Percentage as Decimal
    limit: number;
    apiKey?: string; // The actual API key value (optional, for frontend display)
}

export interface TransactionRecord {
    id: string; // CUID
    amount: Decimal;
    status: 'PENDING' | 'RECEIVED' | 'PROCESSING' | 'COMPLETED' | 'FAILED'; // Extend as needed
    fee: Decimal; // Calculated fee amount
    invoiceId: string;
    clientUserId: string;
    txHashes: string[];
    addressesUsed: string[];
    zcashAddress: string; 
    createdAt: Date;
    updatedAt: Date;
    apiKeyId: string | null; // Foreign key to ApiKey table
}

// Interface for data passed to the asynchronous container creation process
export interface CreateContainerJobData {
    dbUserId: string;
    clientUserId: string;
    invoiceId: string;
    userSharedDir: string; // Path like /shared/dbUserId/clientUserId/invoiceId
    exodusWallet: string;
    webhookUrl: string | null;
    webhookSecret: string | null;
    feePercentage: string; // Pass percentage as string
    feeDestinationAddr?: string | null; // Optional fee destination address
    containerTimeout: number;
}
