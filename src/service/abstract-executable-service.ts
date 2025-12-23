import { logger } from '../utils/logger.js';
import { ExecutableService } from './executable-service.js';

/**
 * Abstract base class for executable services.
 * Provides idempotent start/stop lifecycle management with state tracking.
 * Subclasses implement the actual service logic via doStart() and doStop() hooks.
 */
export abstract class AbstractExecutableService implements ExecutableService {
  /**
   * Internal state flag tracking whether the service is currently started.
   * @private
   */
  protected _started: boolean = false;

  /**
   * Returns whether the service is currently started.
   * @returns true if the service has been started and not yet stopped
   */
  get started(): boolean {
    return this._started;
  }

  /**
   * Hook for subclasses to implement service startup logic.
   * Called by start() only when the service is not already started.
   * @returns A promise that resolves when the service has successfully started
   * @protected
   */
  protected abstract doStart(): Promise<void>;

  /**
   * Hook for subclasses to implement service shutdown logic.
   * Called by stop() only when the service is currently started.
   * @returns A promise that resolves when the service has successfully stopped
   * @protected
   */
  protected abstract doStop(): Promise<void>;

  /**
   * Starts the service.
   * Idempotent: calling start() on an already-started service is a no-op with a warning.
   * @returns A promise that resolves when the service has successfully started
   */
  async start(): Promise<void> {
    if (this._started) {
      logger.warn(`Service is already started`);
      return;
    }
    await this.doStart();
    this._started = true;
  }

  /**
   * Stops the service.
   * Idempotent: calling stop() on an already-stopped service is a no-op with a warning.
   * @returns A promise that resolves when the service has successfully stopped
   */
  async stop(): Promise<void> {
    if (!this._started) {
      logger.warn(`Service is not started`);
      return;
    }
    await this.doStop();
    this._started = false;
  }
}
