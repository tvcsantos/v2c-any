#!/usr/bin/env node

import {
  energyInformationAdapterFactoryRegistry as energyInformationAdapterFactoryRegistry,
  em1StatusProviderFactoryRegistry as em1StatusProviderFactoryRegistry,
  loadDeviceModules,
  rpcMqttRequestProviderFactoryRegistry,
} from './application-context.js';
import { ConfigurationLoader } from './configuration/configuration-loader.js';
import { ConfigurationValidator } from './configuration/configuration-validator.js';
import { logger } from './utils/logger.js';
import { MqttFeedExecutableServiceFactory } from './factory/mqtt-feed-executable-service-factory.js';
import { EM1StatusProviderFactory } from './factory/em1-status-provider-factory.js';
import { MqttPullExecutableServiceFactory } from './factory/mqtt-pull-executable-service-factory.js';
import { MqttPushExecutableServiceFactory } from './factory/mqtt-push-executable-service-factory.js';
import { RestServiceFactory } from './factory/rest-service-factory.js';
import { MqttServiceFactory } from './factory/mqtt-service-factory.js';
import { ExecutableServiceFactory } from './factory/executable-service-factory.js';
import { VERSION } from './utils/version.js';

async function main() {
  logger.info({ version: VERSION }, 'Starting application');

  await loadDeviceModules();

  const configurationValidator = new ConfigurationValidator();
  const configurationLoader = new ConfigurationLoader(configurationValidator);
  const configuration = await configurationLoader.load();

  let executableServiceFactory: ExecutableServiceFactory<unknown>;

  switch (configuration.provider) {
    case 'rest': {
      executableServiceFactory = new RestServiceFactory(
        new EM1StatusProviderFactory(em1StatusProviderFactoryRegistry)
      );
      break;
    }
    case 'mqtt': {
      const mqttFeedExecutableServiceFactory =
        new MqttFeedExecutableServiceFactory(
          new MqttPullExecutableServiceFactory(
            em1StatusProviderFactoryRegistry,
            energyInformationAdapterFactoryRegistry,
            rpcMqttRequestProviderFactoryRegistry
          ),
          new MqttPushExecutableServiceFactory(
            em1StatusProviderFactoryRegistry,
            energyInformationAdapterFactoryRegistry,
            rpcMqttRequestProviderFactoryRegistry
          )
        );
      executableServiceFactory = new MqttServiceFactory(
        mqttFeedExecutableServiceFactory
      );
      break;
    }
  }

  const service = executableServiceFactory.create(configuration);

  const shutdown = async () => {
    try {
      logger.info('Shutting down...');
      await service?.stop();
      logger.info('Shutdown complete');
    } catch (err) {
      logger.error(err, 'Error during shutdown');
    } finally {
      process.exit(0);
    }
  };

  process.once('SIGINT', () => {
    shutdown().catch((err) => logger.error(err, 'Error during shutdown'));
  });
  process.once('SIGTERM', () => {
    shutdown().catch((err) => logger.error(err, 'Error during shutdown'));
  });

  await service.start();

  logger.info('Application started successfully');
}

main().catch((err) => {
  logger.error(err, 'Fatal error occurred');
  process.exit(1);
});
