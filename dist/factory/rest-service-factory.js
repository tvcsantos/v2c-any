import { RestService } from '../service/rest-service.js';
/**
 * Factory for creating REST services that expose energy data.
 * Composes grid and solar energy providers based on configuration and
 * returns an executable REST service instance.
 */
export class RestServiceFactory {
    /**
     * Creates a new REST service factory.
     * @param em1StatusProviderFactory - Factory used to build device-specific energy providers
     */
    constructor(em1StatusProviderFactory) {
        this.em1StatusProviderFactory = em1StatusProviderFactory;
    }
    /**
     * Creates an executable REST service using configured grid and solar providers.
     * @param configuration - REST provider configuration including device and meter setups
     * @returns An ExecutableService that serves energy data over HTTP
     */
    create(configuration) {
        const gridEnergyProvider = this.em1StatusProviderFactory.create({
            energyType: 'grid',
            device: configuration.properties.device,
            configuration: configuration.properties.meters.grid,
        });
        const solarEnergyProvider = this.em1StatusProviderFactory.create({
            energyType: 'solar',
            device: configuration.properties.device,
            configuration: configuration.properties.meters.solar,
        });
        return new RestService(gridEnergyProvider, solarEnergyProvider, {
            port: configuration.properties.port,
        });
    }
}
