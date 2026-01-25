import { AsymmetricEMAProvider } from '../provider/asymmetric-ema-provider.js';
import { CircuitBreakerProvider } from '../provider/circuit-breaker-provider.js';
import { Interpolator } from '../provider/interpolator.js';
import { Provider } from '../provider/provider.js';
import { RetryableProvider } from '../provider/retryable-provider.js';
import {
  BreakerOptions,
  EmaOptions,
  RetryOptions,
} from '../schema/common-configuration.js';
import { logger } from './logger.js';

/**
 * Configuration options for creating a resilient provider.
 * Groups all parameters needed to compose a provider with resilience features.
 *
 * @template T - The type of value the provider supplies
 */
export type ResiliantProviderOptions<T> = {
  /** The base provider to wrap with resilience features */
  provider: Provider<T>;
  /** The interpolator for blending values in EMA calculations */
  interpolator: Interpolator<T>;
  /** The baseline value to decay toward when values are missing (used by EMA) */
  zeroValue: T;
  /** Function to compare values for rise/fall detection. Returns negative if a < b, 0 if equal, positive if a > b */
  comparator: (a: T, b: T) => number;
  /** Optional circuit breaker configuration (timeout, error thresholds, etc.) */
  breakerOptions?: BreakerOptions;
  /** Optional retry configuration (attempts, backoff strategy, etc.) */
  retryOptions?: RetryOptions;
  /** Optional EMA configuration (smoothing factors for rising, falling, and missing values) */
  emaOptions?: EmaOptions;
};

/**
 * Creates a resilient provider by wrapping a base provider with optional circuit breaker,
 * retry, and exponential moving average (EMA) capabilities. The providers are composed
 * in layers: circuit breaker (outermost) → retry → EMA → base provider (innermost).
 * This composition provides comprehensive resilience against transient failures.
 *
 * @template T - The type of value the provider supplies
 * @param options - Configuration options for creating the resilient provider
 * @returns A composed provider with the requested resilience features
 */
export function createResiliantProvider<T>(
  options: ResiliantProviderOptions<T>
): Provider<T> {
  const {
    provider,
    interpolator,
    zeroValue,
    comparator,
    breakerOptions,
    retryOptions,
    emaOptions,
  } = options;

  let result = provider;
  if (breakerOptions) {
    result = new CircuitBreakerProvider(result, breakerOptions);
  }
  if (retryOptions) {
    result = new RetryableProvider(result, {
      retries: retryOptions.attempts,
      factor: retryOptions.factor,
      minTimeout: retryOptions.minTimeout,
      maxTimeout: retryOptions.maxTimeout,
      randomize: retryOptions.randomize,
      maxRetryTime: retryOptions.maxRetryTime,
      shouldRetry: (context) => {
        const error: Error & { code?: string } = context.error;
        if (error.code === 'EOPENBREAKER') {
          // Do not retry if circuit is open
          return false;
        }
        return true;
      },
      onFailedAttempt: (context) => {
        const attributes = {
          message: context.error.message,
          attemptNumber: context.attemptNumber,
          retriesLeft: context.retriesLeft,
          retriesConsumed: context.retriesConsumed,
        };
        logger.warn({ attributes }, 'Attempt to get value failed');
      },
    });
  }

  if (emaOptions) {
    result = new AsymmetricEMAProvider(result, interpolator, {
      alphaRise: emaOptions.alphaRise,
      alphaFall: emaOptions.alphaFall,
      alphaMissing: emaOptions.alphaMissing,
      freshnessThreshold: emaOptions.freshnessThreshold,
      zeroValue,
      comparator,
    });
  }

  return result;
}
