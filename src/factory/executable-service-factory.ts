import type { Factory } from '../provider/factory.js';
import type { ExecutableService } from '../service/executable-service.js';

/**
 * Type alias for a factory that creates ExecutableService instances.
 * Extends the generic Factory interface to specialize it for executable service creation.
 *
 * @template Configuration - The configuration type required to create an executable service
 */
export type ExecutableServiceFactory<Configuration> = Factory<
  Configuration,
  ExecutableService
>;
