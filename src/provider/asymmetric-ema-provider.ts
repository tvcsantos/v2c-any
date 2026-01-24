import { Interpolator } from './interpolator.js';
import { Provider } from './provider.js';

/**
 * Configuration options for Asymmetric EMA calculation.
 */
export type AsymmetricEMAOptions<T> = {
  /** The smoothing factor for rising values (0 to 1). Higher values give more weight to recent values */
  readonly alphaRise: number;
  /** The smoothing factor for falling values (0 to 1). Higher values give more weight to recent values */
  readonly alphaFall: number;
  /** The smoothing factor for missing values (0 to 1). Higher values give more weight to recent values */
  readonly alphaMissing: number;
  /** Optional threshold (in milliseconds) to consider a value as fresh */
  readonly freshnessThreshold?: number;
  /** The zero/baseline value to decay toward when values are missing */
  readonly zeroValue: T;
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
export class AsymmetricEMAProvider<T> implements Provider<T> {
  private ema: T | null = null;
  private lastUpdateTime: number | null = null;

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

  private onNewValue(newValue: T) {
    if (this.ema === null) {
      this.ema = newValue;
    }
    // Determine if value is rising or falling
    const comparison = this.options.comparator(newValue, this.ema);
    const alpha =
      comparison >= 0 ? this.options.alphaRise : this.options.alphaFall;

    this.ema = this.interpolator.interpolate(newValue, this.ema, alpha);
  }

  private onMissingValue() {
    if (this.ema !== null) {
      this.ema = this.interpolator.interpolate(
        this.options.zeroValue,
        this.ema,
        this.options.alphaMissing
      );
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
    try {
      const newValue = await this.provider.get();
      this.lastUpdateTime = Date.now();
      this.onNewValue(newValue);
      return newValue;
    } catch (error) {
      if (
        this.options.freshnessThreshold === undefined ||
        this.lastUpdateTime === null ||
        Date.now() - this.lastUpdateTime >= this.options.freshnessThreshold
      ) {
        this.onMissingValue();
      }
      if (this.ema !== null) {
        return this.ema;
      }
      throw error;
    }
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
  reset(value: T | null = null): void {
    this.ema = value;
  }
}
