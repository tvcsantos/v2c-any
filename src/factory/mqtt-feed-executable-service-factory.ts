import type { MqttPullExecutableServiceFactory } from './mqtt-pull-executable-service-factory.js';
import type { MqttPushExecutableServiceFactory } from './mqtt-push-executable-service-factory.js';
import type {
  EnergyInformation,
  MqttFeedMode,
} from '../schema/mqtt-configuration.js';
import type { EnergyType } from '../schema/configuration.js';
import type { ExecutableService } from '../service/executable-service.js';
import type { ExecutableServiceFactory } from './executable-service-factory.js';
import type { MqttCallbacks } from '../utils/mqtt-callbacks.js';
import type { CallbackProperties } from '../utils/callback-properties.js';

/**
 * Converts numeric callback properties to accept EnergyInformation objects.
 * Extracts the power value from EnergyInformation and passes it to the underlying callback.
 *
 * @param callbackProperties - The callback properties expecting numeric power values
 * @returns Converted callback properties that accept EnergyInformation
 */
function convertCallbackProperties(
  callbackProperties: CallbackProperties<number>
): CallbackProperties<EnergyInformation | undefined> {
  return {
    callback: async (data: EnergyInformation | undefined) => {
      if (data?.power !== undefined) {
        await callbackProperties.callback(data.power);
      }
    },
  };
}

/**
 * Configuration properties for creating an MQTT feed executable service.
 */
export type MqttFeedExecutableServiceFactoryProperties = {
  /** The type of energy data (solar or grid) */
  energyType: EnergyType;
  /** The device identifier */
  device: string;
  /** MQTT feed mode configuration specifying pull or push behavior */
  configuration: MqttFeedMode;
  /** Callbacks for push operations based on energy type */
  callbacks: MqttCallbacks<number>;
};

/**
 * Factory for creating MQTT feed executable services with flexible communication modes.
 * Supports both pull (periodic polling) and push (event-driven) MQTT feed strategies.
 * Automatically routes to the appropriate service factory based on configuration.
 */
export class MqttFeedExecutableServiceFactory implements ExecutableServiceFactory<MqttFeedExecutableServiceFactoryProperties> {
  /**
   * Creates a new MQTT feed executable service factory.
   * @param pullExecutableServiceFactory - Factory for pull-mode services
   * @param pushExecutableServiceFactory - Factory for push-mode services
   */
  constructor(
    private readonly pullExecutableServiceFactory: MqttPullExecutableServiceFactory,
    private readonly pushExecutableServiceFactory: MqttPushExecutableServiceFactory
  ) {}

  /**
   * Creates an executable service using the appropriate mode-specific factory.
   * Routes to pull or push factory based on the configuration mode.
   *
   * @param options - Configuration options including energy type, device, mode, and callbacks
   * @returns An ExecutableService configured for the specified MQTT feed mode
   */
  create(
    options: MqttFeedExecutableServiceFactoryProperties
  ): ExecutableService {
    let callbackProperties: CallbackProperties<EnergyInformation | undefined>;
    switch (options.energyType) {
      case 'solar': {
        callbackProperties = convertCallbackProperties(options.callbacks.sun);
        break;
      }
      case 'grid': {
        callbackProperties = convertCallbackProperties(options.callbacks.grid);
        break;
      }
    }
    switch (options.configuration.mode) {
      case 'pull':
        return this.pullExecutableServiceFactory.create({
          energyType: options.energyType,
          device: options.device,
          interval: options.configuration.interval,
          configuration: options.configuration.feed,
          callbackProperties,
        });
      case 'push':
        return this.pushExecutableServiceFactory.create({
          energyType: options.energyType,
          device: options.device,
          configuration: options.configuration.feed,
          callbackProperties,
        });
    }
  }
}
