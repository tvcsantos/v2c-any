import { mqttProviderSchema } from './mqtt-configuration.js';
import { restProviderSchema } from './rest-configuration.js';
import z from 'zod';
export const configurationSchema = z.discriminatedUnion('provider', [
    restProviderSchema,
    mqttProviderSchema,
]);
