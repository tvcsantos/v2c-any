import pRetry, { Options } from 'p-retry';
import { Provider } from './provider.js';
import { logger } from '../utils/logger.js';

/**
 * Provider that wraps another provider with automatic retry logic.
 * Uses exponential backoff strategy to retry failed operations,
 * making the provider more resilient to transient failures.
 *
 * @template T - The type of value this provider supplies
 */
export class RetryableProvider<T> implements Provider<T> {
  /**
   * Creates a new RetryableProvider.
   * @param provider - The underlying provider to wrap with retry logic
   * @param options - Configuration options for retry behavior
   */
  constructor(
    private readonly provider: Provider<T>,
    private readonly options: Options
  ) {}

  /**
   * Fetches a value from the wrapped provider with automatic retry on failure.
   * Retries are performed according to the configured retry options with exponential backoff.
   * @returns A promise that resolves to the provided value
   * @throws {Error} If all retry attempts are exhausted
   */
  get(): Promise<T> {
    const run = async (): Promise<T> => {
      return this.provider.get();
    };
    return pRetry(run, this.options);
  }
}
