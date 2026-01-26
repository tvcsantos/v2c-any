import { logger } from '../utils/logger.js';
import { AbstractExecutableService } from './abstract-executable-service.js';
import { ExecutableService } from './executable-service.js';
import { Triggerable } from './triggerable.js';

/**
 * Periodic pull-then-push service.
 * Invokes a `Triggerable` service at a fixed interval.
 * Implements start/stop lifecycle control.
 */
export class PullPushService extends AbstractExecutableService {
  private abortController: AbortController | null = null;

  /**
   * Creates a new pull/push service.
   * @param interval - Polling interval in milliseconds
   * @param triggerable - Triggerable service that is invoked at each interval
   */
  constructor(
    private readonly interval: number,
    private readonly triggerable: Triggerable & ExecutableService
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
