import CircuitBreaker from 'opossum';
import { Provider } from './provider.js';

/**
 * Resilient Asymmetric EMA Provider with circuit breaker pattern.
 * Wraps an InnerAsymmetricEMAProvider with resilience features, providing
 * fallback to the last known EMA value when the underlying provider fails.
 *
 * @template T - The type of value this provider supplies
 */
export class CircuitBreakerProvider<T> implements Provider<T> {
  private circuitBreaker: CircuitBreaker<[], T>;

  /**
   * Creates a new AsymmetricEMAProvider with circuit breaker protection.
   * @param provider - The underlying provider to fetch raw values from
   * @param interpolator - The interpolator to use for blending values
   * @param asymmetricEmaOptions - Configuration options for the asymmetric EMA calculation
   */
  constructor(
    private readonly provider: Provider<T>,
    private readonly options?: CircuitBreaker.Options<[]>
  ) {
    this.circuitBreaker = new CircuitBreaker(
      this.provider.get.bind(this.provider),
      this.options
    );
  }

  /**
   * Fetches the value from the wrapped provider with resilience features.
   * If the underlying provider fails or times out, falls back to the last known EMA value.
   * @returns A promise that resolves to the EMA value
   * @throws {Error} If no EMA value is available for fallback when the provider fails
   */
  get(): Promise<T> {
    return this.circuitBreaker.fire();
  }
}
