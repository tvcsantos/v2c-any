import { Factory } from '../provider/factory.js';
import { Adapter } from './adapter.js';

export type AdapterFactory<Options, T, K> = Factory<Options, Adapter<T, K>>;
