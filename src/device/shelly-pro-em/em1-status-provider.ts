import { Client, Dispatcher, interceptors } from 'undici';
import type { Provider } from '../../provider/provider.js';
import { logger } from '../../utils/logger.js';
import { energyTypeToId } from '../../utils/mappers.js';
import type { ProviderFactory } from '../../provider/provider-factory.js';
import type { EM1Status } from '../../schema/rest-configuration.js';
import type { EnergyType } from '../../schema/configuration.js';
import { AsymmetricEMAProvider } from '../../provider/asymmetric-emea-provider.js';
import { RetryableProvider } from '../../provider/retryable-provider.js';
import { em1StatusInterpolator } from '../../utils/interpolator.js';
import { DecoratorProviderFactory } from '../../factory/decorator-provider-factory.js';

/**
 * Provider that fetches EM1 status data from a Shelly Pro EM device via HTTP.
 * Retrieves real-time energy monitoring data by querying the device's RPC API endpoint.
 */
export class EM1StatusProvider implements Provider<EM1Status> {
  private readonly id: number;
  private readonly client: Dispatcher;

  /**
   * Creates a new EM1 status provider.
   * @param host - The IP address or hostname of the Shelly Pro EM device
   * @param energyType - The type of energy data to retrieve (e.g., active, reactive)
   */
  constructor(
    private readonly host: string,
    private readonly energyType: EnergyType
  ) {
    const { responseError } = interceptors;
    this.client = new Client(`http://${this.host}`).compose(responseError());
    this.id = energyTypeToId(energyType);
  }

  /**
   * Fetches the current EM1 status from the device.
   * @returns A promise that resolves to the EM1 status object containing energy metrics
   * @throws {Error} If the HTTP request fails or returns invalid data
   */
  async get(): Promise<EM1Status> {
    logger.debug(
      { host: this.host, energyType: this.energyType },
      'Fetching EM1Status'
    );
    const res = await this.client.request({
      path: `/rpc/EM1.GetStatus?id=${this.id}`,
      method: 'GET',
    });
    return (await res.body.json()) as EM1Status;
  }
}

/**
 * Configuration options for creating an EM1StatusProvider instance.
 */
export type EM1StatusProviderOptions = {
  energyType: EnergyType;
  properties: {
    ip: string;
  };
};

/**
 * Factory for creating EM1StatusProvider instances.
 * Implements the factory pattern to instantiate providers with the appropriate configuration.
 */
class EM1StatusProviderFactory implements ProviderFactory<
  EM1StatusProviderOptions,
  EM1Status
> {
  /**
   * Creates a new EM1StatusProvider instance with the specified configuration.
   * @param options - Configuration options including target IP and energy type
   * @returns A configured EM1StatusProvider instance
   */
  create(options: EM1StatusProviderOptions): Provider<EM1Status> {
    logger.debug(
      { ip: options.properties.ip, energyType: options.energyType },
      'Creating EM1StatusProvider'
    );
    return new EM1StatusProvider(options.properties.ip, options.energyType);
  }
}

/**
 * Singleton factory instance for creating `EM1StatusProvider` objects.
 * Provides a ready-to-use factory to build providers with supplied options.
 */
const localEm1StatusProviderFactory = new EM1StatusProviderFactory();

export const em1StatusProviderFactory = new DecoratorProviderFactory(
  localEm1StatusProviderFactory,
  (provider) =>
    new AsymmetricEMAProvider(
      new RetryableProvider(provider, { retries: 3 }),
      em1StatusInterpolator,
      {
        alphaRise: 1,
        alphaFall: 0.2,
        comparator: (a, b) => {
          const powerA = a?.act_power ?? 0;
          const powerB = b?.act_power ?? 0;
          return powerA - powerB;
        },
      }
    )
);
