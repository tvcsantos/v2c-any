import pRetry from 'p-retry';
import { Provider } from './provider.js';
import { logger } from '../utils/logger.js';

/**
 * Configuration options for retry behavior.
 * Controls how failed requests are retried with exponential backoff.
 */
export type RetryOptions = {
  /** Maximum number of retry attempts. Default depends on p-retry library */
  readonly retries?: number;
  /** The exponential factor to use for backoff. Default is 2 */
  readonly factor?: number;
  /** Minimum timeout between retries in milliseconds */
  readonly minTimeout?: number;
  /** Maximum timeout between retries in milliseconds */
  readonly maxTimeout?: number;
  /** Whether to randomize the timeout to prevent thundering herd */
  readonly randomize?: boolean;
  /** Maximum total time to spend retrying in milliseconds */
  readonly maxRetryTime?: number;
};

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
    private readonly options: RetryOptions
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
    return pRetry(run, {
      ...this.options,
      onFailedAttempt: (error) => {
        logger.warn(
          `Attempt ${error.attemptNumber} failed. There are ${error.retriesLeft} retries left.`
        );
      },
    });
  }
}
