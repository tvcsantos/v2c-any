import type { Registry } from '../registry/registry.js';
import type { ProviderFactory } from '../provider/provider-factory.js';
import { FixedValueProviderFactory } from '../provider/fixed-value-provider.js';
import type { EM1Status, RestFeed } from '../schema/rest-configuration.js';
import type { Factory } from '../provider/factory.js';
import type { EnergyType } from '../schema/configuration.js';
import type { Provider } from '../provider/provider.js';

/**
 * Configuration properties for creating an EM1Status provider.
 */
export type EM1StatusProviderFactoryProperties = {
  /** The type of energy data to retrieve */
  energyType: EnergyType;
  /** The device identifier */
  device: string;
  /** REST feed configuration specifying the data source strategy */
  configuration: RestFeed;
};

/**
 * Factory for creating EM1Status providers with flexible data source strategies.
 * Supports multiple feed types: adapter-based providers, mock values, or disabled providers.
 */
export class EM1StatusProviderFactory implements Factory<
  EM1StatusProviderFactoryProperties,
  Provider<EM1Status | undefined>
> {
  /**
   * Creates a new EM1Status provider factory.
   * @param devicesProvider - Registry containing provider factories for different devices
   */
  constructor(
    private readonly devicesProvider: Registry<
      ProviderFactory<unknown, EM1Status>
    >
  ) {}

  /**
   * Creates the appropriate provider factory based on the feed configuration type.
   * @param options - Configuration options specifying the feed type and properties
   * @returns A provider factory matching the requested feed type
   * @throws {Error} If an adapter feed is requested but the device is not registered
   */
  private createProviderFactory(
    options: EM1StatusProviderFactoryProperties
  ): ProviderFactory<unknown, EM1Status | undefined> {
    switch (options.configuration.feed.type) {
      case 'adapter': {
        const provider = this.devicesProvider.get(options.device);
        if (!provider) {
          throw new Error(
            `No provider registered for device: ${options.device}`
          );
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
  create(
    options: EM1StatusProviderFactoryProperties
  ): Provider<EM1Status | undefined> {
    return this.createProviderFactory(options).create({
      energyType: options.energyType,
      ...options.configuration,
    });
  }
}
