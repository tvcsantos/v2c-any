import type { Provider } from '../provider/provider.js';
import type { ExecutableService } from './executable-service.js';
import { logger } from '../utils/logger.js';
import type { CallbackProperties } from '../utils/callback-properties.js';

/**
 * Periodic pull-then-push service.
 * Fetches data from a `Provider` at a fixed interval and forwards it via a callback.
 * Implements start/stop lifecycle control.
 *
 * @template Payload - The type of data provided and pushed
 */
export class PullPushService<Payload> implements ExecutableService {
  private abortController: AbortController | null = null;

  /**
   * Creates a new pull/push service.
   * @param provider - Source `Provider` that supplies data
   * @param intervalMs - Polling interval in milliseconds
   * @param callbackProperties - Callback container invoked with fetched data
   */
  constructor(
    private readonly provider: Provider<Payload>,
    private readonly intervalMs: number,
    private readonly callbackProperties: CallbackProperties<Payload>
  ) {}

  /**
   * Starts periodic polling and an immediate initial cycle.
   * @returns A promise that resolves once the service starts
   * @throws {Error} If the service is already started
   */
  async start() {
    if (this.abortController) {
      throw new Error('Adapter already started');
    }
    this.abortController = new AbortController();
    
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.run(this.abortController.signal);

    return Promise.resolve();
  }

  /**
   * Stops periodic polling if running.
   * @returns A promise that resolves once the service stops
   */
  stop() {
    this.abortController?.abort();
    this.abortController = null;
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
        await this.cycle();
      } catch (err) {
        logger.error(err, 'Error during pull-push cycle');
      }
      
      // Wait for either the interval or abort signal
      if (!signal.aborted) {
        const timeoutPromise = new Promise<void>((resolve) => {
          setTimeout(resolve, this.intervalMs);
        });
        await Promise.race([timeoutPromise, abortPromise]);
      }
    }
  }

  /**
   * Single poll-and-push cycle.
   * Retrieves data from the provider and forwards it to the callback when present.
   */
  private async cycle() {
    const data = await this.provider.get();
    if (data) {
      logger.info({ data }, 'Pushing data');
      await this.callbackProperties.callback(data);
    }
  }
}
