import type { Provider } from '../provider/provider.js';
import type { CallbackProperties } from '../utils/callback-properties.js';
import { logger } from '../utils/logger.js';
import { Triggerable } from './triggerable.js';

/**
 * Triggerable service that fetches data from a provider and pushes it to a callback.
 * Implements the Triggerable interface to allow external control of when data is fetched.
 * This service is stateless and performs no background operations on its own.
 *
 * @template Payload - The type of data provided and pushed to the callback
 */
export class PullPushTriggerableService<Payload> implements Triggerable {
  /**
   * Creates a new pull-push triggerable service.
   * @param provider - Source provider that supplies data when triggered
   * @param callbackProperties - Callback container invoked with fetched data
   */
  constructor(
    private readonly provider: Provider<Payload>,
    private readonly callbackProperties: CallbackProperties<Payload>
  ) {}

  /**
   * Triggers a data fetch and push cycle.
   * Retrieves data from the provider and forwards it to the callback if data is present.
   * @returns A promise that resolves when the data has been fetched and pushed
   */
  async trigger(): Promise<void> {
    const data = await this.provider.get();
    if (data) {
      logger.debug({ data }, 'Pushing data');
      await this.callbackProperties.callback(data);
    }
  }
}
