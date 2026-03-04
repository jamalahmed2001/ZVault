import path from 'path';
import fs from 'fs/promises'; // Use promises API
import { FastifyInstance } from 'fastify';
import { NotFoundError, InternalServerError } from './errors';

// Reads the transparent address from the specific user's shared JSON file.
export async function getUserAddressFromFile(log: FastifyInstance['log'], userSharedDir: string): Promise<string | null> {
    const addressFilePath = path.join(userSharedDir, 'wallet1-addresses.json');
    let address: string | null = null;

    try {
        // Check if file exists and is not empty
        const stats = await fs.stat(addressFilePath);
        if (stats.size === 0) {
            log.warn(`Address file exists but is empty: ${addressFilePath}`);
            return null;
        }

        // Add a small delay? The Python version did. Might not be needed with async fs.
        // await delay(100);

        const fileContent = await fs.readFile(addressFilePath, 'utf-8');
        const addressesData = JSON.parse(fileContent);

        // Structure based on Python script: list containing one object
        if (Array.isArray(addressesData) && addressesData.length > 0) {
            const receivers = addressesData[0]?.receivers;
            if (receivers && typeof receivers.transparent === 'string') {
                address = receivers.transparent.trim();
            } else {
                 log.warn(`Found address file ${addressFilePath}, but structure missing receivers.transparent string.`);
            }
        } else if (typeof addressesData === 'object' && addressesData !== null && typeof addressesData.transparent_address === 'string') {
             // Fallback for direct object structure
             address = addressesData.transparent_address.trim();
        } else {
             log.warn(`Found address file ${addressFilePath}, but structure is unexpected: ${JSON.stringify(addressesData).substring(0, 100)}`);
        }


        if (address && !address.startsWith('t')) {
            log.warn(`Address read from ${addressFilePath} does not look like a t-address: ${address}`);
            return null; // Invalidate if it doesn't look right
        }

        return address;

    } catch (error: any) {
        if (error.code === 'ENOENT') {
            log.debug(`Address file does not exist yet: ${addressFilePath}`);
            return null; // File not found is expected before container writes it
        } else if (error instanceof SyntaxError) {
             log.error(`Could not decode JSON from address file: ${addressFilePath}`);
             // Don't throw, just return null, maybe log error level
             return null;
        } else {
            log.error(`Unexpected error reading address file ${addressFilePath}: ${error.message || error}`);
            // Depending on policy, could throw InternalServerError or just return null
            return null;
        }
    }
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
