import { cosmiconfig, type PublicExplorer } from 'cosmiconfig';
import type { ConfigurationValidator } from './configuration-validator.js';
import { logger } from '../utils/logger.js';
import type { Configuration } from '../schema/configuration.js';

/**
 * Loads v2ca configuration from JSON or YAML files.
 * Uses cosmiconfig for auto-discovery.
 */
export class ConfigurationLoader {
  private readonly explorer: PublicExplorer;

  /**
   * Creates a new configuration loader.
   * @param configurationValidator - Validator to ensure configuration
   * integrity
   */
  constructor(private readonly configurationValidator: ConfigurationValidator) {
    // Initialize cosmiconfig explorer once for reuse across multiple loads
    this.explorer = cosmiconfig('v2ca', {
      searchStrategy: 'none',
      searchPlaces: [
        '.v2carc.json',
        '.v2carc.yaml',
        '.v2carc.yml',
        '.config/v2carc.json',
        '.config/v2carc.yaml',
        '.config/v2carc.yml',
      ],
    });
  }

  /**
   * Loads and validates the v2ca configuration.
   * @returns A promise that resolves to the fully merged and validated
   * configuration
   * @throws {Error} If configuration loading or validation fails
   */
  async load(): Promise<Configuration> {
    try {
      logger.info('Searching for configuration...');

      // Search for config in standard locations
      const result = await this.explorer.search();

      let config: Configuration;

      if (result?.config) {
        // Configuration found - validate, and use it
        logger.info({ source: result.filepath }, 'Configuration loaded');
        config = this.configurationValidator.validate(result.config);
      } else {
        // No configuration found - throw an error
        logger.error('No configuration found');
        throw new Error('No configuration found');
      }

      logger.info('Configuration loaded successfully');

      return config;
    } catch (error) {
      // Wrap any errors with context for better debugging
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      throw new Error(`Failed to load configuration: ${error}`, {
        cause: error,
      });
    }
  }
}
