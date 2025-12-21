import { AdapterProviderFactory } from '../provider/adapter-provider.js';
import { FixedValueProviderFactory } from '../provider/fixed-value-provider.js';
import { PullPushService } from '../service/pull-push-service.js';
/**
 * Factory for creating MQTT pull-mode (polling) executable services.
 * Supports multiple data source strategies: device adapters, mock values, or disabled sources.
 * Periodically polls energy data and invokes a callback with the results.
 */
export class MqttPullExecutableServiceFactory {
    /**
     * Creates a new MQTT pull executable service factory.
     * @param devicesProviderRegistry - Registry of device providers for adapter-based sources
     * @param devicesAdapterRegistry - Registry of device adapters for transforming provider output
     */
    constructor(devicesProviderRegistry, devicesAdapterRegistry) {
        this.devicesProviderRegistry = devicesProviderRegistry;
        this.devicesAdapterRegistry = devicesAdapterRegistry;
    }
    /**
     * Creates the appropriate provider factory based on the feed configuration type.
     * Combines provider and adapter for adapter-based sources, or returns mock/off providers.
     *
     * @param options - Configuration options specifying the feed type and device
     * @returns A provider factory matching the requested feed type
     * @throws {Error} If an adapter feed is requested but the device provider or adapter is not registered
     */
    createProviderFactory(options) {
        switch (options.configuration.type) {
            case 'adapter': {
                const provider = this.devicesProviderRegistry.get(options.device);
                if (!provider) {
                    throw new Error(`No provider registered for device: ${options.device}`);
                }
                const adapter = this.devicesAdapterRegistry.get(options.device);
                if (!adapter) {
                    throw new Error(`No adapter registered for device: ${options.device}`);
                }
                return new AdapterProviderFactory(provider, adapter);
            }
            case 'mock':
                return new FixedValueProviderFactory({
                    value: options.configuration.properties?.value,
                });
            case 'off':
                return new FixedValueProviderFactory({ value: undefined });
        }
    }
    /**
     * Creates an executable service that periodically polls energy data.
     * @param options - Configuration options including device, interval, and callback
     * @returns A PullPushService configured to poll at the specified interval
     */
    create(options) {
        const energyProviderFactory = this.createProviderFactory(options);
        const energyProvider = energyProviderFactory.create({
            energyType: options.energyType,
            ...options.configuration,
        });
        const service = new PullPushService(energyProvider, options.interval, options.callbackProperties);
        return service;
    }
}
