import { request } from 'undici';
import { logger } from '../../utils/logger.js';
import { energyTypeToId } from '../../utils/mappers.js';
/**
 * Provider that fetches EM1 status data from a Shelly Pro EM device via HTTP.
 * Retrieves real-time energy monitoring data by querying the device's RPC API endpoint.
 */
export class EM1StatusProvider {
    /**
     * Creates a new EM1 status provider.
     * @param host - The IP address or hostname of the Shelly Pro EM device
     * @param energyType - The type of energy data to retrieve (e.g., active, reactive)
     */
    constructor(host, energyType) {
        this.host = host;
        this.energyType = energyType;
    }
    /**
     * Fetches the current EM1 status from the device.
     * @returns A promise that resolves to the EM1 status object containing energy metrics
     * @throws {Error} If the HTTP request fails or returns invalid data
     */
    async get() {
        logger.debug({ host: this.host, energyType: this.energyType }, 'Fetching EM1Status');
        const id = energyTypeToId(this.energyType);
        const res = await request(`http://${this.host}/rpc/EM1.GetStatus?id=${id}`, { method: 'GET' });
        return (await res.body.json());
    }
}
/**
 * Factory for creating EM1StatusProvider instances.
 * Implements the factory pattern to instantiate providers with the appropriate configuration.
 */
class EM1StatusProviderFactory {
    /**
     * Creates a new EM1StatusProvider instance with the specified configuration.
     * @param options - Configuration options including target IP and energy type
     * @returns A configured EM1StatusProvider instance
     */
    create(options) {
        logger.debug({ ip: options.properties.ip, energyType: options.energyType }, 'Creating EM1StatusProvider');
        return new EM1StatusProvider(options.properties.ip, options.energyType);
    }
}
/**
 * Singleton factory instance for creating `EM1StatusProvider` objects.
 * Provides a ready-to-use factory to build providers with supplied options.
 */
export const em1StatusProviderFactory = new EM1StatusProviderFactory();
