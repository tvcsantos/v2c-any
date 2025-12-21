import { type MqttProvider, mqttProviderSchema } from './mqtt-configuration.js';
import { type RestProvider, restProviderSchema } from './rest-configuration.js';
import z from 'zod';

export const configurationSchema = z.discriminatedUnion('provider', [
  restProviderSchema,
  mqttProviderSchema,
]);

export type Configuration = RestProvider | MqttProvider;

export type EnergyType = 'grid' | 'solar';
