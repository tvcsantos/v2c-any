import type { Provider } from '../provider/provider.js';
import { logger } from '../utils/logger.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { AbstractExecutableService } from './abstract-executable-service.js';
import { ExecutableService } from './executable-service.js';

/**
 * Periodic pull-then-push service.
 * Fetches data from a `Provider` at a fixed interval and forwards it via a callback.
 * Implements start/stop lifecycle control.
 *
 * @template Payload - The type of data provided and pushed
 */
export class PullPushService extends AbstractExecutableService {
  private abortController: AbortController | null = null;

  /**
   * Creates a new pull/push service.
   * @param provider - Source `Provider` that supplies data
   * @param interval - Polling interval in milliseconds
   * @param callbackProperties - Callback container invoked with fetched data
   */
  constructor(
    private readonly interval: number,
    private readonly triggerable: Triggerable
  ) {
    super();
  }

  /**
   * Starts periodic polling and an immediate initial cycle.
   * @returns A promise that resolves once the service starts
   * @throws {Error} If the service is already started
   */
  async doStart() {
    if (this.abortController) {
      throw new Error('Adapter already started');
    }
    this.abortController = new AbortController();

    await this.triggerable.start();

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.run(this.abortController.signal);

    return Promise.resolve();
  }

  /**
   * Stops periodic polling if running.
   * @returns A promise that resolves once the service stops
   */
  async doStop() {
    this.abortController?.abort();
    this.abortController = null;

    await this.triggerable.stop();

    return Promise.resolve();
  }

  /**
   * Main async loop that runs cycles until aborted.
   * @param signal - AbortSignal to control loop cancellation
   */
  private async run(signal: AbortSignal) {
    // Create a single abort promise that resolves when signal is aborted
    const abortPromise = new Promise<void>((resolve) => {
      signal.addEventListener('abort', () => resolve(), { once: true });
    });

    while (!signal.aborted) {
      try {
        await this.triggerable.trigger();
      } catch (err) {
        logger.error(err, 'Error during pull-push cycle');
      }

      // Wait for either the interval or abort signal
      if (!signal.aborted) {
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(resolve, this.interval);
        });
        await Promise.race([timeoutPromise, abortPromise]);
      }
    }
  }
}

export interface Triggerable extends ExecutableService {
  trigger(): Promise<void>;
}

export class PullPushTriggerableService<Payload>
  extends AbstractExecutableService
  implements Triggerable
{
  constructor(
    private readonly provider: Provider<Payload>,
    private readonly callbackProperties: CallbackProperties<Payload>
  ) {
    super();
  }

  doStart(): Promise<void> {
    // No-op
    return Promise.resolve();
  }

  doStop(): Promise<void> {
    // No-op
    return Promise.resolve();
  }

  async trigger(): Promise<void> {
    const data = await this.provider.get();
    if (data) {
      logger.debug({ data }, 'Pushing data');
      await this.callbackProperties.callback(data);
    }
  }
}
