import { AdapterProviderFactory } from '../provider/adapter-provider.js';
import { FixedValueProviderFactory } from '../provider/fixed-value-provider.js';
import type { ProviderFactory } from '../provider/provider-factory.js';
import type { Registry } from '../registry/registry.js';
import type {
  EnergyInformation,
  MqttPullFeed,
} from '../schema/mqtt-configuration.js';
import type { Factory } from '../provider/factory.js';
import { PullPushService } from '../service/pull-push-service.js';
import type { ExecutableService } from '../service/executable-service.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { noOpExecutableService } from '../service/no-op-executable-service.js';
import { AdapterFactory } from '../adapter/adapter-factory.js';

/**
 * Configuration properties for creating an MQTT pull-mode executable service.
 */
export type MqttPullExecutableServiceFactoryProperties = {
  /** The type of energy data (solar or grid) */
  energyType: string;
  /** MQTT pull feed configuration specifying the data source */
  configuration: MqttPullFeed;
  /** Callback to invoke with fetched energy information */
  callbackProperties: CallbackProperties<EnergyInformation | undefined>;
};

type MqttPullProviderFactory = {
  providerFactory: ProviderFactory<unknown, EnergyInformation | undefined>;
  interval: number;
};

/**
 * Factory for creating MQTT pull-mode (polling) executable services.
 * Supports multiple data source strategies: device adapters, mock values, or disabled sources.
 * Periodically polls energy data and invokes a callback with the results.
 */
export class MqttPullExecutableServiceFactory implements Factory<
  MqttPullExecutableServiceFactoryProperties,
  ExecutableService
> {
  /**
   * Creates a new MQTT pull executable service factory.
   * @param providerFactoryRegistry - Registry of device providers for adapter-based sources
   * @param adapterFactoryRegistry - Registry of device adapters for transforming provider output
   */
  constructor(
    private readonly providerFactoryRegistry: Registry<
      ProviderFactory<unknown, unknown>
    >,
    private readonly adapterFactoryRegistry: Registry<
      AdapterFactory<unknown, unknown, EnergyInformation | undefined>
    >
  ) {}

  /**
   * Creates the appropriate provider factory based on the feed configuration type.
   * Combines provider and adapter for adapter-based sources, or returns mock/off providers.
   *
   * @param options - Configuration options specifying the feed type and device
   * @returns A provider factory matching the requested feed type
   * @throws {Error} If an adapter feed is requested but the device provider or adapter is not registered
   */
  private createProviderFactory(
    options: MqttPullExecutableServiceFactoryProperties
  ): MqttPullProviderFactory | null {
    switch (options.configuration.type) {
      case 'adapter': {
        const device = options.configuration.properties.device;
        const providerFactory = this.providerFactoryRegistry.get(device);
        if (!providerFactory) {
          throw new Error(`No provider registered for device: ${device}`);
        }
        const adapterFactory = this.adapterFactoryRegistry.get(device);
        if (!adapterFactory) {
          throw new Error(`No adapter registered for device: ${device}`);
        }
        const adapter = adapterFactory.create({
          energyType: options.energyType,
        });
        return {
          providerFactory: new AdapterProviderFactory(providerFactory, adapter),
          interval: options.configuration.properties.interval,
        };
      }
      case 'mock':
        return {
          providerFactory: new FixedValueProviderFactory({
            value: options.configuration.properties.value,
          }),
          interval: options.configuration.properties.interval,
        };
      case 'off':
        return null;
    }
  }

  /**
   * Creates an executable service that periodically polls energy data.
   * @param options - Configuration options including device, interval, and callback
   * @returns A PullPushService configured to poll at the specified interval
   */
  create(
    options: MqttPullExecutableServiceFactoryProperties
  ): ExecutableService {
    const energyProviderFactory = this.createProviderFactory(options);

    if (!energyProviderFactory) {
      return noOpExecutableService;
    }

    const { providerFactory, interval } = energyProviderFactory;
    const energyProvider = providerFactory.create({
      energyType: options.energyType,
      ...options.configuration,
    });

    const service = new PullPushService(
      energyProvider,
      interval,
      options.callbackProperties
    );
    return service;
  }
}
