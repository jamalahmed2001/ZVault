import Decimal from 'decimal.js';
import fetch from 'node-fetch'; // Using node-fetch v2
import { config } from './config';
import { FastifyInstance } from 'fastify'; // Use FastifyInstance for logging
import { InternalServerError, ServiceUnavailableError } from './errors';
import fs from 'fs';
import path from 'path';

// Simple in-memory cache
const priceCache = {
    timestamp: 0,
    zecGbp: null as Decimal | null,
};
const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const API_TIMEOUT_MS = 5 * 1000; // 10 seconds
const BACKUP_CACHE_FILE = path.resolve(__dirname, '../../zec_price_cache.json');
const BACKUP_CACHE_MAX_AGE_MS = 60 * 60 * 1000; // 1 hour

async function fetchFromCoinGecko(log: FastifyInstance['log']): Promise<Decimal> {
    const url = 'https://api.coingecko.com/api/v3/simple/price?ids=zcash&vs_currencies=gbp';
    try {
        const response = await fetch(url, { timeout: API_TIMEOUT_MS });
        if (!response.ok) {
            throw new Error(`CoinGecko API request failed with status ${response.status}`);
        }
        const data: any = await response.json();
        if (!data?.zcash?.gbp) {
             throw new Error('Invalid response structure from CoinGecko');
        }
        log.info("Fetched ZEC/GBP from CoinGecko.");
        return new Decimal(data.zcash.gbp);
    } catch (error: any) {
        log.warn(`CoinGecko fetch failed: ${error.message || error}`);
        throw error; // Re-throw to be caught by the main function
    }
}

async function fetchFromCryptoCompare(log: FastifyInstance['log']): Promise<Decimal> {
    const url = 'https://min-api.cryptocompare.com/data/price?fsym=ZEC&tsyms=GBP';
     try {
        const response = await fetch(url, { timeout: API_TIMEOUT_MS });
        if (!response.ok) {
            throw new Error(`CryptoCompare API request failed with status ${response.status}`);
        }
        const data: any = await response.json();
         if (!data?.GBP) {
             throw new Error('Invalid response structure from CryptoCompare');
         }
        log.info("Fetched ZEC/GBP from CryptoCompare.");
        return new Decimal(data.GBP);
    } catch (error: any) {
        log.warn(`CryptoCompare fetch failed: ${error.message || error}`);
        throw error;
    }
}

// Placeholder - Requires API Key handling
async function fetchFromCoinMarketCap(log: FastifyInstance['log']): Promise<Decimal> {
     if (!config.cmcApiKey) {
         const msg = "CoinMarketCap API key not configured.";
         log.warn(msg);
         throw new Error(msg);
     }
    const url = 'https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=ZEC&convert=GBP';
    const headers = { 'X-CMC_PRO_API_KEY': config.cmcApiKey };
    try {
        const response = await fetch(url, { headers, timeout: API_TIMEOUT_MS });
        if (!response.ok) {
            throw new Error(`CoinMarketCap API request failed with status ${response.status}`);
        }
        const data: any = await response.json();
         if (!data?.data?.ZEC?.quote?.GBP?.price) {
             throw new Error('Invalid response structure from CoinMarketCap');
         }
        log.info("Fetched ZEC/GBP from CoinMarketCap.");
        return new Decimal(data.data.ZEC.quote.GBP.price);
    } catch (error: any) {
        log.warn(`CoinMarketCap fetch failed: ${error.message || error}`);
        throw error;
    }
}

export async function getZecPriceForGbpAmount(fastify: FastifyInstance, amountGbpCents: string | number | Decimal): Promise<Decimal> {
    const log = fastify.log; // Use Fastify logger instance
    const now = Date.now();
    let zecGbpPrice: Decimal | null = null;
    let usedBackup = false;

    try {
        // 1. Check cache
        if (priceCache.zecGbp && (now - priceCache.timestamp) < CACHE_TTL_MS) {
            log.info("Using cached ZEC/GBP price.");
            zecGbpPrice = priceCache.zecGbp;
        } else {
            // 2. Fetch from providers
            try {
                zecGbpPrice = await fetchFromCoinGecko(log);
            } catch (e1) {
                try {
                    zecGbpPrice = await fetchFromCryptoCompare(log);
                } catch (e2) {
                    try {
                        // Only try CMC if configured
                        if (config.cmcApiKey) {
                            zecGbpPrice = await fetchFromCoinMarketCap(log);
                        } else {
                            throw new Error("CoinMarketCap not configured."); // Skip CMC if no key
                        }
                    } catch (e3) {
                        // All providers failed, try backup file
                        try {
                            if (fs.existsSync(BACKUP_CACHE_FILE)) {
                                const raw = fs.readFileSync(BACKUP_CACHE_FILE, 'utf-8');
                                const parsed = JSON.parse(raw);
                                if (parsed && parsed.price && parsed.timestamp && (now - parsed.timestamp) < BACKUP_CACHE_MAX_AGE_MS) {
                                    zecGbpPrice = new Decimal(parsed.price);
                                    usedBackup = true;
                                    log.warn(`All providers failed, using backup ZEC/GBP price from file: ${parsed.price}`);
                                } else {
                                    log.error('Backup price cache file is too old or invalid.');
                                }
                            } else {
                                log.error('No backup price cache file found.');
                            }
                        } catch (backupErr) {
                            log.error(`Failed to load backup price cache: ${backupErr}`);
                        }
                        if (!zecGbpPrice) {
                            log.error("Failed to fetch ZEC/GBP price from all providers and no valid backup.");
                            throw new ServiceUnavailableError("Unable to fetch ZEC price from any provider.");
                        }
                    }
                }
            }

            // 3. Update cache and backup file if fetched from provider
            if (zecGbpPrice && !usedBackup) {
                priceCache.timestamp = now;
                priceCache.zecGbp = zecGbpPrice;
                log.info(`Updated ZEC/GBP price cache: ${zecGbpPrice.toString()}`);
                // Write to backup file
                try {
                    fs.writeFileSync(BACKUP_CACHE_FILE, JSON.stringify({ price: zecGbpPrice.toString(), timestamp: now }), 'utf-8');
                } catch (err) {
                    log.warn(`Failed to write backup price cache file: ${err}`);
                }
            }
        }

        // 4. Perform conversion
        const valueGbp = new Decimal(amountGbpCents).dividedBy(100);
        if (valueGbp.isNegative() || valueGbp.isZero()) {
            throw new Error("Amount must be positive.");
        }
        if (!zecGbpPrice || zecGbpPrice.isZero() || zecGbpPrice.isNegative()) {
            log.error(`Invalid ZEC/GBP price (${zecGbpPrice?.toString()}) used for calculation.`);
            throw new InternalServerError("Invalid ZEC price obtained for calculation.");
        }

        const zecAmount = valueGbp.dividedBy(zecGbpPrice);
        log.info(`Calculated ZEC amount: ${zecAmount} for GBP ${valueGbp.toFixed(2)}`);
        return zecAmount;

    } catch (error: any) {
        // Re-throw known AppErrors
        if (error instanceof ServiceUnavailableError || error instanceof InternalServerError) {
            throw error;
        }
        // Log and wrap unknown errors
        log.error(`Unexpected error during price calculation: ${error.message || error}`, { stack: error.stack });
        throw new InternalServerError("An unexpected error occurred during price calculation.");
    }
}
