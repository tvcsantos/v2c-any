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

export function createResiliantProvider<T>(
  provider: Provider<T>,
  interpolator: Interpolator<T>,
  zeroValue: T,
  comparator: (a: T, b: T) => number,
  breakerOptions?: BreakerOptions,
  retryOptions?: RetryOptions,
  emaOptions?: EmaOptions
): Provider<T> {
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
      alphaRise: emaOptions?.alphaRise,
      alphaFall: emaOptions?.alphaFall,
      alphaMissing: emaOptions?.alphaMissing,
      freshnessThreshold: emaOptions?.freshnessThreshold,
      zeroValue,
      comparator,
    });
  }

  return result;
}
