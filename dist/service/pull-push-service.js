import { logger } from '../utils/logger.js';
/**
 * Periodic pull-then-push service.
 * Fetches data from a `Provider` at a fixed interval and forwards it via a callback.
 * Implements start/stop lifecycle control.
 *
 * @template Payload - The type of data provided and pushed
 */
export class PullPushService {
    /**
     * Creates a new pull/push service.
     * @param provider - Source `Provider` that supplies data
     * @param intervalMs - Polling interval in milliseconds
     * @param callbackProperties - Callback container invoked with fetched data
     */
    constructor(provider, intervalMs, callbackProperties) {
        this.provider = provider;
        this.intervalMs = intervalMs;
        this.callbackProperties = callbackProperties;
        this.timer = null;
    }
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
    async cycle() {
        const data = await this.provider.get();
        if (data) {
            logger.info(`Pushing data: ${JSON.stringify(data)}`);
            await this.callbackProperties.callback(data);
        }
    }
}
