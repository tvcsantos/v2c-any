import { RpcMqttRequestProviderFactory } from '../../provider/provider-factory.js';
import { EnergyType } from '../../schema/configuration.js';
import { RpcMqttRequestProvider } from '../../service/rpc-mqtt-push-service.js';
import { energyTypeToId } from '../../utils/mappers.js';

/**
 * RPC request structure for EM1.GetStatus method.
 * Represents a request to retrieve the status of a specific EM1 energy monitor.
 */
type EM1GetStatusRpcRequest = {
  id: number;
  src: string;
  method: 'EM1.GetStatus';
  params: {
    id: number;
  };
};

/**
 * Provider for generating EM1.GetStatus RPC requests.
 * Manages request generation with auto-incrementing IDs for a specific EM1 energy monitor.
 */
class EM1GetStatusRpcRequestProvider implements RpcMqttRequestProvider<EM1GetStatusRpcRequest> {
  /** EM1 device ID derived from energy type */
  private id: number;

  /** Source path for the device messages */
  readonly src: string;

  /** Counter for generating unique request IDs */
  private requestCount = 0;

  /**
   * Creates a new EM1 GetStatus RPC request provider.
   * @param energyType - The energy type to monitor (import, export, etc.)
   * @param deviceId - The unique identifier of the Shelly device
   */
  constructor(energyType: EnergyType, deviceId: string) {
    this.id = energyTypeToId(energyType);
    this.src = `devices/${deviceId}/messages/events`;
  }

  /**
   * Gets the MQTT topic for RPC requests.
   * @returns The full RPC topic path
   */
  get topic(): string {
    return `${this.src}/rpc`;
  }

  /**
   * Generates a new EM1.GetStatus RPC request with an incremented ID.
   * @returns A promise resolving to the RPC request structure
   */
  get(): Promise<EM1GetStatusRpcRequest> {
    const request: EM1GetStatusRpcRequest = {
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

/**
 * Configuration options for creating an EM1GetStatusRpcRequestProvider.
 */
type EM1GetStatusRpcRequestProviderFactoryOptions = {
  energyType: EnergyType;
  properties: {
    id: string;
  };
};

/**
 * Factory for creating EM1GetStatusRpcRequestProvider instances.
 * Implements the factory pattern for RPC MQTT request provider creation.
 */
export class EM1GetStatusRpcRequestProviderFactory implements RpcMqttRequestProviderFactory<
  EM1GetStatusRpcRequestProviderFactoryOptions,
  EM1GetStatusRpcRequest
> {
  /**
   * Creates a new EM1GetStatusRpcRequestProvider with the specified configuration.
   * @param options - Configuration containing energy type and device properties
   * @returns A configured RPC MQTT request provider for EM1.GetStatus requests
   */
  create(
    options: EM1GetStatusRpcRequestProviderFactoryOptions
  ): RpcMqttRequestProvider<EM1GetStatusRpcRequest> {
    return new EM1GetStatusRpcRequestProvider(
      options.energyType,
      options.properties.id
    );
  }
}

/**
 * Singleton instance of EM1GetStatusRpcRequestProviderFactory.
 * Used throughout the application for creating EM1 GetStatus RPC request providers.
 */
export const em1GetStatusRpcRequestProviderFactory =
  new EM1GetStatusRpcRequestProviderFactory();
