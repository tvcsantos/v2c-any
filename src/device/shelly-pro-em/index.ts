import {
  devicesAdapterFactoryRegistry,
  devicesProviderFactoryRegistry,
} from '../../application-context.js';
import { logger } from '../../utils/logger.js';
import { energyInformationEM1StatusAdapterFactory } from './energy-information-em1-status-adapter.js';
import { em1StatusProviderFactory } from './em1-status-provider.js';
import { energyInformationEM1NotifyStatusAdapterFactory } from './energy-information-em1-notify-status-adapter.js';

const DEVICE_NAME = 'shelly-pro-em';

devicesProviderFactoryRegistry.register(DEVICE_NAME, em1StatusProviderFactory);
devicesAdapterFactoryRegistry.register(
  DEVICE_NAME,
  energyInformationEM1StatusAdapterFactory
);
devicesAdapterFactoryRegistry.register(
  `${DEVICE_NAME}-notification`,
  energyInformationEM1NotifyStatusAdapterFactory
);

logger.info('Shelly Pro EM registered');
