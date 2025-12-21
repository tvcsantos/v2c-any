import { Registry } from './registry/registry.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { globSync } from 'glob';
import { logger } from './utils/logger.js';
/**
 * Registry of device provider factories keyed by device identifier.
 * Each factory produces an `EM1Status` provider for a specific device.
 */
export const devicesProviderRegistry = new Registry();
/**
 * Registry of device adapters keyed by device identifier.
 * Each adapter transforms raw device messages into `EnergyInformation`.
 */
export const devicesAdapterRegistry = new Registry();
/**
 * Dynamically loads all device modules discovered under devices.
 * Imports each module to allow self-registration into application registries.
 *
 * @returns A promise that resolves when all device modules are loaded
 */
export async function loadDeviceModules() {
    logger.info('Loading device modules...');
    const __dirname = dirname(fileURLToPath(import.meta.url));
    logger.info(`Current directory: ${__dirname}`);
    // Support both .ts (dev/tsx) and .js (built) files
    const devicePaths = globSync('device/**/index.{ts,js}', { cwd: __dirname });
    logger.info(`Found ${devicePaths.length} device modules.`);
    for (const path of devicePaths) {
        logger.info(`Importing module: ${path}`);
        await import(`./${path}`);
        logger.info(`Imported module: ${path}`);
    }
}
