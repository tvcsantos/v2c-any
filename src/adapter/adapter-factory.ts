import { Factory } from '../provider/factory.js';
import { Adapter } from './adapter.js';

/**
 * Type alias for a factory that creates Adapter instances.
 * Extends the generic Factory interface to specialize it for adapter creation,
 * enabling the production of data transformation components with specific input and output types.
 *
 * @template Options - The configuration options type required to create an adapter
 * @template T - The input type to be adapted
 * @template K - The output type after adaptation
 */
export type AdapterFactory<Options, T, K> = Factory<Options, Adapter<T, K>>;
