import { FixedValueProviderFactory } from '../provider/fixed-value-provider.js';
/**
 * Factory for creating EM1Status providers with flexible data source strategies.
 * Supports multiple feed types: adapter-based providers, mock values, or disabled providers.
 */
export class EM1StatusProviderFactory {
    /**
     * Creates a new EM1Status provider factory.
     * @param devicesProvider - Registry containing provider factories for different devices
     */
    constructor(devicesProvider) {
        this.devicesProvider = devicesProvider;
    }
    /**
     * Creates the appropriate provider factory based on the feed configuration type.
     * @param options - Configuration options specifying the feed type and properties
     * @returns A provider factory matching the requested feed type
     * @throws {Error} If an adapter feed is requested but the device is not registered
     */
    createProviderFactory(options) {
        switch (options.configuration.feed.type) {
            case 'adapter': {
                const provider = this.devicesProvider.get(options.device);
                if (!provider) {
                    throw new Error(`No provider registered for device: ${options.device}`);
                }
                return provider;
            }
            case 'mock':
                return new FixedValueProviderFactory({
                    value: options.configuration.feed.properties?.value,
                });
            case 'off':
                return new FixedValueProviderFactory({ value: undefined });
        }
    }
    /**
     * Creates an EM1Status provider with the specified configuration.
     * @param options - Configuration options including energy type, device, and feed type
     * @returns A provider that supplies EM1Status or undefined
     */
    create(options) {
        return this.createProviderFactory(options).create({
            energyType: options.energyType,
            ...options.configuration,
        });
    }
}
