import { AdapterFactory } from '../../adapter/adapter-factory.js';
import type { Adapter } from '../../adapter/adapter.js';
import { RcpMqttRequestProviderFactory } from '../../provider/provider-factory.js';
import { EnergyType } from '../../schema/configuration.js';
import type { EnergyInformation } from '../../schema/mqtt-configuration.js';
import { EM1Status } from '../../schema/rest-configuration.js';
import { RpcMqttRequestProvider } from '../../service/rpc-mqtt-push-service.js';
import { energyTypeToId } from '../../utils/mappers.js';

/**
 * Generic notification frame structure from Shelly devices.
 * Encapsulates the RPC notification message format with source, destination, method, and parameters.
 *
 * @template T - The type of the notification parameters
 */
type NotificationFrame<T> = {
  /** Source identifier of the notification */
  src: string;
  /** Destination identifier of the notification */
  dst: string;
  /** RPC method name being notified */
  method: string;
  /** Notification parameters of type T */
  params: T;
};

/**
 * Status parameters for a single EM1 energy meter channel.
 * Contains real-time electrical measurements from the Shelly Pro EM device.
 */
type EM1StatusParam = {
  /** Active power in watts (W) */
  act_power: number;
  /** Apparent power in volt-amperes (VA) */
  aprt_power: number;
  /** Current in amperes (A) */
  current: number;
  /** Frequency in hertz (Hz) */
  freq: number;
  /** Power factor (dimensionless, typically -1 to 1) */
  pf: number;
  /** Voltage in volts (V) */
  voltage: number;
};

/**
 * Notification status payload for Shelly Pro EM1 device.
 * Contains timestamp and optional status data for up to two energy meter channels.
 */
type EM1NotifyStatus = {
  /** Unix timestamp in seconds when the status was captured */
  ts: number;
  /** Status parameters for energy meter channel 0 (grid) */
  'em1:0'?: EM1StatusParam;
  /** Status parameters for energy meter channel 1 (solar) */
  'em1:1'?: EM1StatusParam;
};

/**
 * Adapter for transforming Shelly Pro EM1 NotifyStatus notifications into energy information.
 * Extracts active power data from the appropriate EM1 channel based on the configured energy type.
 */
class EnergyInformationEM1NotifyStatusAdapter implements Adapter<
  NotificationFrame<EM1NotifyStatus>,
  EnergyInformation | undefined
> {
  /** The EM1 channel ID (0 or 1) corresponding to the energy type */
  private id: number;

  /**
   * Creates a new EM1 NotifyStatus adapter for a specific energy type.
   * @param energyType - The type of energy (grid or solar) to extract from notifications
   */
  constructor(energyType: EnergyType) {
    this.id = energyTypeToId(energyType);
  }

  /**
   * Adapts an EM1 NotifyStatus notification frame into energy information.
   * Extracts the active power from the configured EM1 channel.
   *
   * @param input - The notification frame containing EM1 status data
   * @returns A promise resolving to energy information with power value, or undefined if the channel data is not present
   */
  adapt(
    input: NotificationFrame<EM1NotifyStatus>
  ): Promise<EnergyInformation | undefined> {
    const key = `em1:${this.id}` as keyof Pick<
      EM1NotifyStatus,
      'em1:1' | 'em1:0'
    >;
    const em1Status = input.params[key];
    if (em1Status !== undefined) {
      return Promise.resolve({ power: em1Status.act_power });
    }
    return Promise.resolve(undefined);
  }
}

/**
 * Configuration options for creating an EM1NotifyStatusAdapter instance.
 */
type EM1NotifyStatusAdapterOptions = {
  /** The type of energy (grid or solar) to configure the adapter for */
  energyType: EnergyType;
};

/**
 * Factory for creating EnergyInformationEM1NotifyStatusAdapter instances.
 * Implements the AdapterFactory pattern to produce adapters configured for specific energy types.
 */
class EnergyInformationEM1NotifyStatusAdapterFactory implements AdapterFactory<
  EM1NotifyStatusAdapterOptions,
  NotificationFrame<EM1NotifyStatus>,
  EnergyInformation | undefined
> {
  /**
   * Creates a new EM1 NotifyStatus adapter configured for the specified energy type.
   *
   * @param options - Configuration options specifying the energy type
   * @returns An adapter that transforms EM1 NotifyStatus notifications into energy information
   */
  create(
    options: EM1NotifyStatusAdapterOptions
  ): Adapter<
    NotificationFrame<EM1NotifyStatus>,
    EnergyInformation | undefined
  > {
    return new EnergyInformationEM1NotifyStatusAdapter(options.energyType);
  }
}

/**
 * Singleton instance of the EM1 NotifyStatus adapter factory.
 * Used to create adapters for transforming Shelly Pro EM NotifyStatus notifications into energy information.
 */
export const energyInformationEM1NotifyStatusAdapterFactory =
  new EnergyInformationEM1NotifyStatusAdapterFactory();

type EM1GetStatusRequest = {
  id: number;
  src: string;
  method: 'EM1.GetStatus';
  params: {
    id: number;
  };
};

class EM1GetStatusRequestProvider implements RpcMqttRequestProvider<EM1GetStatusRequest> {
  private id: number;
  readonly src: string;
  private requestCount = 0;

  constructor(energyType: EnergyType, deviceId: string) {
    this.id = energyTypeToId(energyType);
    this.src = `devices/${deviceId}/messages/events`;
  }

  get topic(): string {
    return `${this.src}/rpc`;
  }

  get(): Promise<EM1GetStatusRequest> {
    const request: EM1GetStatusRequest = {
      id: this.requestCount++,
      src: this.src,
      method: 'EM1.GetStatus',
      params: {
        id: this.id,
      },
    };
    return Promise.resolve(request);
  }
}

type EM1GetStatusRequestProviderFactoryOptions = {
  energyType: EnergyType;
  properties: {
    id: string;
  };
};

export class EM1GetStatusRequestProviderFactory implements RcpMqttRequestProviderFactory<
  EM1GetStatusRequestProviderFactoryOptions,
  EM1GetStatusRequest
> {
  create(
    options: EM1GetStatusRequestProviderFactoryOptions
  ): RpcMqttRequestProvider<EM1GetStatusRequest> {
    return new EM1GetStatusRequestProvider(
      options.energyType,
      options.properties.id
    );
  }
}

export const em1GetStatusRequestProviderFactory =
  new EM1GetStatusRequestProviderFactory();

type RpcResponseFrame<T> = {
  id: number;
  src: string;
  dst: string;
  result: T;
};

class EM1GetStatusRpcResponseAdapter implements Adapter<
  RpcResponseFrame<EM1Status>,
  EnergyInformation | undefined
> {
  adapt(
    input: RpcResponseFrame<EM1Status>
  ): Promise<EnergyInformation | undefined> {
    const em1Status = input.result;
    if (em1Status.act_power !== undefined) {
      return Promise.resolve({ power: em1Status.act_power });
    }
    return Promise.resolve(undefined);
  }
}

export class EM1GetStatusRpcResponseAdapterFactory implements AdapterFactory<
  unknown,
  RpcResponseFrame<EM1Status>,
  EnergyInformation | undefined
> {
  create(): Adapter<
    RpcResponseFrame<EM1Status>,
    EnergyInformation | undefined
  > {
    return new EM1GetStatusRpcResponseAdapter();
  }
}

export const em1GetStatusRpcResponseAdapterFactory =
  new EM1GetStatusRpcResponseAdapterFactory();
