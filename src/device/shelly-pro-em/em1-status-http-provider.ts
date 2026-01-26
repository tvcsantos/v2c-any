import { Client, Dispatcher, interceptors } from 'undici';
import type { Provider } from '../../provider/provider.js';
import { logger } from '../../utils/logger.js';
import { energyTypeToId } from '../../utils/mappers.js';
import type { ProviderFactory } from '../../provider/provider-factory.js';
import type { EM1Status } from '../../schema/rest-configuration.js';
import type { EnergyType } from '../../schema/configuration.js';
import {
  BreakerOptions,
  EmaOptions,
  RetryOptions,
} from '../../schema/common-configuration.js';
import { createResiliantProvider } from '../../utils/resiliance.js';
import {
  em1StatusComparator,
  em1StatusInterpolator,
  em1StatusZeroValue,
} from '../../utils/interpolator.js';

type EM1StatusProviderProperties = {
  energyType: EnergyType;
  protocol: 'http' | 'https';
  host: string;
  port: number;
};

/**
 * Provider that fetches EM1 status data from a Shelly Pro EM device via HTTP.
 * Retrieves real-time energy monitoring data by querying the device's RPC API endpoint.
 */
class EM1StatusHttpProvider implements Provider<EM1Status> {
  private readonly id: number;
  private readonly client: Dispatcher;
  private readonly url: string;

  /**
   * Creates a new EM1 status provider.
   * @param host - The IP address or hostname of the Shelly Pro EM device
   * @param energyType - The type of energy data to retrieve (e.g., active, reactive)
   */
  constructor(private readonly properties: EM1StatusProviderProperties) {
    this.url = `${properties.protocol}://${properties.host}:${properties.port}`;
    const { responseError } = interceptors;
    this.client = new Client(this.url).compose(responseError());
    this.id = energyTypeToId(properties.energyType);
  }

  /**
   * Fetches the current EM1 status from the device.
   * @returns A promise that resolves to the EM1 status object containing energy metrics
   * @throws {Error} If the HTTP request fails or returns invalid data
   */
  async get(): Promise<EM1Status> {
    logger.debug(
      { url: this.url, energyType: this.properties.energyType },
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
type EM1StatusProviderFactoryOptions = {
  energyType: EnergyType;
  properties: {
    host: string;
    protocol: 'http' | 'https';
    port: number;
    breaker?: BreakerOptions;
    retry?: RetryOptions;
    ema?: EmaOptions;
  };
};

/**
 * Factory for creating EM1StatusProvider instances.
 * Implements the factory pattern to instantiate providers with the appropriate configuration.
 */
class EM1StatusHttpProviderFactory implements ProviderFactory<
  EM1StatusProviderFactoryOptions,
  EM1Status
> {
  /**
   * Creates a new EM1StatusProvider instance with the specified configuration.
   * @param options - Configuration options including target IP and energy type
   * @returns A configured EM1StatusProvider instance
   */
  create(options: EM1StatusProviderFactoryOptions): Provider<EM1Status> {
    logger.debug(
      {
        url: `${options.properties.protocol}://${options.properties.host}:${options.properties.port}`,
        energyType: options.energyType,
      },
      'Creating EM1StatusProvider'
    );
    const provider = new EM1StatusHttpProvider({
      energyType: options.energyType,
      ...options.properties,
    });

    return createResiliantProvider({
      provider,
      interpolator: em1StatusInterpolator,
      zeroValue: em1StatusZeroValue,
      comparator: em1StatusComparator,
      breakerOptions: options.properties.breaker,
      retryOptions: options.properties.retry,
      emaOptions: options.properties.ema,
    });
  }
}

/**
 * Singleton factory instance for creating `EM1StatusProvider` objects.
 * Provides a ready-to-use factory to build providers with supplied options.
 */
export const em1StatusHttpProviderFactory = new EM1StatusHttpProviderFactory();
