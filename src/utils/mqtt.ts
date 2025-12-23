import mqtt, { type MqttClient } from 'mqtt';
import { logger } from './logger.js';

/**
 * Creates and configures an MQTT client with helpful logging.
 * Subscribes to lifecycle events (connect, error, reconnect) for visibility.
 *
 * @param url - MQTT broker URL (e.g., mqtt://localhost:1883)
 * @returns A promise that resolves to a connected MqttClient instance
 * @throws {Error} If the underlying connection fails
 */
export async function createMqttClient(url: string): Promise<MqttClient> {
  const client = await mqtt.connectAsync(url);
  client.on('reconnect', () => logger.info('Reconnecting...'));
  return client;
}
