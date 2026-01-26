import type { Provider } from '../provider/provider.js';
import { logger } from '../utils/logger.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { AbstractExecutableService } from './abstract-executable-service.js';
import type { MqttClient } from 'mqtt';
import { createMqttClient } from '../utils/mqtt.js';
import { Adapter } from '../adapter/adapter.js';
import { Triggerable } from './pull-push-service.js';

export type RpcMqttPushServiceProperties = {
  interval: number;
  url: string;
  topic: string;
  username?: string;
  password?: string;
};

export interface RpcMqttRequestProvider<
  RequestMessage,
> extends Provider<RequestMessage> {
  readonly topic: string;
}

export class RpcMqttPushTriggerableService<
  RequestMessage,
  InputMessage,
  Payload,
>
  extends AbstractExecutableService
  implements Triggerable
{
  private client: MqttClient | null = null;

  constructor(
    private readonly properties: RpcMqttPushServiceProperties,
    private readonly provider: RpcMqttRequestProvider<RequestMessage>,
    private readonly callbackProperties: CallbackProperties<Payload>,
    private readonly adapter: Adapter<InputMessage, Payload>
  ) {
    super();
  }

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

  async doStop() {
    logger.info('Stopping MQTT bridge service');
    await this.client?.endAsync();
    this.client = null;
    logger.info('MQTT bridge service stopped');
    return Promise.resolve();
  }

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
