import { Registry } from './registry/registry.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { globSync } from 'glob';
import { logger } from './utils/logger.js';
import type { ProviderFactory } from './provider/provider-factory.js';
import type { EM1Status } from './schema/rest-configuration.js';
import type { EnergyInformation } from './schema/mqtt-configuration.js';
import { AdapterFactory } from './adapter/adapter-factory.js';

/**
 * Registry of device provider factories keyed by device identifier.
 * Each factory produces an `EM1Status` provider for a specific device.
 */
export const devicesProviderFactoryRegistry = new Registry<
  ProviderFactory<unknown, EM1Status>
>();

/**
 * Registry of device adapters keyed by device identifier.
 * Each adapter transforms raw device messages into `EnergyInformation`.
 */
export const devicesAdapterFactoryRegistry = new Registry<
  AdapterFactory<unknown, unknown, EnergyInformation | undefined>
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
  // Support both .ts (dev/tsx) and .js (built) files
  const devicePaths = globSync('device/**/index.{ts,js}', { cwd: __dirname });
  logger.info({ count: devicePaths.length }, 'Found device modules.');
  for (const path of devicePaths) {
    await import(`./${path}`);
  }
}
