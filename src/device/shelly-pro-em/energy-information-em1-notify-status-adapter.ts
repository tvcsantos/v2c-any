import { AdapterFactory } from '../../adapter/adapter-factory.js';
import type { Adapter } from '../../adapter/adapter.js';
import { EnergyType } from '../../schema/configuration.js';
import type { EnergyInformation } from '../../schema/mqtt-configuration.js';
import { energyTypeToId } from '../../utils/mappers.js';

type NotificationFrame<T> = {
  src: string;
  dst: string;
  method: string;
  params: T;
};

type EM1StatusParam = {
  act_power: number;
  aprt_power: number;
  current: number;
  freq: number;
  pf: number;
  voltage: number;
};

type EM1NotifyStatus = {
  ts: number;
  'em1:0'?: EM1StatusParam;
  'em1:1'?: EM1StatusParam;
};

class EnergyInformationEM1NotifyStatusAdapter implements Adapter<
  NotificationFrame<EM1NotifyStatus>,
  EnergyInformation | undefined
> {
  private id: number;

  constructor(energyType: EnergyType) {
    this.id = energyTypeToId(energyType);
  }

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
  energyType: EnergyType;
};

class EnergyInformationEM1NotifyStatusAdapterFactory implements AdapterFactory<
  EM1NotifyStatusAdapterOptions,
  NotificationFrame<EM1NotifyStatus>,
  EnergyInformation | undefined
> {
  create(
    options: EM1NotifyStatusAdapterOptions
  ): Adapter<
    NotificationFrame<EM1NotifyStatus>,
    EnergyInformation | undefined
  > {
    return new EnergyInformationEM1NotifyStatusAdapter(options.energyType);
  }
}

export const energyInformationEM1NotifyStatusAdapterFactory =
  new EnergyInformationEM1NotifyStatusAdapterFactory();
