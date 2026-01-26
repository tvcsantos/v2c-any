import { logger } from '../utils/logger.js';
import { AbstractExecutableService } from './abstract-executable-service.js';
import { ExecutableService } from './executable-service.js';
import { Notifyable } from './notifyable.js';
import { Triggerable } from './triggerable.js';

/**
 * Keep-alive service that periodically triggers requests at a fixed interval.
 * Implements a heartbeat pattern where the timer is reset whenever `notify()` is called.
 * Automatically reschedules triggers after each execution until stopped.
 */
export class KeepAliveService
  extends AbstractExecutableService
  implements Notifyable
{
  private abortController: AbortController | null = null;

  /**
   * Creates a new keep-alive service.
   * @param triggerable - The triggerable service to invoke periodically
   * @param interval - The interval in milliseconds between triggers
   */
  constructor(
    private readonly triggerable: Triggerable & ExecutableService,
    private readonly interval: number
  ) {
    super();
  }

  /**
   * Starts the keep-alive service.
   * Starts the underlying triggerable service and begins the automatic trigger loop.
   * @returns A promise that resolves when the service has started
   */
  async doStart(): Promise<void> {
    await this.triggerable.start();
    this.abortController = new AbortController();
    this.scheduleNextTrigger(this.abortController.signal);
    return Promise.resolve();
  }

  /**
   * Stops the keep-alive service.
   * Aborts any scheduled triggers and stops the underlying triggerable service.
   * @returns A promise that resolves when the service has stopped
   */
  async doStop(): Promise<void> {
    this.abortController?.abort();
    this.abortController = null;
    await this.triggerable.stop();
    return Promise.resolve();
  }

  /**
   * Resets the keep-alive timer.
   * Cancels any pending trigger and reschedules a new one after the configured interval.
   * This is typically called when an external event occurs (e.g., MQTT message received).
   * @returns A promise that resolves immediately after rescheduling
   */
  async notify(): Promise<void> {
    // Abort previous scheduled beat and reschedule
    this.abortController?.abort();
    this.abortController = new AbortController();
    this.scheduleNextTrigger(this.abortController.signal);
    return Promise.resolve();
  }

  /**
   * Schedules the next trigger after the configured interval.
   * Automatically reschedules itself after each successful trigger to maintain the heartbeat.
   * The timeout is automatically cleared when the abort signal is triggered.
   * @param signal - AbortSignal to control trigger cancellation
   */
  private scheduleNextTrigger(signal: AbortSignal): void {
    const timeoutId = setTimeout(() => {
      if (signal.aborted) return;

      this.triggerable
        .trigger()
        .catch((err) => {
          logger.error(err, 'Error during heartbeat trigger');
        })
        .finally(() => {
          if (!signal.aborted) {
            this.scheduleNextTrigger(signal);
          }
        });
    }, this.interval);

    // Clear timeout when aborted
    signal.addEventListener('abort', () => clearTimeout(timeoutId), {
      once: true,
    });
  }
}
