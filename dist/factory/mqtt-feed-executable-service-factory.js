/**
 * Converts numeric callback properties to accept EnergyInformation objects.
 * Extracts the power value from EnergyInformation and passes it to the underlying callback.
 *
 * @param callbackProperties - The callback properties expecting numeric power values
 * @returns Converted callback properties that accept EnergyInformation
 */
function convertCallbackProperties(callbackProperties) {
    return {
        callback: async (data) => {
            if (data?.power !== undefined) {
                await callbackProperties.callback(data.power);
            }
        },
    };
}
/**
 * Factory for creating MQTT feed executable services with flexible communication modes.
 * Supports both pull (periodic polling) and push (event-driven) MQTT feed strategies.
 * Automatically routes to the appropriate service factory based on configuration.
 */
export class MqttFeedExecutableServiceFactory {
    /**
     * Creates a new MQTT feed executable service factory.
     * @param pullExecutableServiceFactory - Factory for pull-mode services
     * @param pushExecutableServiceFactory - Factory for push-mode services
     */
    constructor(pullExecutableServiceFactory, pushExecutableServiceFactory) {
        this.pullExecutableServiceFactory = pullExecutableServiceFactory;
        this.pushExecutableServiceFactory = pushExecutableServiceFactory;
    }
    /**
     * Creates an executable service using the appropriate mode-specific factory.
     * Routes to pull or push factory based on the configuration mode.
     *
     * @param options - Configuration options including energy type, device, mode, and callbacks
     * @returns An ExecutableService configured for the specified MQTT feed mode
     */
    create(options) {
        let callbackProperties;
        switch (options.energyType) {
            case 'solar': {
                callbackProperties = convertCallbackProperties(options.callbacks.sun);
                break;
            }
            case 'grid': {
                callbackProperties = convertCallbackProperties(options.callbacks.grid);
                break;
            }
        }
        switch (options.configuration.mode) {
            case 'pull':
                return this.pullExecutableServiceFactory.create({
                    energyType: options.energyType,
                    device: options.device,
                    configuration: options.configuration.feed,
                    callbackProperties,
                });
            case 'push':
                return this.pushExecutableServiceFactory.create({
                    energyType: options.energyType,
                    device: options.device,
                    configuration: options.configuration.feed,
                    callbackProperties,
                });
        }
    }
}
