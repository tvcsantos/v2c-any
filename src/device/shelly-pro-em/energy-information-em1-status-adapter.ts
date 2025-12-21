import type { Adapter } from '../../adapter/adapter.js';
import type { EnergyInformation } from '../../schema/mqtt-configuration.js';
import type { EM1Status } from '../../schema/rest-configuration.js';

/**
 * Adapter that transforms EM1Status data into EnergyInformation format.
 * Extracts active power metrics from Shelly Pro EM device status and converts them
 * to a standardized energy information structure.
 */
class EnergyInformationEM1StatusAdapter implements Adapter<
  EM1Status,
  EnergyInformation | undefined
> {
  /**
   * Adapts EM1 status data to energy information.
   * Extracts the active power value if available, otherwise returns undefined.
   * @param input - The EM1Status object containing device status data
   * @returns A promise that resolves to EnergyInformation with power data, or undefined if power data is unavailable
   */
  adapt(input: EM1Status): Promise<EnergyInformation | undefined> {
    if (input.act_power !== undefined) {
      return Promise.resolve({ power: input.act_power });
    }
    return Promise.resolve(undefined);
  }
}

/**
 * Singleton adapter instance for converting `EM1Status` to `EnergyInformation`.
 * Use this ready-to-use instance where an adapter object is required.
 */
export const energyInformationEM1StatusAdapter =
  new EnergyInformationEM1StatusAdapter();
