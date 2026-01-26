import { AdapterProviderFactory } from '../provider/adapter-provider.js';
import { FixedValueProviderFactory } from '../provider/fixed-value-provider.js';
import type {
  ProviderFactory,
  RcpMqttRequestProviderFactory,
} from '../provider/provider-factory.js';
import type { Registry } from '../registry/registry.js';
import type {
  EnergyInformation,
  MqttPullFeed,
  MqttPullHttpAdapterFeed,
  MqttPullMockFeed,
  MqttPullRpcMqttAdapterFeed,
} from '../schema/mqtt-configuration.js';
import type { Factory } from '../provider/factory.js';
import {
  PullPushService,
  PullPushTriggerableService,
} from '../service/pull-push-service.js';
import type { ExecutableService } from '../service/executable-service.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { noOpExecutableService } from '../service/no-op-executable-service.js';
import { AdapterFactory } from '../adapter/adapter-factory.js';
import { RpcMqttPushTriggerableService } from '../service/rpc-mqtt-push-service.js';

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
    >,
    private readonly rcpMqttRequestProviderFactoryRegistry: Registry<
      RcpMqttRequestProviderFactory<unknown, unknown>
    >
  ) {}

  private createHttpAdapterPullPushService(
    energyType: string,
    callbackProperties: CallbackProperties<EnergyInformation | undefined>,
    properties: MqttPullHttpAdapterFeed
  ) {
    const device = properties.device;

    const providerFactory = this.providerFactoryRegistry.get(device);
    if (!providerFactory) {
      throw new Error(`No provider registered for device: ${device}`);
    }

    const adapterFactory = this.adapterFactoryRegistry.get(device);
    if (!adapterFactory) {
      throw new Error(`No adapter registered for device: ${device}`);
    }
    const adapter = adapterFactory.create({
      energyType,
    });

    const adapterProviderFactory = new AdapterProviderFactory(
      providerFactory,
      adapter
    );

    const provider = adapterProviderFactory.create({
      energyType,
      properties,
    });

    const service = new PullPushService(
      properties.interval,
      new PullPushTriggerableService(provider, callbackProperties)
    );

    return service;
  }

  private createRpcMqttAdapterPullPushService(
    energyType: string,
    callbackProperties: CallbackProperties<EnergyInformation | undefined>,
    properties: MqttPullRpcMqttAdapterFeed
  ) {
    const device = properties.device;

    const requestProviderFactory =
      this.rcpMqttRequestProviderFactoryRegistry.get(device);
    if (!requestProviderFactory) {
      throw new Error(
        `No RPC MQTT request provider registered for device: ${device}`
      );
    }

    const adapterFactory = this.adapterFactoryRegistry.get(device);
    if (!adapterFactory) {
      throw new Error(`No adapter registered for device: ${device}`);
    }
    const adapter = adapterFactory.create({
      energyType,
    });

    const requestProvider = requestProviderFactory.create({
      energyType,
      properties,
    });

    const service = new PullPushService(
      properties.interval,
      new RpcMqttPushTriggerableService(
        properties,
        requestProvider,
        callbackProperties,
        adapter
      )
    );

    return service;
  }

  private createMockPullPushService(
    callbackProperties: CallbackProperties<EnergyInformation | undefined>,
    properties: MqttPullMockFeed
  ) {
    const providerFactory = new FixedValueProviderFactory<
      EnergyInformation | undefined
    >({
      value: properties.value,
    });

    const provider = providerFactory.create();

    const service = new PullPushService(
      properties.interval,
      new PullPushTriggerableService(provider, callbackProperties)
    );

    return service;
  }

  /**
   * Creates an executable service that periodically polls energy data.
   * @param options - Configuration options including device, interval, and callback
   * @returns A PullPushService configured to poll at the specified interval
   */
  create(
    options: MqttPullExecutableServiceFactoryProperties
  ): ExecutableService {
    switch (options.configuration.type) {
      case 'http-adapter':
        return this.createHttpAdapterPullPushService(
          options.energyType,
          options.callbackProperties,
          options.configuration.properties
        );
      case 'rpc-mqtt-adapter': {
        return this.createRpcMqttAdapterPullPushService(
          options.energyType,
          options.callbackProperties,
          options.configuration.properties
        );
      }
      case 'mock':
        return this.createMockPullPushService(
          options.callbackProperties,
          options.configuration.properties
        );
      case 'off':
        return noOpExecutableService;
    }
  }
}
