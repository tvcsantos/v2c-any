import type { Factory } from './factory.js';
import type { Provider } from './provider.js';

/**
 * Type alias for a factory that creates Provider instances.
 * Extends the generic Factory interface to specialize it for provider creation.
 *
 * @template Options - The configuration options type required to create a provider
 * @template T - The type of data the created providers will supply
 */
export type ProviderFactory<Options, T> = Factory<Options, Provider<T>>;
