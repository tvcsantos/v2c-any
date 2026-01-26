import type { Registry } from '../registry/registry.js';
import type {
  EnergyInformation,
  MqttPullHttpAdapterFeed,
  MqttPullRpcMqttAdapterFeed,
  MqttPushFeed,
} from '../schema/mqtt-configuration.js';
import type { Factory } from '../provider/factory.js';
import type { ExecutableService } from '../service/executable-service.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import {
  asNoOpExecutableService,
  NoOpExecutableService,
} from '../service/no-op-executable-service.js';
import { MqttBridgeService } from '../service/mqtt-bridge-service.js';
import { AdapterFactory } from '../adapter/adapter-factory.js';
import { KeepAliveService } from '../service/keep-alive-service.js';
import { NoOpNotifyable } from '../service/no-op-notifyable.js';
import { Notifyable } from '../service/notifyable.js';
import { PullPushTriggerableService } from '../service/pull-push-triggerable-service.js';
import { AdapterProviderFactory } from '../provider/adapter-provider.js';
import {
  ProviderFactory,
  RpcMqttRequestProviderFactory,
} from '../provider/provider-factory.js';
import { RpcMqttPushTriggerableService } from '../service/rpc-mqtt-push-service.js';

/**
 * Configuration properties for creating an MQTT push-mode executable service.
 */
export type MqttPushExecutableServiceFactoryProperties = {
  /** The type of energy data (solar or grid) */
  energyType: string;
  /** MQTT push feed configuration specifying the push strategy */
  configuration: MqttPushFeed;
  /** Callback invoked with energy information updates */
  callbackProperties: CallbackProperties<EnergyInformation | undefined>;
};

/**
 * Factory for creating MQTT push-mode (event-driven) executable services.
 * Supports MQTT bridge (subscribing to device topics) or disabled sources.
 * Returns a ready-to-run `ExecutableService` instance.
 */
export class MqttPushExecutableServiceFactory implements Factory<
  MqttPushExecutableServiceFactoryProperties,
  ExecutableService
> {
  /**
   * Creates a new MQTT push executable service factory.
   * @param providerFactoryRegistry - Registry of device providers for keep-alive HTTP sources
   * @param adapterFactoryRegistry - Registry of device adapters to transform incoming messages
   * @param rpcMqttRequestProviderFactoryRegistry - Registry of RPC MQTT request providers for keep-alive RPC sources
   */
  constructor(
    private readonly providerFactoryRegistry: Registry<
      ProviderFactory<unknown, unknown>
    >,
    private readonly adapterFactoryRegistry: Registry<
      AdapterFactory<unknown, unknown, EnergyInformation | undefined>
    >,
    private readonly rpcMqttRequestProviderFactoryRegistry: Registry<
      RpcMqttRequestProviderFactory<unknown, unknown>
    >
  ) {}

  /**
   * Creates a triggerable service using an HTTP adapter to fetch device data.
   * Used for keep-alive functionality in MQTT push mode.
   * @param energyType - The type of energy data to monitor
   * @param callbackProperties - Callback to invoke with energy information
   * @param properties - HTTP adapter feed configuration including device, host, and interval
   * @returns A configured PullPushTriggerableService for HTTP-based data fetching
   * @throws {Error} If no provider or adapter is registered for the specified device
   */
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

    return new PullPushTriggerableService(provider, callbackProperties);
  }

  /**
   * Creates a triggerable service using RPC over MQTT to fetch device data.
   * Used for keep-alive functionality in MQTT push mode.
   * @param energyType - The type of energy data to monitor
   * @param callbackProperties - Callback to invoke with energy information
   * @param properties - RPC MQTT adapter feed configuration including device and MQTT connection details
   * @returns A configured RpcMqttPushTriggerableService for RPC MQTT-based data fetching
   * @throws {Error} If no RPC MQTT request provider or adapter is registered for the specified device
   */
  private createRpcMqttAdapterPullPushService(
    energyType: string,
    callbackProperties: CallbackProperties<EnergyInformation | undefined>,
    properties: MqttPullRpcMqttAdapterFeed
  ) {
    const device = properties.device;

    const requestProviderFactory =
      this.rpcMqttRequestProviderFactoryRegistry.get(device);
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

    return new RpcMqttPushTriggerableService(
      properties,
      requestProvider,
      callbackProperties,
      adapter
    );
  }

  /**
   * Creates an executable service using the appropriate push strategy.
   * Returns a bridge service when configured (with optional keep-alive), or a no-op service if disabled.
   * @param options - Configuration including device, energy type, push config, callback, and keep-alive settings
   * @returns An `ExecutableService` configured for the specified MQTT push mode
   * @throws {Error} If `bridge` is selected but no adapter is registered for the device
   */
  create(
    options: MqttPushExecutableServiceFactoryProperties
  ): ExecutableService {
    switch (options.configuration.type) {
      case 'bridge': {
        const device = options.configuration.properties.device;
        const adapterFactory = this.adapterFactoryRegistry.get(device);
        if (!adapterFactory) {
          throw new Error(`No adapter registered for device: ${device}`);
        }

        const keepAlive = options.configuration.properties.keepAlive;

        let keepAliveService: Notifyable & ExecutableService;

        switch (keepAlive.type) {
          case 'off': {
            keepAliveService = asNoOpExecutableService(new NoOpNotifyable());
            break;
          }
          case 'http-adapter':
            keepAliveService = new KeepAliveService(
              this.createHttpAdapterPullPushService(
                options.energyType,
                options.callbackProperties,
                keepAlive.properties
              ),
              keepAlive.properties.interval
            );
            break;
          case 'rpc-mqtt-adapter':
            keepAliveService = new KeepAliveService(
              this.createRpcMqttAdapterPullPushService(
                options.energyType,
                options.callbackProperties,
                keepAlive.properties
              ),
              keepAlive.properties.interval
            );
            break;
        }

        return new MqttBridgeService(
          options.configuration.properties,
          options.callbackProperties,
          adapterFactory.create({ energyType: options.energyType }),
          keepAliveService
        );
      }
      case 'off':
        return new NoOpExecutableService();
    }
  }
}
