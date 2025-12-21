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
  private timer: NodeJS.Timeout | null = null;

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
  start() {
    if (this.timer) {
      throw new Error('Adapter already started');
    }
    this.timer = setInterval(() => {
      this.cycle().catch((err) => {
        logger.error('Error during pull-push cycle ' + err);
      });
    }, this.intervalMs);
    // Run immediately
    this.cycle().catch((err) => {
      logger.error('Error during initial pull-push cycle ' + err);
    });

    return Promise.resolve();
  }

  /**
   * Stops periodic polling if running.
   * @returns A promise that resolves once the service stops
   */
  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    return Promise.resolve();
  }

  /**
   * Single poll-and-push cycle.
   * Retrieves data from the provider and forwards it to the callback when present.
   */
  private async cycle() {
    const data = await this.provider.get();
    if (data) {
      logger.info(`Pushing data: ${JSON.stringify(data)}`);
      await this.callbackProperties.callback(data);
    }
  }
}
