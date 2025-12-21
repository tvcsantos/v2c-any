import { RestProvider } from '../schema/rest-configuration.js';
import { ExecutableService } from '../service/executable-service.js';
import { RestService } from '../service/rest-service.js';
import { EM1StatusProviderFactory } from './em1-status-provider-factory.js';
import { ExecutableServiceFactory } from './executable-service-factory.js';

/**
 * Factory for creating REST services that expose energy data.
 * Composes grid and solar energy providers based on configuration and
 * returns an executable REST service instance.
 */
export class RestServiceFactory implements ExecutableServiceFactory<RestProvider> {
  /**
   * Creates a new REST service factory.
   * @param em1StatusProviderFactory - Factory used to build device-specific energy providers
   */
  constructor(
    private readonly em1StatusProviderFactory: EM1StatusProviderFactory
  ) {}

  /**
   * Creates an executable REST service using configured grid and solar providers.
   * @param configuration - REST provider configuration including device and meter setups
   * @returns An ExecutableService that serves energy data over HTTP
   */
  create(configuration: RestProvider): ExecutableService {
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
