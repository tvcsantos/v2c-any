#!/usr/bin/env node
import { devicesAdapterRegistry, devicesProviderRegistry, loadDeviceModules, } from './application-context.js';
import { ConfigurationLoader } from './configuration/configuration-loader.js';
import { ConfigurationValidator } from './configuration/configuration-validator.js';
import { logger } from './utils/logger.js';
import { MqttFeedExecutableServiceFactory } from './factory/mqtt-feed-executable-service-factory.js';
import { EM1StatusProviderFactory } from './factory/em1-status-provider-factory.js';
import { MqttPullExecutableServiceFactory } from './factory/mqtt-pull-executable-service-factory.js';
import { MqttPushExecutableServiceFactory } from './factory/mqtt-push-executable-service-factory.js';
import { RestServiceFactory } from './factory/rest-service-factory.js';
import { MqttServiceFactory } from './factory/mqtt-service-factory.js';
async function main() {
    let service = null;
    await loadDeviceModules();
    const configurationValidator = new ConfigurationValidator();
    const configurationLoader = new ConfigurationLoader(configurationValidator);
    const configuration = await configurationLoader.load();
    switch (configuration.provider) {
        case 'rest': {
            const emulatorFactory = new RestServiceFactory(new EM1StatusProviderFactory(devicesProviderRegistry));
            service = emulatorFactory.create(configuration);
            break;
        }
        case 'mqtt': {
            const mqttFeedExecutableServiceFactory = new MqttFeedExecutableServiceFactory(new MqttPullExecutableServiceFactory(devicesProviderRegistry, devicesAdapterRegistry), new MqttPushExecutableServiceFactory(devicesAdapterRegistry));
            const mqttFactory = new MqttServiceFactory(mqttFeedExecutableServiceFactory);
            service = mqttFactory.create(configuration);
            break;
        }
    }
    const shutdown = async () => {
        try {
            logger.info('Shutting down...');
            if (service)
                await service.stop();
            logger.info('Shutdown complete');
        }
        catch (err) {
            logger.error(err, 'Error during shutdown');
        }
        finally {
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
