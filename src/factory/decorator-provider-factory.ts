import type { Provider } from '../provider/provider.js';
import type { ProviderFactory } from '../provider/provider-factory.js';

/**
 * Type representing a decorator function that wraps a provider to add additional behavior.
 * The decorator takes a provider and returns a new provider that enhances or modifies the original.
 *
 * @template T - The type of data the providers supply
 */
export type ProviderDecorator<T> = (provider: Provider<T>) => Provider<T>;

/**
 * Generic factory that wraps another provider factory with a decorator pattern.
 * Enables composition by allowing providers to be enhanced with additional behavior
 * such as retry logic, caching, logging, validation, etc.
 *
 * This factory creates providers by first using the wrapped factory to create a base provider,
 * then applying a decorator function to enhance it with additional capabilities.
 *
 * @example
 * // Creating a provider factory with retry capability
 * const retryDecorator = (provider) => new RetryableProvider(provider, { retries: 3 });
 * const resilientFactory = new DecoratorProviderFactory(baseFactory, retryDecorator);
 * const resilientProvider = resilientFactory.create(options);
 *
 * @template Options - The configuration options type required by the wrapped factory
 * @template T - The type of data the created providers will supply
 */
export class DecoratorProviderFactory<Options, T> implements ProviderFactory<
  Options,
  T
> {
  /**
   * Creates a new decorator provider factory.
   * @param providerFactory - The underlying factory that creates base providers
   * @param decorator - Function that enhances providers with additional behavior
   */
  constructor(
    private readonly providerFactory: ProviderFactory<Options, T>,
    private readonly decorator: ProviderDecorator<T>
  ) {}

  /**
   * Creates a decorated provider using the wrapped factory and decorator function.
   * First creates a base provider using the wrapped factory, then applies the decorator
   * to enhance it with additional capabilities.
   *
   * @param options - Configuration options for the wrapped provider factory
   * @returns A decorated provider with enhanced behavior
   */
  create(options: Options): Provider<T> {
    const baseProvider = this.providerFactory.create(options);
    return this.decorator(baseProvider);
  }
}
