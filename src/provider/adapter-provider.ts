import type { Adapter } from '../adapter/adapter.js';
import type { Provider } from './provider.js';
import type { ProviderFactory } from './provider-factory.js';

/**
 * Provider that wraps another provider and adapts its output to a different type.
 * Implements the decorator pattern to add transformation capability to any provider.
 *
 * @template T - The input type from the wrapped provider
 * @template K - The output type after adaptation
 */
export class AdapterProvider<T, K> implements Provider<K> {
  /**
   * Creates a new adapter provider.
   * @param provider - The underlying provider that supplies the source data
   * @param adapter - The adapter that transforms the provider's output from type T to type K
   */
  constructor(
    private readonly provider: Provider<T>,
    private readonly adapter: Adapter<T, K>
  ) {}

  /**
   * Gets data from the provider and adapts it to the target type.
   * @returns A promise that resolves to the adapted data of type K
   */
  async get(): Promise<K> {
    const value = await this.provider.get();
    return this.adapter.adapt(value);
  }
}

/**
 * Factory for creating AdapterProvider instances.
 * Combines a provider factory with an adapter to create providers with transformation capability.
 *
 * @template Options - The configuration options type for the provider factory
 * @template T - The intermediate type provided by the wrapped provider factory
 * @template K - The final output type after adaptation
 */
export class AdapterProviderFactory<Options, T, K> implements ProviderFactory<
  Options,
  K
> {
  /**
   * Creates a new adapter provider factory.
   * @param providerFactory - Factory to create providers that supply source data
   * @param adapter - Adapter to transform the provider's output
   */
  constructor(
    private readonly providerFactory: ProviderFactory<Options, T>,
    private readonly adapter: Adapter<T, K>
  ) {}

  /**
   * Creates an AdapterProvider instance with the specified options.
   * @param options - Configuration options for the wrapped provider factory
   * @returns An AdapterProvider that supplies adapted data
   */
  create(options: Options): Provider<K> {
    const provider = this.providerFactory.create(options);
    return new AdapterProvider<T, K>(provider, this.adapter);
  }
}
