import { AdapterFactory } from '../../adapter/adapter-factory.js';
import { Adapter } from '../../adapter/adapter.js';
import { EnergyInformation } from '../../schema/mqtt-configuration.js';
import { EM1Status } from '../../schema/rest-configuration.js';
import { RpcResponseFrame } from '../../utils/rpc.js';

/**
 * Adapter for transforming EM1.GetStatus RPC responses into energy information.
 * Extracts active power from the RPC response and converts it to the standardized format.
 */
class EM1GetStatusRpcResponseAdapter implements Adapter<
  RpcResponseFrame<EM1Status>,
  EnergyInformation | undefined
> {
  /**
   * Transforms an EM1.GetStatus RPC response into energy information.
   * @param input - The RPC response frame containing EM1 status data
   * @returns A promise resolving to energy information with power data, or undefined if no active power is available
   */
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

/**
 * Factory for creating EM1GetStatusRpcResponseAdapter instances.
 * Implements the factory pattern for RPC response adapter creation.
 */
class EM1GetStatusRpcResponseAdapterFactory implements AdapterFactory<
  unknown,
  RpcResponseFrame<EM1Status>,
  EnergyInformation | undefined
> {
  /**
   * Creates a new EM1GetStatusRpcResponseAdapter.
   * @returns A configured adapter for EM1.GetStatus RPC responses
   */
  create(): Adapter<
    RpcResponseFrame<EM1Status>,
    EnergyInformation | undefined
  > {
    return new EM1GetStatusRpcResponseAdapter();
  }
}

/**
 * Singleton instance of EM1GetStatusRpcResponseAdapterFactory.
 * Used throughout the application for creating EM1 GetStatus RPC response adapters.
 */
export const em1GetStatusRpcResponseAdapterFactory =
  new EM1GetStatusRpcResponseAdapterFactory();
