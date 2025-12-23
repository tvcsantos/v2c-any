import { logger } from '../utils/logger.js';
import { createMqttClient } from '../utils/mqtt.js';
import type { MqttClient } from 'mqtt';
import { AbstractExecutableService } from './abstract-executable-service.js';

/**
 * MQTT topic for publishing solar power readings.
 */
const SUN_POWER_TOPIC = 'trydan_v2c_sun_power';
/**
 * MQTT topic for publishing grid power readings.
 */
const GRID_POWER_TOPIC = 'trydan_v2c_grid_power';

/**
 * Configuration properties for `MqttService`.
 */
export type MqttServiceProperties = {
  url: string;
};

/**
 * Service that publishes energy readings to an MQTT broker.
 * Manages MQTT client lifecycle and exposes methods to push grid and solar power values.
 */
export class MqttService extends AbstractExecutableService {
  private client: MqttClient | null = null;

  /**
   * Creates a new MQTT service.
   * @param properties - MQTT connection properties including broker URL
   */
  constructor(private readonly properties: MqttServiceProperties) {
    super();
  }

  /**
   * Publishes a grid power reading to the MQTT broker.
   * @param power - Power value in Watts
   */
  async pushGridPower(power: number) {
    await this.pushReading(power, GRID_POWER_TOPIC);
  }

  /**
   * Publishes a solar power reading to the MQTT broker.
   * @param power - Power value in Watts
   */
  async pushSunPower(power: number) {
    await this.pushReading(power, SUN_POWER_TOPIC);
  }

  /**
   * Publishes a numeric reading to a specific MQTT topic.
   * @param value - Numeric value to publish
   * @param topic - MQTT topic to publish to
   */
  private async pushReading(value: number, topic: string) {
    if (!this.client) {
      logger.error('MQTT client not initialized');
      throw new Error('MQTT client not initialized');
    }
    logger.debug({ value, topic }, 'Publishing MQTT message');
    await this.client.publishAsync(topic, String(value));
  }
  /**
   * Starts the MQTT client connection.
   * @returns A promise that resolves when the client is connected
   * @throws {Error} If the client is already started
   */
  async doStart() {
    logger.info('Starting MQTT mode');
    this.client = await createMqttClient(this.properties.url);
    logger.info('MQTT client started');
  }

  /**
   * Stops the MQTT client connection.
   * @returns A promise that resolves when the client is disconnected
   * @throws {Error} If the client is not started
   */
  async doStop() {
    logger.info('Stopping MQTT mode');
    await this.client?.endAsync();
    this.client = null;
    logger.info('MQTT client disconnected');
  }
}
