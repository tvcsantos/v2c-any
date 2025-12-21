import { cosmiconfig } from 'cosmiconfig';
import { logger } from '../utils/logger.js';
/**
 * Loads and merges v2ca configuration from various sources (.v2carc, v2ca.config.js, package.json).
 * Uses cosmiconfig for auto-discovery and merges user config with defaults.
 */
export class ConfigurationLoader {
    /**
     * Creates a new configuration loader.
     * @param configurationValidator - Validator to ensure configuration integrity
     */
    constructor(configurationValidator) {
        this.configurationValidator = configurationValidator;
        // Initialize cosmiconfig explorer once for reuse across multiple loads
        this.explorer = cosmiconfig('v2ca');
    }
    /**
     * Loads and validates the v2ca configuration.
     * @returns A promise that resolves to the fully merged and validated configuration
     * @throws {Error} If configuration loading or validation fails
     */
    async load() {
        try {
            logger.info('Searching for v2ca configuration...');
            // Search for config in standard locations
            const result = await this.explorer.search();
            let config;
            if (result?.config) {
                // Configuration found - merge, validate, and use it
                const configSource = result.filepath
                    ? `from ${result.filepath}`
                    : 'from package.json';
                logger.info(`Configuration loaded ${configSource}`);
                config = this.configurationValidator.validate(result.config);
            }
            else {
                // No configuration found - use defaults
                logger.info('No configuration found');
                throw new Error('No configuration found for v2ca.');
            }
            logger.info('Configuration loaded successfully');
            return config;
        }
        catch (error) {
            // Wrap any errors with context for better debugging
            // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
            throw new Error(`Failed to load configuration: ${error}`);
        }
    }
}
