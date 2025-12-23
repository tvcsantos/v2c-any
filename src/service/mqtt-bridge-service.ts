import { logger } from '../utils/logger.js';
import type { ExecutableService } from './executable-service.js';
import type { Adapter } from '../adapter/adapter.js';
import { createMqttClient } from '../utils/mqtt.js';
import type { MqttClient } from 'mqtt';
import type { CallbackProperties } from '../utils/callback-properties.js';

/**
 * Properties for configuring an MQTT bridge service.
 * Includes broker URL and topic to subscribe to.
 */
export type MqttBridgeServiceProperties = {
  url: string;
  topic: string;
};

/**
 * Service that bridges MQTT messages to a typed callback via an adapter.
 * Subscribes to a topic, parses incoming messages, adapts them, and forwards
 * the adapted payload to the provided callback.
 *
 * @template InputMessage - The raw message type received from MQTT
 * @template Payload - The adapted payload type passed to the callback
 */
export class MqttBridgeService<
  InputMessage,
  Payload,
> implements ExecutableService {
  private client: MqttClient | null = null;

  /**
   * Creates a new MQTT bridge service.
   * @param properties - MQTT connection and subscription details
   * @param callbackProperties - Callback container invoked with adapted payload
   * @param adapter - Adapter that transforms raw MQTT messages to the payload type
   */
  constructor(
    private readonly properties: MqttBridgeServiceProperties,
    private readonly callbackProperties: CallbackProperties<Payload>,
    private readonly adapter: Adapter<InputMessage, Payload>
  ) {}

  /**
   * Starts the bridge: connects to the broker, subscribes, and wires message handling.
   * @returns A promise that resolves when the subscription is active
   */
  async start() {
    logger.info('Starting MQTT bridge service');
    this.client = await createMqttClient(this.properties.url);
    this.client.on('message', (topic: string, message: Buffer) => {
      if (topic === this.properties.topic) {
        const data: InputMessage = JSON.parse(
          message.toString()
        ) as InputMessage;
        this.adapter
          .adapt(data)
          .then(async (adaptedData) => {
            await this.callbackProperties.callback(adaptedData);
          })
          .catch((error) => {
            logger.error(error, `Error occurred while processing message`);
          });
      }
    });
    logger.info({ topic: this.properties.topic }, 'Subscribing to MQTT topic');
    await this.client.subscribeAsync(this.properties.topic);
    logger.info('MQTT bridge service started');
  }

  /**
   * Stops the bridge: disconnects the MQTT client and clears resources.
   * @returns A promise that resolves when the client has disconnected
   */
  async stop() {
    logger.info('Stopping MQTT bridge service');
    if (this.client) {
      await this.client.endAsync();
      this.client = null;
    }
    logger.info('MQTT bridge service stopped');
  }
}
