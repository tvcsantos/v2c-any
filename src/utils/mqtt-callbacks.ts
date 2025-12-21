import { CallbackProperties } from './callback-properties.js';

/**
 * Collection of MQTT callback properties grouped by energy type.
 * Provides separate callback containers for grid and solar power updates.
 *
 * @template Payload - The type of data the callbacks will receive
 */
export type MqttCallbacks<Payload> = {
  /** Callback properties for grid power data */
  grid: CallbackProperties<Payload>;
  /** Callback properties for solar power data */
  sun: CallbackProperties<Payload>;
};
