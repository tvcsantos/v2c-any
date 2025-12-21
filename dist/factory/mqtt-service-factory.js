import { MqttService } from '../service/mqtt-service.js';
/**
 * Factory for creating an MQTT service that manages energy publishing.
 * Composes MQTT client setup with grid and solar feed publishers,
 * exposing a unified executable service with start/stop lifecycle.
 */
export class MqttServiceFactory {
    /**
     * Creates a new MQTT service factory.
     * @param mqttFeedExecutableServiceFactory - Factory to build feed publishers (pull/push) for energy data
     */
    constructor(mqttFeedExecutableServiceFactory) {
        this.mqttFeedExecutableServiceFactory = mqttFeedExecutableServiceFactory;
    }
    /**
     * Creates an executable MQTT service wired to publish grid and solar power.
     * Initializes the MQTT client and constructs feed publishers based on configuration.
     *
     * @param configuration - MQTT provider configuration including broker URL, device, and meter feeds
     * @returns An ExecutableService with coordinated start/stop for MQTT client and feed publishers
     */
    create(configuration) {
        const mqttService = new MqttService({ url: configuration.properties.url });
        const callbacks = {
            grid: {
                callback: async (power) => {
                    await mqttService.pushGridPower(power);
                },
            },
            sun: {
                callback: async (power) => {
                    await mqttService.pushSunPower(power);
                },
            },
        };
        const gridEnergyPublisher = this.mqttFeedExecutableServiceFactory.create({
            configuration: configuration.properties.meters.grid,
            device: configuration.properties.device,
            energyType: 'grid',
            callbacks,
        });
        const sunEnergyPublisher = this.mqttFeedExecutableServiceFactory.create({
            configuration: configuration.properties.meters.solar,
            device: configuration.properties.device,
            energyType: 'solar',
            callbacks,
        });
        return {
            async start() {
                await mqttService.start();
                await gridEnergyPublisher.start();
                await sunEnergyPublisher.start();
            },
            async stop() {
                await sunEnergyPublisher.stop();
                await gridEnergyPublisher.stop();
                await mqttService.stop();
            },
        };
    }
}
