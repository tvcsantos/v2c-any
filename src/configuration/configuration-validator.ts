import {
  type Configuration,
  configurationSchema,
} from '../schema/configuration.js';
import { logger } from '../utils/logger.js';

/**
 * Validates v2ca configuration against Zod schema for type safety and
 * correctness.
 *
 * Ensures all configuration values conform to expected types and constraints,
 * providing detailed error messages for any validation failures.
 */
export class ConfigurationValidator {
  /**
   * Validates configuration against the schema and returns the validated
   * result.
   *
   * @param config - Configuration object to validate
   * @returns Validated and typed configuration object
   * @throws {Error} If validation fails, with detailed error information
   */
  validate(config: unknown): Configuration {
    logger.info('Validating configuration...');

    const result = configurationSchema.safeParse(config);
    if (!result.success) {
      const errors = result.error.issues
        .map((e) => `${e.path.join('.')}:${e.message}`)
        .join(', ');

      logger.error(`Configuration validation failed: ${errors}`);

      throw new Error(`Configuration validation failed: ${errors}`);
    }

    logger.info('Configuration validated successfully');

    return result.data;
  }
}
