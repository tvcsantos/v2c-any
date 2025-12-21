import type { Provider } from './provider.js';
import type { ProviderFactory } from './provider-factory.js';

/**
 * Provider that returns a fixed, pre-configured value.
 * Useful for testing, default fallbacks, or static data scenarios.
 * The value can be updated at runtime through the setter.
 *
 * @template T - The type of value this provider supplies
 */
export class FixedValueProvider<T> implements Provider<T | undefined> {
  private _value?: T;

  /**
   * Gets the current fixed value.
   * @returns The stored value, or undefined if not set
   */
  get value(): T | undefined {
    return this._value;
  }

  /**
   * Sets the fixed value to be returned by this provider.
   * @param value - The value to store and return on subsequent calls
   */
  set value(value: T | undefined) {
    this._value = value;
  }

  /**
   * Gets the fixed value asynchronously.
   * @returns A promise that resolves to the stored value
   */
  get(): Promise<T | undefined> {
    return Promise.resolve(this._value);
  }
}

/**
 * Configuration properties for creating a FixedValueProvider instance.
 *
 * @template T - The type of value to be provided
 */
export type FixedValueProviderProperties<T> = {
  /** The value to be returned by the provider */
  value?: T;
};

/**
 * Factory for creating FixedValueProvider instances.
 * Simplifies instantiation of providers with pre-configured static values.
 *
 * @template T - The type of value the created providers will supply
 */
export class FixedValueProviderFactory<T> implements ProviderFactory<
  unknown,
  T | undefined
> {
  /**
   * Creates a new fixed value provider factory.
   * @param properties - Configuration containing the fixed value to provide
   */
  constructor(private readonly properties: FixedValueProviderProperties<T>) {}

  /**
   * Creates a FixedValueProvider with the configured value.
   * @returns A FixedValueProvider initialized with the configured value
   */
  create(): FixedValueProvider<T> {
    const provider = new FixedValueProvider<T>();
    provider.value = this.properties.value;
    return provider;
  }
}
