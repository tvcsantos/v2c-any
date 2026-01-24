import type { Adapter } from '../../adapter/adapter.js';
import type { EnergyInformation } from '../../schema/mqtt-configuration.js';

export type NotificationFrame<T> = {
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

export type EM1NotifyStatus = {
  ts: number;
  'em1:1'?: EM1StatusParam;
};

export class EnergyInformationEM1NotifyStatusAdapter implements Adapter<
  NotificationFrame<EM1NotifyStatus>,
  EnergyInformation | undefined
> {
  adapt(
    input: NotificationFrame<EM1NotifyStatus>
  ): Promise<EnergyInformation | undefined> {
    const em1Status = input.params['em1:1'];
    if (em1Status !== undefined) {
      return Promise.resolve({ power: em1Status.act_power });
    }
    return Promise.resolve(undefined);
  }
}

export const energyInformationEM1NotifyStatusAdapter =
  new EnergyInformationEM1NotifyStatusAdapter();
