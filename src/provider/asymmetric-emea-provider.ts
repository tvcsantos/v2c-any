import { logger } from '../utils/logger.js';
import { Interpolator } from './interpolator.js';
import { Provider } from './provider.js';
import CircuitBreaker from 'opossum';

/**
 * Configuration options for Asymmetric EMA calculation.
 */
export type AsymmetricEMAOptions<T> = {
  /** The smoothing factor for rising values (0 to 1). Higher values give more weight to recent values */
  readonly alphaRise: number;
  /** The smoothing factor for falling values (0 to 1). Higher values give more weight to recent values */
  readonly alphaFall: number;
  /** Comparator to determine if values are rising or falling. Returns negative if a < b, 0 if equal, positive if a > b */
  readonly comparator: (a: T, b: T) => number;
};

/**
 * Generic Asymmetric EMA Provider using algebraic interpolators.
 * Implements exponential moving average (EMA) with different smoothing factors
 * for rising and falling values, allowing asymmetric response to changes.
 *
 * @template T - The type of value this provider supplies
 */
class InnerAsymmetricEMAProvider<T> implements Provider<T> {
  private ema: T | null = null;

  /**
   * Creates a new InnerAsymmetricEMAProvider.
   * @param provider - The underlying provider to fetch raw values from
   * @param interpolator - The interpolator to use for blending values
   * @param options - Configuration options for the asymmetric EMA calculation
   * @throws {Error} If alphaRise or alphaFall is not between 0 and 1
   */
  constructor(
    private readonly provider: Provider<T>,
    private readonly interpolator: Interpolator<T>,
    private readonly options: AsymmetricEMAOptions<T>
  ) {
    if (options.alphaRise < 0 || options.alphaRise > 1) {
      throw new Error('alphaRise must be between 0 and 1');
    }
    if (options.alphaFall < 0 || options.alphaFall > 1) {
      throw new Error('alphaFall must be between 0 and 1');
    }
  }

  /**
   * Fetches a value from the wrapped provider and updates the EMA.
   * On first call, initializes the EMA with the fetched value.
   * On subsequent calls, interpolates between the new value and current EMA,
   * using alphaRise if the value is increasing or alphaFall if decreasing.
   * @returns A promise that resolves to the updated EMA value
   */
  async get(): Promise<T> {
    const newValue = await this.provider.get();

    if (this.ema === null) {
      this.ema = newValue;
    } else {
      // Determine if value is rising or falling
      const comparison = this.options.comparator(newValue, this.ema);
      const alpha =
        comparison >= 0 ? this.options.alphaRise : this.options.alphaFall;

      this.ema = this.interpolator.interpolate(newValue, this.ema, alpha);
    }

    return this.ema;
  }

  /**
   * Gets the current EMA value without fetching a new value.
   * @returns The current EMA value, or null if not yet initialized
   */
  getCurrentEMA(): T | null {
    return this.ema;
  }

  /**
   * Resets the EMA to its initial state.
   * The next call to get() will reinitialize the EMA.
   */
  reset(): void {
    this.ema = null;
  }
}

/**
 * Resilient Asymmetric EMA Provider with circuit breaker pattern.
 * Wraps an InnerAsymmetricEMAProvider with resilience features, providing
 * fallback to the last known EMA value when the underlying provider fails.
 *
 * @template T - The type of value this provider supplies
 */
export class AsymmetricEMAProvider<T> implements Provider<T> {
  private circuitBreaker: CircuitBreaker<[], T>;
  private readonly provider: InnerAsymmetricEMAProvider<T>;

  /**
   * Creates a new AsymmetricEMAProvider with circuit breaker protection.
   * @param provider - The underlying provider to fetch raw values from
   * @param interpolator - The interpolator to use for blending values
   * @param asymmetricEmaOptions - Configuration options for the asymmetric EMA calculation
   */
  constructor(
    provider: Provider<T>,
    interpolator: Interpolator<T>,
    asymmetricEmaOptions: AsymmetricEMAOptions<T>
  ) {
    this.provider = new InnerAsymmetricEMAProvider<T>(
      provider,
      interpolator,
      asymmetricEmaOptions
    );
    this.circuitBreaker = new CircuitBreaker(
      this.provider.get.bind(this.provider),
      {
        timeout: 5000, // 5 seconds
      }
    ).fallback(() => {
      const fallbackValue = this.provider.getCurrentEMA();
      if (fallbackValue) {
        logger.warn(
          'Using Asymmetric EMA value as fallback for ResilientProvider'
        );
        return fallbackValue;
      } else {
        logger.error(
          'No Asymmetric EMA value available for fallback in ResilientProvider'
        );
        throw new Error('No Asymmetric EMA value available for fallback');
      }
    });
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
