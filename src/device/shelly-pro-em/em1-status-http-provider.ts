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

/**
 * Properties for configuring an EM1StatusHttpProvider.
 */
type EM1StatusHttpProviderProperties = {
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
   * Creates a new EM1 status HTTP provider.
   * @param properties - Configuration properties including protocol, host, port, and energy type
   */
  constructor(private readonly properties: EM1StatusHttpProviderProperties) {
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
type EM1StatusHttpProviderFactoryOptions = {
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
 * Factory for creating EM1StatusHttpProvider instances.
 * Implements the factory pattern to instantiate providers with the appropriate configuration.
 */
class EM1StatusHttpProviderFactory implements ProviderFactory<
  EM1StatusHttpProviderFactoryOptions,
  EM1Status
> {
  /**
   * Creates a new EM1StatusHttpProvider instance with the specified configuration.
   * Wraps the provider with resilience features (circuit breaker, retry, EMA) if configured.
   * @param options - Configuration options including protocol, host, port, energy type, and resilience settings
   * @returns A configured EM1StatusHttpProvider instance, optionally wrapped with resilience providers
   */
  create(options: EM1StatusHttpProviderFactoryOptions): Provider<EM1Status> {
    logger.debug(
      {
        url: `${options.properties.protocol}://${options.properties.host}:${options.properties.port}`,
        energyType: options.energyType,
      },
      'Creating EM1StatusHttpProvider'
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
 * Singleton factory instance for creating `EM1StatusHttpProvider` objects.
 * Provides a ready-to-use factory to build providers with supplied options.
 */
export const em1StatusHttpProviderFactory = new EM1StatusHttpProviderFactory();
