import { logger } from '../utils/logger.js';
import { AbstractExecutableService } from './abstract-executable-service.js';
/**
 * Periodic pull-then-push service.
 * Fetches data from a `Provider` at a fixed interval and forwards it via a callback.
 * Implements start/stop lifecycle control.
 *
 * @template Payload - The type of data provided and pushed
 */
export class PullPushService extends AbstractExecutableService {
    /**
     * Creates a new pull/push service.
     * @param provider - Source `Provider` that supplies data
     * @param intervalMs - Polling interval in milliseconds
     * @param callbackProperties - Callback container invoked with fetched data
     */
    constructor(provider, intervalMs, callbackProperties) {
        super();
        this.provider = provider;
        this.intervalMs = intervalMs;
        this.callbackProperties = callbackProperties;
        this.abortController = null;
    }
    /**
     * Starts periodic polling and an immediate initial cycle.
     * @returns A promise that resolves once the service starts
     * @throws {Error} If the service is already started
     */
    doStart() {
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
    doStop() {
        this.abortController?.abort();
        this.abortController = null;
        return Promise.resolve();
    }
    /**
     * Main async loop that runs cycles until aborted.
     * @param signal - AbortSignal to control loop cancellation
     */
    async run(signal) {
        // Create a single abort promise that resolves when signal is aborted
        const abortPromise = new Promise((resolve) => {
            signal.addEventListener('abort', () => resolve(), { once: true });
        });
        while (!signal.aborted) {
            try {
                await this.cycle();
            }
            catch (err) {
                logger.error(err, 'Error during pull-push cycle');
            }
            // Wait for either the interval or abort signal
            if (!signal.aborted) {
                const timeoutPromise = new Promise((resolve) => {
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
    async cycle() {
        const data = await this.provider.get();
        if (data) {
            logger.info({ data }, 'Pushing data');
            await this.callbackProperties.callback(data);
        }
    }
}
