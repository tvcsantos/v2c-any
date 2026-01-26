import {
  energyInformationAdapterFactoryRegistry,
  em1StatusProviderFactoryRegistry,
  rpcMqttRequestProviderFactoryRegistry,
} from '../../application-context.js';
import { logger } from '../../utils/logger.js';
import { energyInformationEM1StatusAdapterFactory } from './em1-status-adapter.js';
import { em1StatusHttpProviderFactory } from './em1-status-http-provider.js';
import { energyInformationEM1NotifyStatusAdapterFactory } from './em1-notify-status-adapter.js';
import { em1GetStatusRpcRequestProviderFactory } from './em1-get-status-rpc-request-provider.js';
import { em1GetStatusRpcResponseAdapterFactory } from './em1-get-status-rpc-response-adapter.js';

const DEVICE_NAME = 'shelly-pro-em';

em1StatusProviderFactoryRegistry.register(
  DEVICE_NAME,
  em1StatusHttpProviderFactory
);

rpcMqttRequestProviderFactoryRegistry.register(
  `${DEVICE_NAME}-rpc`,
  em1GetStatusRpcRequestProviderFactory
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
