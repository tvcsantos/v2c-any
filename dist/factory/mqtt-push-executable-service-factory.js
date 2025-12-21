import { noOpExecutableService } from '../service/no-op-executable-service.js';
import { MqttBridgeService } from '../service/mqtt-bridge-service.js';
/**
 * Factory for creating MQTT push-mode (event-driven) executable services.
 * Supports MQTT bridge (subscribing to device topics) or disabled sources.
 * Returns a ready-to-run `ExecutableService` instance.
 */
export class MqttPushExecutableServiceFactory {
    /**
     * Creates a new MQTT push executable service factory.
     * @param devicesAdapter - Registry of device adapters to transform incoming messages
     */
    constructor(devicesAdapter) {
        this.devicesAdapter = devicesAdapter;
    }
    /**
     * Creates an executable service using the appropriate push strategy.
     * Returns a bridge service when configured, or a no-op service if disabled.
     * @param options - Configuration including device, energy type, push config, and callback
     * @returns An `ExecutableService` configured for the specified MQTT push mode
     * @throws {Error} If `bridge` is selected but no adapter is registered for the device
     */
    create(options) {
        switch (options.configuration.type) {
            case 'bridge': {
                const adapter = this.devicesAdapter.get(options.device);
                if (!adapter) {
                    throw new Error(`No adapter registered for device: ${options.device}`);
                }
                return new MqttBridgeService(options.configuration.properties, options.callbackProperties, adapter);
            }
            case 'off':
                return noOpExecutableService;
        }
    }
}
