import { Interpolator, Interpolators } from '../provider/interpolator.js';
import { EM1Status } from '../schema/rest-configuration.js';

export const em1StatusInterpolator: Interpolator<EM1Status> =
  Interpolators.object<EM1Status>({
    id: Interpolators.identity(),
    calibration: Interpolators.identity(),
    current: Interpolators.number(),
    voltage: Interpolators.number(),
    act_power: Interpolators.number(),
    aprt_power: Interpolators.number(),
    pf: Interpolators.number(),
    freq: Interpolators.number(),
    errors: Interpolators.identity(),
    flags: Interpolators.identity(),
  });

export const em1StatusComparator = (a: EM1Status, b: EM1Status): number => {
  const powerA = a.act_power ?? 0;
  const powerB = b.act_power ?? 0;
  return powerA - powerB;
};

export const em1StatusZeroValue: EM1Status = {
  id: 0,
  calibration: '',
  current: 0,
  voltage: 0,
  act_power: 0,
  aprt_power: 0,
  pf: 0,
  freq: 0,
  errors: [],
  flags: [],
};
