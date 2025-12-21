import { logger } from '../utils/logger.js';
import { createMqttClient } from '../utils/mqtt.js';
/**
 * Service that bridges MQTT messages to a typed callback via an adapter.
 * Subscribes to a topic, parses incoming messages, adapts them, and forwards
 * the adapted payload to the provided callback.
 *
 * @template InputMessage - The raw message type received from MQTT
 * @template Payload - The adapted payload type passed to the callback
 */
export class MqttBridgeService {
    /**
     * Creates a new MQTT bridge service.
     * @param properties - MQTT connection and subscription details
     * @param callbackProperties - Callback container invoked with adapted payload
     * @param adapter - Adapter that transforms raw MQTT messages to the payload type
     */
    constructor(properties, callbackProperties, adapter) {
        this.properties = properties;
        this.callbackProperties = callbackProperties;
        this.adapter = adapter;
        this.client = null;
    }
    /**
     * Starts the bridge: connects to the broker, subscribes, and wires message handling.
     * @returns A promise that resolves when the subscription is active
     */
    async start() {
        this.client = await createMqttClient(this.properties.url);
        this.client.on('message', (topic, message) => {
            if (topic === this.properties.topic) {
                const data = JSON.parse(message.toString());
                this.adapter
                    .adapt(data)
                    .then(async (adaptedData) => {
                    await this.callbackProperties.callback(adaptedData);
                })
                    .catch((error) => {
                    logger.error(`Adapter error: ${error.message}`);
                });
            }
        });
        await this.client.subscribeAsync(this.properties.topic);
    }
    /**
     * Stops the bridge: disconnects the MQTT client and clears resources.
     * @returns A promise that resolves when the client has disconnected
     */
    async stop() {
        if (this.client) {
            await this.client.endAsync();
            this.client = null;
        }
    }
}
