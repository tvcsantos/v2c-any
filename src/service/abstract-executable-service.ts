import { logger } from '../utils/logger.js';
import { ExecutableService, ServiceState } from './executable-service.js';

/**
 * Abstract base class for executable services.
 *
 * Provides idempotent start/stop lifecycle management with state tracking.
 *
 * Subclasses implement the actual service logic via doStart() and doStop()
 * hooks.
 */
export abstract class AbstractExecutableService implements ExecutableService {
  /**
   * Internal state tracking the current state of the service.
   * @private
   */
  private _state: ServiceState = 'stopped';
  private startAbortController: AbortController | null = null;
  private startPromise: Promise<void> | null = null;
  private stopPromise: Promise<void> | null = null;

  /**
   * Returns the current state of the service.
   *
   * @returns The current service state
   */
  get state(): ServiceState {
    return this._state;
  }

  /**
   * Hook for subclasses to implement service startup logic.
   *
   * Called by start() only when the service is not already started.
   *
   * @param signal - Signal that aborts an in-progress startup
   * @returns A promise that resolves when the service has successfully started
   * @protected
   */
  protected abstract doStart(signal: AbortSignal): Promise<void>;

  /**
   * Hook for subclasses to implement service shutdown logic.
   *
   * Called by stop() to clean up a started service or a partial startup.
   *
   * @returns A promise that resolves when the service has successfully stopped
   * @protected
   */
  protected abstract doStop(): Promise<void>;

  /**
   * Starts the service.
   *
   * Idempotent: calling start() on an already-started service is a no-op with
   * a warning.
   *
   * @param signal - Optional external signal that cancels startup
   * @returns A promise that resolves when the service has successfully started
   */
  async start(signal?: AbortSignal): Promise<void> {
    if (this._state === 'started') {
      logger.warn(`Service is already ${this._state}`);
      return;
    }

    if (this._state === 'starting') {
      await this.startPromise;
      return;
    }

    if (this._state === 'stopping') {
      throw new Error('Cannot start service while it is stopping');
    }

    if (this._state === 'failed') {
      throw new Error('Cannot start service while it is failed');
    }

    const startAbortController = new AbortController();
    const startSignal = signal
      ? AbortSignal.any([signal, startAbortController.signal])
      : startAbortController.signal;

    this._state = 'starting';
    this.startAbortController = startAbortController;
    const startPromise = this.doStart(startSignal);
    this.startPromise = startPromise;

    try {
      await startPromise;
      if (this._state === 'starting') {
        this._state = 'started';
      }
    } catch (error) {
      if (this._state === 'starting') {
        this._state = 'failed';
      }
      throw error;
    } finally {
      this.startPromise = null;
      this.startAbortController = null;
    }
  }

  /**
   * Stops the service.
   *
   * Idempotent: calling stop() on an already-stopped service is a no-op with a
   * warning.
   *
   * Requests cancellation of an in-progress startup and waits for it to settle
   * before cleaning up.
   *
   * @returns A promise that resolves when the service has successfully stopped
   */
  async stop(): Promise<void> {
    if (this._state === 'stopped') {
      logger.warn(`Service is not started`);
      return;
    }

    if (this._state === 'stopping') {
      await this.stopPromise;
      return;
    }

    const startPromise = this.startPromise;
    this._state = 'stopping';
    this.startAbortController?.abort();

    const stopPromise = (async () => {
      if (startPromise) {
        try {
          await startPromise;
        } catch {
          // Continue with cleanup after startup cancellation or failure.
        }
      }

      try {
        await this.doStop();
        this._state = 'stopped';
      } catch (error) {
        this._state = 'failed';
        throw error;
      }
    })();
    this.stopPromise = stopPromise;

    try {
      await stopPromise;
    } finally {
      this.stopPromise = null;
    }
  }
}
