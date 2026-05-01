import path from 'path';
import fs from 'fs/promises'; // Use promises API
import { FastifyInstance } from 'fastify';
import { NotFoundError, InternalServerError } from './errors';

export interface WalletAddresses {
    transparent: string | null;
    shielded: string | null;
}

export async function getUserAddressesFromFile(log: FastifyInstance['log'], userSharedDir: string): Promise<WalletAddresses> {
    const addressFilePath = path.join(userSharedDir, 'wallet1-addresses.json');
    const result: WalletAddresses = { transparent: null, shielded: null };

    try {
        const stats = await fs.stat(addressFilePath);
        if (stats.size === 0) {
            log.warn(`Address file exists but is empty: ${addressFilePath}`);
            return result;
        }

        const fileContent = await fs.readFile(addressFilePath, 'utf-8');
        const addressesData = JSON.parse(fileContent);

        if (Array.isArray(addressesData) && addressesData.length > 0) {
            const entry = addressesData[0];
            const receivers = entry?.receivers;
            if (receivers) {
                if (typeof receivers.transparent === 'string') result.transparent = receivers.transparent.trim();
                if (typeof receivers.sapling === 'string') result.shielded = receivers.sapling.trim();
            }
            // unified address as shielded fallback
            const unified = entry?.address || entry?.encoded_address;
            if (!result.shielded && typeof unified === 'string' && unified.startsWith('u1')) {
                result.shielded = unified.trim();
            }
        } else if (typeof addressesData === 'object' && addressesData !== null) {
            if (typeof addressesData.transparent_address === 'string') result.transparent = addressesData.transparent_address.trim();
            const shielded = addressesData.sapling_address || addressesData.unified_address;
            if (typeof shielded === 'string') result.shielded = shielded.trim();
        } else {
            log.warn(`Address file ${addressFilePath} has unexpected structure: ${JSON.stringify(addressesData).substring(0, 100)}`);
        }

        if (result.transparent && !result.transparent.startsWith('t')) {
            log.warn(`Address from ${addressFilePath} does not look like a t-address: ${result.transparent}`);
            result.transparent = null;
        }
        if (result.shielded && !result.shielded.startsWith('z') && !result.shielded.startsWith('u1')) {
            log.warn(`Address from ${addressFilePath} does not look like a shielded address: ${result.shielded}`);
            result.shielded = null;
        }

        return result;
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            log.debug(`Address file does not exist yet: ${addressFilePath}`);
        } else if (error instanceof SyntaxError) {
            log.error(`Could not decode JSON from address file: ${addressFilePath}`);
        } else {
            log.error(`Unexpected error reading address file ${addressFilePath}: ${error.message || error}`);
        }
        return result;
    }
}

// Backward-compat wrapper — returns only the transparent address
export async function getUserAddressFromFile(log: FastifyInstance['log'], userSharedDir: string): Promise<string | null> {
    const { transparent } = await getUserAddressesFromFile(log, userSharedDir);
    return transparent;
}


// --- File Parsing Helper Functions ---

// Parses zingo-cli list output (like the Python version)
export async function parseTransactionFile(log: FastifyInstance['log'], filePath: string): Promise<Set<string>> {
    const txids = new Set<string>();
    try {
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            log.debug(`Transaction file found but empty: ${filePath}`);
            return txids;
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');
        const lines = fileContent.split('\n');
        const prefix = "txid:";

        for (const line of lines) {
            const strippedLine = line.trim();
            if (strippedLine.toLowerCase().startsWith(prefix)) {
                let txidValue = strippedLine.substring(prefix.length).trim();
                // Remove potential quotes
                if ((txidValue.startsWith('"') && txidValue.endsWith('"')) || (txidValue.startsWith("'") && txidValue.endsWith("'"))) {
                    txidValue = txidValue.substring(1, txidValue.length - 1);
                }

                // Basic validation (64 hex chars)
                if (txidValue && /^[0-9a-fA-F]{64}$/.test(txidValue)) {
                    txids.add(txidValue);
                    log.debug(`Extracted txid ${txidValue} from ${filePath}`);
                } else {
                    log.warn(`Found potential txid line but value seems invalid in ${filePath}: '${line.trim()}' -> Extracted: '${txidValue}'`);
                }
            }
        }
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            log.debug(`Transaction file not found: ${filePath}`);
        } else {
            log.error(`Error reading or parsing transaction file ${filePath}: ${error.message || error}`);
        }
    }
     if (txids.size === 0) {
         log.debug(`No valid txids extracted from transaction file: ${filePath}`);
     }
    return txids;
}

// Parses wallet address JSON file
export async function parseAddressFile(log: FastifyInstance['log'], filePath: string): Promise<Set<string>> {
    const addresses = new Set<string>();
    try {
        const stats = await fs.stat(filePath);
        if (stats.size === 0) {
            log.debug(`Address file found but empty: ${filePath}`);
            return addresses;
        }

        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        // Structure 1: List -> Object -> receivers
        if (Array.isArray(data) && data.length > 0 && data[0]?.receivers) {
            const receivers = data[0].receivers;
            if (typeof receivers === 'object' && receivers !== null) {
                const tAddr = receivers.transparent;
                const sAddr = receivers.sapling;
                if (tAddr && typeof tAddr === 'string' && tAddr.trim().startsWith('t')) addresses.add(tAddr.trim());
                if (sAddr && typeof sAddr === 'string' && sAddr.trim().startsWith('z')) addresses.add(sAddr.trim());
            }
        }
        // Structure 2: Direct Object
        else if (typeof data === 'object' && data !== null) {
             const tAddr = data.transparent_address;
             const sAddr = data.sapling_address;
             if (tAddr && typeof tAddr === 'string' && tAddr.trim().startsWith('t')) addresses.add(tAddr.trim());
             if (sAddr && typeof sAddr === 'string' && sAddr.trim().startsWith('z')) addresses.add(sAddr.trim());
        }
        else {
             log.warn(`Address file ${filePath} has unexpected top-level structure (expected list or object).`);
        }

    } catch (error: any) {
         if (error.code === 'ENOENT') {
             log.debug(`Address file not found: ${filePath}`);
         } else if (error instanceof SyntaxError) {
             log.error(`Could not decode JSON from address file: ${filePath}`);
         } else {
             log.error(`Error reading or parsing address file ${filePath}: ${error.message || error}`);
         }
    }
    return addresses;
}

// Lists subdirectories matching numeric pattern (clientUserId/invoiceId)
export async function listTransactionDirectories(log: FastifyInstance['log'], userBasePath: string): Promise<string[]> {
    const transactionDirs: string[] = [];
    try {
        const clientUserDirs = await fs.readdir(userBasePath, { withFileTypes: true });

        for (const clientUserDir of clientUserDirs) {
            // Check if it's a directory and looks like a numeric ID (adjust regex if needed)
            if (clientUserDir.isDirectory() && /^[0-9]+$/.test(clientUserDir.name)) {
                const clientUserPath = path.join(userBasePath, clientUserDir.name);
                try {
                    const invoiceDirs = await fs.readdir(clientUserPath, { withFileTypes: true });
                    for (const invoiceDir of invoiceDirs) {
                        // Check if it's a directory and looks like a numeric ID
                        if (invoiceDir.isDirectory() && /^[0-9]+$/.test(invoiceDir.name)) {
                             transactionDirs.push(path.join(clientUserPath, invoiceDir.name));
                        }
                    }
                } catch (invDirErr: any) {
                     // Ignore errors reading invoice directories (e.g., permission denied)
                     log.warn(`Could not read contents of ${clientUserPath}: ${invDirErr.message}`);
                }
            }
        }
    } catch (error: any) {
         if (error.code === 'ENOENT') {
             log.warn(`User base directory not found for scanning: ${userBasePath}`);
         } else {
             log.error(`Error scanning user directory ${userBasePath}: ${error.message || error}`);
             // Decide whether to throw or return empty list
             // throw new InternalServerError(`Failed to scan shared directory: ${error.message}`);
         }
    }
    return transactionDirs;
}
