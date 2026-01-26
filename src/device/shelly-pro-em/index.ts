import {
  energyInformationAdapterFactoryRegistry,
  em1StatusProviderFactoryRegistry,
  rcpMqttRequestProviderFactoryRegistry,
} from '../../application-context.js';
import { logger } from '../../utils/logger.js';
import { energyInformationEM1StatusAdapterFactory } from './energy-information-em1-status-adapter.js';
import { em1StatusHttpProviderFactory } from './em1-status-http-provider.js';
import {
  em1GetStatusRequestProviderFactory,
  em1GetStatusRpcResponseAdapterFactory,
  energyInformationEM1NotifyStatusAdapterFactory,
} from './energy-information-em1-notify-status-adapter.js';

const DEVICE_NAME = 'shelly-pro-em';

em1StatusProviderFactoryRegistry.register(
  DEVICE_NAME,
  em1StatusHttpProviderFactory
);

rcpMqttRequestProviderFactoryRegistry.register(
  `${DEVICE_NAME}-rpc`,
  em1GetStatusRequestProviderFactory
);

energyInformationAdapterFactoryRegistry.register(
  DEVICE_NAME,
  energyInformationEM1StatusAdapterFactory
);
energyInformationAdapterFactoryRegistry.register(
  `${DEVICE_NAME}-notification`,
  energyInformationEM1NotifyStatusAdapterFactory
);
energyInformationAdapterFactoryRegistry.register(
  `${DEVICE_NAME}-rpc`,
  em1GetStatusRpcResponseAdapterFactory
);

logger.info('Shelly Pro EM registered');
