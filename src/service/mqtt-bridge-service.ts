import { logger } from '../utils/logger.js';
import type { Adapter } from '../adapter/adapter.js';
import { createMqttClient } from '../utils/mqtt.js';
import type { MqttClient } from 'mqtt';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { AbstractExecutableService } from './abstract-executable-service.js';
import { Notifyable } from './notifyable.js';
import { ExecutableService } from './executable-service.js';

/**
 * Properties for configuring an MQTT bridge service.
 * Includes broker URL and topic to subscribe to.
 */
export type MqttBridgeServiceProperties = {
  url: string;
  username?: string;
  password?: string;
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
> extends AbstractExecutableService {
  private client: MqttClient | null = null;

  /**
   * Creates a new MQTT bridge service.
   * @param properties - MQTT connection and subscription details
   * @param callbackProperties - Callback container invoked with adapted payload
   * @param adapter - Adapter that transforms raw MQTT messages to the payload type
   * @param keepAliveService - Notifyable service that is notified on each message and maintains keep-alive requests
   */
  constructor(
    private readonly properties: MqttBridgeServiceProperties,
    private readonly callbackProperties: CallbackProperties<Payload>,
    private readonly adapter: Adapter<InputMessage, Payload>,
    private readonly keepAliveService: Notifyable & ExecutableService
  ) {
    super();
  }

  /**
   * Starts the bridge: connects to the broker, subscribes, wires message handling, and starts keep-alive service.
   * Each received message triggers the keep-alive service notification.
   * @returns A promise that resolves when the subscription is active and keep-alive service is started
   */
  async doStart() {
    logger.info('Starting MQTT bridge service');
    this.client = await createMqttClient(this.properties.url, {
      username: this.properties.username,
      password: this.properties.password,
    });
    this.client.on('message', (topic: string, message: Buffer) => {
      if (topic === this.properties.topic) {
        this.keepAliveService.notify().catch((error) => {
          logger.error(error, 'Error notifying keep-alive service');
        });
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
    await this.client.subscribeAsync(this.properties.topic, { qos: 1 });
    logger.info('MQTT bridge service started');
    await this.keepAliveService.start();
  }

  /**
   * Stops the bridge: disconnects the MQTT client, clears resources, and stops keep-alive service.
   * @returns A promise that resolves when the client has disconnected and keep-alive service is stopped
   */
  async doStop() {
    logger.info('Stopping MQTT bridge service');
    await this.client?.endAsync();
    this.client = null;
    logger.info('MQTT bridge service stopped');
    await this.keepAliveService.stop();
  }
}
