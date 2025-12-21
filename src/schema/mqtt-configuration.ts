import z from 'zod';

export const energyInformationSchema = z.object({
  power: z.number(),
});

export const mqttPushBridgeFeedSchema = z
  .object({
    url: z.string(),
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
  .object({ value: energyInformationSchema.optional() })
  .loose();

export const mqttPullAdapterFeedSchema = z
  .object({ targetIp: z.string() })
  .loose();

export const mqttPullFeedSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('adapter'),
    properties: mqttPullAdapterFeedSchema,
  }),
  z.object({
    type: z.literal('mock'),
    properties: mqttPullMockFeedSchema.optional(),
  }),
  z.object({ type: z.literal('off') }),
]);

export const mqttFeedModeSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('pull'),
    interval: z.number().int().nonnegative(),
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
    device: z.string(),
    meters: mqttMetersSchema,
  }),
});

export type EnergyInformation = z.infer<typeof energyInformationSchema>;

export type MqttProvider = z.infer<typeof mqttProviderSchema>;

export type MqttMeters = z.infer<typeof mqttMetersSchema>;

export type MqttFeedMode = z.infer<typeof mqttFeedModeSchema>;

export type MqttPullFeed = z.infer<typeof mqttPullFeedSchema>;

export type MqttPullAdapterFeed = z.infer<typeof mqttPullAdapterFeedSchema>;

export type MqttPullMockFeed = z.infer<typeof mqttPullMockFeedSchema>;

export type MqttPushFeed = z.infer<typeof mqttPushFeedSchema>;

export type MqttPushBridgeFeed = z.infer<typeof mqttPushBridgeFeedSchema>;
