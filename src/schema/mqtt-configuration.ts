import z from 'zod';
import {
  breakerScehema,
  emaSchema,
  retrySchema,
} from './common-configuration.js';

export const energyInformationSchema = z.object({
  power: z.number(),
});

export const mqttPushBridgeFeedSchema = z
  .object({
    url: z.string(),
    username: z.string().optional(),
    password: z.string().optional(),
    device: z.string(),
    topic: z.string(),
  })
  .loose();

export const mqttPushFeedSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('bridge'),
    properties: mqttPushBridgeFeedSchema,
  }),
  z.object({ type: z.literal('off') }),
]);

export const mqttPullMockFeedSchema = z
  .object({
    interval: z.number().int().nonnegative(),
    value: energyInformationSchema.optional(),
  })
  .loose();

export const mqttPullHttpAdapterFeedSchema = z
  .object({
    interval: z.number().int().nonnegative(),
    device: z.string(),
    host: z.string(),
    protocol: z.enum(['http', 'https']).default('http'),
    port: z.number().int().min(1).max(65535).default(80),
    breaker: breakerScehema.optional(),
    retry: retrySchema.optional(),
    ema: emaSchema.optional(),
  })
  .loose();

export const mqttPullRpcMqttAdapterFeedSchema = z
  .object({
    id: z.string(),
    interval: z.number().int().nonnegative(),
    device: z.string(),
    url: z.string(),
    username: z.string().optional(),
    password: z.string().optional(),
    topic: z.string(),
  })
  .loose();

export const mqttPullFeedSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('http-adapter'),
    properties: mqttPullHttpAdapterFeedSchema,
  }),
  z.object({
    type: z.literal('rpc-mqtt-adapter'),
    properties: mqttPullRpcMqttAdapterFeedSchema,
  }),
  z.object({
    type: z.literal('mock'),
    properties: mqttPullMockFeedSchema,
  }),
  z.object({ type: z.literal('off') }),
]);

export const mqttFeedModeSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('pull'),
    feed: mqttPullFeedSchema,
  }),
  z.object({
    mode: z.literal('push'),
    feed: mqttPushFeedSchema,
  }),
]);

export const mqttMetersSchema = z.object({
  grid: mqttFeedModeSchema,
  solar: mqttFeedModeSchema,
});

export const mqttProviderSchema = z.object({
  provider: z.literal('mqtt'),
  properties: z.object({
    url: z.string(),
    username: z.string().optional(),
    password: z.string().optional(),
    meters: mqttMetersSchema,
  }),
});

export type EnergyInformation = z.infer<typeof energyInformationSchema>;

export type MqttProvider = z.infer<typeof mqttProviderSchema>;

export type MqttMeters = z.infer<typeof mqttMetersSchema>;

export type MqttFeedMode = z.infer<typeof mqttFeedModeSchema>;

export type MqttPullFeed = z.infer<typeof mqttPullFeedSchema>;

export type MqttPullHttpAdapterFeed = z.infer<
  typeof mqttPullHttpAdapterFeedSchema
>;

export type MqttPullRpcMqttAdapterFeed = z.infer<
  typeof mqttPullRpcMqttAdapterFeedSchema
>;

export type MqttPullMockFeed = z.infer<typeof mqttPullMockFeedSchema>;

export type MqttPushFeed = z.infer<typeof mqttPushFeedSchema>;

export type MqttPushBridgeFeed = z.infer<typeof mqttPushBridgeFeedSchema>;
