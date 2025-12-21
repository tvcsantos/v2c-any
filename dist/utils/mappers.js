export function idToEnergyType(id) {
    switch (id) {
        case 0:
            return 'grid';
        case 1:
            return 'solar';
        default:
            throw new Error(`Unknown energy type id: ${id}`);
    }
}
export function energyTypeToId(type) {
    switch (type) {
        case 'grid':
            return 0;
        case 'solar':
            return 1;
    }
}
