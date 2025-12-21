import { Registry } from './registry/registry.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { globSync } from 'glob';
import { logger } from './utils/logger.js';
import type { ProviderFactory } from './provider/provider-factory.js';
import type { Adapter } from './adapter/adapter.js';
import type { EM1Status } from './schema/rest-configuration.js';
import type { EnergyInformation } from './schema/mqtt-configuration.js';

/**
 * Registry of device provider factories keyed by device identifier.
 * Each factory produces an `EM1Status` provider for a specific device.
 */
export const devicesProviderRegistry = new Registry<
  ProviderFactory<unknown, EM1Status>
>();

/**
 * Registry of device adapters keyed by device identifier.
 * Each adapter transforms raw device messages into `EnergyInformation`.
 */
export const devicesAdapterRegistry = new Registry<
  Adapter<unknown, EnergyInformation | undefined>
>();

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
  const devicePaths = globSync('device/**/index.js', { cwd: __dirname });
  logger.info(`Found ${devicePaths.length} device modules.`);
  for (const path of devicePaths) {
    logger.info(`Importing module: ${path}`);
    await import(`./${path}`);
    logger.info(`Imported module: ${path}`);
  }
}
