import { logger } from '../utils/logger.js';
import type { ExecutableService } from './executable-service.js';
import { createMqttClient } from '../utils/mqtt.js';
import type { MqttClient } from 'mqtt';

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
export class MqttService implements ExecutableService {
  private client: MqttClient | null = null;

  /**
   * Creates a new MQTT service.
   * @param properties - MQTT connection properties including broker URL
   */
  constructor(private readonly properties: MqttServiceProperties) {}

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
  async start() {
    logger.info('Starting MQTT mode');
    if (this.client) {
      logger.error('MQTT client already started');
      throw new Error('MQTT client already started');
    }
    this.client = await createMqttClient(this.properties.url);
    logger.info('MQTT client started');
  }

  /**
   * Stops the MQTT client connection.
   * @returns A promise that resolves when the client is disconnected
   * @throws {Error} If the client is not started
   */
  async stop() {
    logger.info('Stopping MQTT mode');
    const client = this.client;
    this.client = null;
    if (!client) {
      logger.error('MQTT client not started');
      throw new Error('MQTT client not started');
    }
    await client.endAsync();
    logger.info('MQTT client disconnected');
  }
}
