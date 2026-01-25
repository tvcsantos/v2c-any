import CircuitBreaker from 'opossum';
import { Provider } from './provider.js';

/**
 * Provider wrapper that implements the circuit breaker pattern for resilience.
 * Protects against cascading failures by automatically opening the circuit when
 * the underlying provider exceeds failure thresholds. Supports timeout, retry,
 * and fallback mechanisms provided by the Opossum circuit breaker library.
 *
 * @template T - The type of value this provider supplies
 */
export class CircuitBreakerProvider<T> implements Provider<T> {
  /** The Opossum circuit breaker instance managing failure detection and recovery */
  private circuitBreaker: CircuitBreaker<[], T>;

  /**
   * Creates a new CircuitBreakerProvider wrapping the given provider.
   * @param provider - The underlying provider to protect with circuit breaker logic
   * @param options - Optional Opossum circuit breaker configuration (timeout, error thresholds, etc.)
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
   * Fetches a value from the underlying provider with circuit breaker protection.
   * Automatically fails fast when the circuit is open due to excessive failures.
   * Falls back to configured fallback mechanisms if the provider fails.
   *
   * @returns A promise that resolves to the value from the underlying provider
   * @throws {Error} If the circuit is open or the provider fails without a configured fallback
   */
  get(): Promise<T> {
    return this.circuitBreaker.fire();
  }
}
