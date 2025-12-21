import { devicesAdapterRegistry, devicesProviderRegistry, } from '../../application-context.js';
import { logger } from '../../utils/logger.js';
import { energyInformationEM1StatusAdapter } from './energy-information-em1-status-adapter.js';
import { em1StatusProviderFactory } from './em1-status-provider.js';
const DEVICE_NAME = 'shelly-pro-em';
devicesProviderRegistry.register(DEVICE_NAME, em1StatusProviderFactory);
devicesAdapterRegistry.register(DEVICE_NAME, energyInformationEM1StatusAdapter);
logger.info('Shelly Pro EM proxy components registered');
