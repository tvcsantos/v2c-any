import type { Adapter } from '../adapter/adapter.js';
import type { Registry } from '../registry/registry.js';
import type {
  EnergyInformation,
  MqttPushFeed,
} from '../schema/mqtt-configuration.js';
import type { Factory } from '../provider/factory.js';
import type { ExecutableService } from '../service/executable-service.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { noOpExecutableService } from '../service/no-op-executable-service.js';
import { MqttBridgeService } from '../service/mqtt-bridge-service.js';

/**
 * Configuration properties for creating an MQTT push-mode executable service.
 */
export type MqttPushExecutableServiceFactoryProperties = {
  /** The type of energy data (solar or grid) */
  energyType: string;
  /** The device identifier */
  device: string;
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
   * @param devicesAdapter - Registry of device adapters to transform incoming messages
   */
  constructor(
    private readonly devicesAdapter: Registry<
      Adapter<unknown, EnergyInformation | undefined>
    >
  ) {}

  /**
   * Creates an executable service using the appropriate push strategy.
   * Returns a bridge service when configured, or a no-op service if disabled.
   * @param options - Configuration including device, energy type, push config, and callback
   * @returns An `ExecutableService` configured for the specified MQTT push mode
   * @throws {Error} If `bridge` is selected but no adapter is registered for the device
   */
  create(
    options: MqttPushExecutableServiceFactoryProperties
  ): ExecutableService {
    switch (options.configuration.type) {
      case 'bridge': {
        const adapter = this.devicesAdapter.get(options.device);
        if (!adapter) {
          throw new Error(
            `No adapter registered for device: ${options.device}`
          );
        }
        return new MqttBridgeService(
          options.configuration.properties,
          options.callbackProperties,
          adapter
        );
      }
      case 'off':
        return noOpExecutableService;
    }
  }
}
