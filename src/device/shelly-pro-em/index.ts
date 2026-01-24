import {
  devicesAdapterRegistry,
  devicesProviderRegistry,
} from '../../application-context.js';
import { logger } from '../../utils/logger.js';
import { energyInformationEM1StatusAdapter } from './energy-information-em1-status-adapter.js';
import { em1StatusProviderFactory } from './em1-status-provider.js';
import { energyInformationEM1NotifyStatusAdapter } from './energy-information-em1-notify-status-adapter.js';

const DEVICE_NAME = 'shelly-pro-em';

devicesProviderRegistry.register(DEVICE_NAME, em1StatusProviderFactory);
devicesAdapterRegistry.register(DEVICE_NAME, energyInformationEM1StatusAdapter);
devicesAdapterRegistry.register(
  `${DEVICE_NAME}-notification`,
  energyInformationEM1NotifyStatusAdapter
);

logger.info('Shelly Pro EM registered');
