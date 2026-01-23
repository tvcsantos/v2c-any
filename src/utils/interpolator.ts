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
