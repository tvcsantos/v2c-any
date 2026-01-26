import type { Provider } from '../provider/provider.js';
import { logger } from '../utils/logger.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { AbstractExecutableService } from './abstract-executable-service.js';
import type { MqttClient } from 'mqtt';
import { createMqttClient } from '../utils/mqtt.js';
import { Adapter } from '../adapter/adapter.js';
import { Triggerable } from './triggerable.js';
import { RpcRequestFrame } from '../utils/rpc.js';

/**
 * Properties for configuring an RPC MQTT push service.
 */
export type RpcMqttPushServiceProperties = {
  interval: number;
  url: string;
  topic: string;
  username?: string;
  password?: string;
};

/**
 * Provider interface for RPC MQTT requests.
 * Extends the Provider interface to include the MQTT topic where responses will be received.
 *
 * @template RequestMessage - The type of RPC request message generated
 */
export interface RpcMqttRequestProvider<
  RequestMessage extends RpcRequestFrame<unknown>,
> extends Provider<RequestMessage> {
  readonly topic: string;
}

/**
 * Triggerable service that sends RPC requests over MQTT and processes responses.
 * Connects to an MQTT broker, subscribes to a response topic, and publishes RPC requests when triggered.
 * Responses are adapted and forwarded to a callback.
 *
 * @template RequestMessage - The type of RPC request message sent
 * @template InputMessage - The type of raw response message received from MQTT
 * @template Payload - The adapted payload type passed to the callback
 */
export class RpcMqttPushTriggerableService<
  RequestMessage extends RpcRequestFrame<unknown>,
  InputMessage,
  Payload,
>
  extends AbstractExecutableService
  implements Triggerable
{
  private client: MqttClient | null = null;

  /**
   * Creates a new RPC MQTT push triggerable service.
   * @param properties - MQTT connection details including broker URL and topic
   * @param provider - RPC request provider that generates request messages and specifies the response topic
   * @param callbackProperties - Callback container invoked with adapted response data
   * @param adapter - Adapter that transforms raw MQTT response messages to the payload type
   */
  constructor(
    private readonly properties: RpcMqttPushServiceProperties,
    private readonly provider: RpcMqttRequestProvider<RequestMessage>,
    private readonly callbackProperties: CallbackProperties<Payload>,
    private readonly adapter: Adapter<InputMessage, Payload>
  ) {
    super();
  }

  /**
   * Starts the service: connects to the MQTT broker and subscribes to the response topic.
   * Sets up message handling to adapt and forward responses to the callback.
   * @returns A promise that resolves when the connection and subscription are established
   */
  async doStart() {
    logger.info('Starting MQTT bridge service');
    this.client = await createMqttClient(this.properties.url, {
      username: this.properties.username,
      password: this.properties.password,
    });
    this.client.on('message', (topic: string, message: Buffer) => {
      if (topic === this.provider.topic) {
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
    logger.info({ topic: this.provider.topic }, 'Subscribing to MQTT topic');
    await this.client.subscribeAsync(this.provider.topic, { qos: 1 });
    logger.info('MQTT bridge service started');
    return Promise.resolve();
  }

  /**
   * Stops the service: disconnects the MQTT client and clears resources.
   * @returns A promise that resolves when the client has disconnected
   */
  async doStop() {
    logger.info('Stopping MQTT bridge service');
    await this.client?.endAsync();
    this.client = null;
    logger.info('MQTT bridge service stopped');
    return Promise.resolve();
  }

  /**
   * Triggers an RPC request by publishing a message to the configured topic.
   * Retrieves a request message from the provider and publishes it to MQTT with QoS 1 and retain flag.
   * @returns A promise that resolves when the request message has been generated and published
   */
  async trigger(): Promise<void> {
    const requestMessage = await this.provider.get();
    this.client?.publish(
      this.properties.topic,
      JSON.stringify(requestMessage),
      {
        qos: 1,
        retain: true,
      }
    );
  }
}
