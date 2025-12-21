import type { EnergyType } from '../schema/configuration.js';

export function idToEnergyType(id: number): EnergyType {
  switch (id) {
    case 0:
      return 'grid';
    case 1:
      return 'solar';
    default:
      throw new Error(`Unknown energy type id: ${id}`);
  }
}

export function energyTypeToId(type: EnergyType): number {
  switch (type) {
    case 'grid':
      return 0;
    case 'solar':
      return 1;
  }
}
