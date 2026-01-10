// VALORANT map configuration using official valorant-api.com multipliers
//
// Coordinate Conversion Formula (IMPORTANT - coordinates are SWAPPED):
//   minimapX = gameY * xMultiplier + xScalarToAdd
//   minimapY = gameX * yMultiplier + yScalarToAdd
//
// The X and Y coordinates from GRID data must be swapped before applying multipliers

export interface MapMultipliers {
  xMultiplier: number;
  yMultiplier: number;
  xScalarToAdd: number;
  yScalarToAdd: number;
}

export interface Callout {
  name: string;
  superRegion: string;
  // Normalized position (0-1) on the minimap image
  screenX: number;
  screenY: number;
}

export interface MapConfig {
  displayName: string;
  uuid: string;
  image: string;
  // Official valorant-api.com multipliers for coordinate conversion
  multipliers: MapMultipliers;
  // Site callouts with pre-calculated minimap positions
  callouts: Callout[];
}

// Map configurations with official valorant-api.com multipliers
export const MAP_CONFIGS: Record<string, MapConfig> = {
  ascent: {
    displayName: 'Ascent',
    uuid: '7eaecc1b-4337-bbf6-6ab9-04b8f06b3319',
    image: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png',
    multipliers: {
      xMultiplier: 7e-05,
      yMultiplier: -7e-05,
      xScalarToAdd: 0.813895,
      yScalarToAdd: 0.573242,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.350, screenY: 0.142 },
      { name: 'Site', superRegion: 'B', screenX: 0.285, screenY: 0.737 },
    ],
  },
  split: {
    displayName: 'Split',
    uuid: 'd960549e-485c-e861-8d71-aa9d1aed12a2',
    image: 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png',
    multipliers: {
      xMultiplier: 7.8e-05,
      yMultiplier: -7.8e-05,
      xScalarToAdd: 0.842188,
      yScalarToAdd: 0.697578,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.315, screenY: 0.184 },
      { name: 'Site', superRegion: 'B', screenX: 0.354, screenY: 0.867 },
    ],
  },
  bind: {
    displayName: 'Bind',
    uuid: '2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba',
    image: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png',
    multipliers: {
      xMultiplier: 5.9e-05,
      yMultiplier: -5.9e-05,
      xScalarToAdd: 0.576941,
      yScalarToAdd: 0.967566,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.734, screenY: 0.333 },
      { name: 'Site', superRegion: 'B', screenX: 0.292, screenY: 0.312 },
    ],
  },
  haven: {
    displayName: 'Haven',
    uuid: '2bee0dc9-4ffe-519b-1cbd-7fbe763a6047',
    image: 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png',
    multipliers: {
      xMultiplier: 7.5e-05,
      yMultiplier: -7.5e-05,
      xScalarToAdd: 1.09345,
      yScalarToAdd: 0.642728,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.402, screenY: 0.170 },
      { name: 'Site', superRegion: 'B', screenX: 0.401, screenY: 0.501 },
      { name: 'Site', superRegion: 'C', screenX: 0.418, screenY: 0.821 },
    ],
  },
  breeze: {
    displayName: 'Breeze',
    uuid: '2fb9a4fd-47b8-4e7d-a969-74b4046ebd53',
    image: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png',
    multipliers: {
      xMultiplier: 7e-05,
      yMultiplier: -7e-05,
      xScalarToAdd: 0.465123,
      yScalarToAdd: 0.833078,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.908, screenY: 0.495 },
      { name: 'Site', superRegion: 'B', screenX: 0.070, screenY: 0.382 },
    ],
  },
  icebox: {
    displayName: 'Icebox',
    uuid: 'e2ad5c54-4114-a870-9641-8ea21279579a',
    image: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png',
    multipliers: {
      xMultiplier: 7.2e-05,
      yMultiplier: -7.2e-05,
      xScalarToAdd: 0.460214,
      yScalarToAdd: 0.304687,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.691, screenY: 0.765 },
      { name: 'Site', superRegion: 'B', screenX: 0.646, screenY: 0.180 },
    ],
  },
  fracture: {
    displayName: 'Fracture',
    uuid: 'b529448b-4d60-346e-e89e-00a4c527a405',
    image: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png',
    multipliers: {
      xMultiplier: 7.8e-05,
      yMultiplier: -7.8e-05,
      xScalarToAdd: 0.556952,
      yScalarToAdd: 1.155886,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.820, screenY: 0.522 },
      { name: 'Site', superRegion: 'B', screenX: 0.093, screenY: 0.518 },
    ],
  },
  pearl: {
    displayName: 'Pearl',
    uuid: 'fd267378-4d1d-484f-ff52-77821ed10dc2',
    image: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png',
    multipliers: {
      xMultiplier: 7.8e-05,
      yMultiplier: -7.8e-05,
      xScalarToAdd: 0.480469,
      yScalarToAdd: 0.916016,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.915, screenY: 0.400 },
      { name: 'Site', superRegion: 'B', screenX: 0.258, screenY: 0.464 },
    ],
  },
  lotus: {
    displayName: 'Lotus',
    uuid: '2fe4ed3a-450a-948b-6d6b-e89a78e680a9',
    image: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png',
    multipliers: {
      xMultiplier: 7.2e-05,
      yMultiplier: -7.2e-05,
      xScalarToAdd: 0.454789,
      yScalarToAdd: 0.917752,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.855, screenY: 0.361 },
      { name: 'Site', superRegion: 'B', screenX: 0.503, screenY: 0.459 },
      { name: 'Site', superRegion: 'C', screenX: 0.148, screenY: 0.437 },
    ],
  },
  sunset: {
    displayName: 'Sunset',
    uuid: '92584fbe-486a-b1b2-9faa-39b0f486b498',
    image: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png',
    multipliers: {
      xMultiplier: 7.8e-05,
      yMultiplier: -7.8e-05,
      xScalarToAdd: 0.5,
      yScalarToAdd: 0.515625,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.750, screenY: 0.438 },
      { name: 'Site', superRegion: 'B', screenX: 0.044, screenY: 0.562 },
    ],
  },
  abyss: {
    displayName: 'Abyss',
    uuid: '224b0a95-48b9-f703-1bd8-67aca101a61f',
    image: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png',
    multipliers: {
      xMultiplier: 8.1e-05,
      yMultiplier: -8.1e-05,
      xScalarToAdd: 0.5,
      yScalarToAdd: 0.5,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.484, screenY: 0.152 },
      { name: 'Site', superRegion: 'B', screenX: 0.405, screenY: 0.858 },
    ],
  },
  corrode: {
    displayName: 'Corrode',
    uuid: '1c18ab1f-420d-0d8b-71d0-77ad3c439115',
    image: 'https://media.valorant-api.com/maps/1c18ab1f-420d-0d8b-71d0-77ad3c439115/displayicon.png',
    multipliers: {
      xMultiplier: 7e-05,
      yMultiplier: -7e-05,
      xScalarToAdd: 0.526158,
      yScalarToAdd: 0.5,
    },
    callouts: [
      { name: 'Site', superRegion: 'A', screenX: 0.398, screenY: 0.258 },
      { name: 'Site', superRegion: 'B', screenX: 0.444, screenY: 0.690 },
    ],
  },
};

/**
 * Convert GRID game coordinates to normalized minimap position (0-1)
 * IMPORTANT: X and Y coordinates are SWAPPED in the formula!
 * minimapX = gameY * xMultiplier + xScalarToAdd
 * minimapY = gameX * yMultiplier + yScalarToAdd
 */
export function gridToNormalized(
  gridX: number,
  gridY: number,
  mapName: string
): { x: number; y: number } | null {
  const config = getMapConfig(mapName);
  if (!config) return null;

  const { xMultiplier, yMultiplier, xScalarToAdd, yScalarToAdd } = config.multipliers;

  // SWAP coordinates: gameY -> minimapX, gameX -> minimapY
  const minimapX = gridY * xMultiplier + xScalarToAdd;
  const minimapY = gridX * yMultiplier + yScalarToAdd;

  // Clamp to valid range with small buffer
  const clampedX = Math.max(0.01, Math.min(0.99, minimapX));
  const clampedY = Math.max(0.01, Math.min(0.99, minimapY));

  return { x: clampedX, y: clampedY };
}

/**
 * Convert normalized minimap position (0-1) back to GRID game coordinates
 * This is the inverse of gridToNormalized
 */
export function normalizedToGrid(
  normalizedX: number,
  normalizedY: number,
  mapName: string
): { x: number; y: number } | null {
  const config = getMapConfig(mapName);
  if (!config) return null;

  const { xMultiplier, yMultiplier, xScalarToAdd, yScalarToAdd } = config.multipliers;

  // Inverse of the conversion formula:
  // minimapX = gameY * xMultiplier + xScalarToAdd  =>  gameY = (minimapX - xScalarToAdd) / xMultiplier
  // minimapY = gameX * yMultiplier + yScalarToAdd  =>  gameX = (minimapY - yScalarToAdd) / yMultiplier
  const gameY = (normalizedX - xScalarToAdd) / xMultiplier;
  const gameX = (normalizedY - yScalarToAdd) / yMultiplier;

  return { x: gameX, y: gameY };
}

/**
 * Convert GRID game coordinates to pixel position on map image
 */
export function gridToPixel(
  gridX: number,
  gridY: number,
  mapName: string,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } | null {
  const normalized = gridToNormalized(gridX, gridY, mapName);
  if (!normalized) return null;

  return {
    x: normalized.x * imageWidth,
    y: normalized.y * imageHeight,
  };
}

export function getMapConfig(mapName: string): MapConfig | null {
  const key = mapName.toLowerCase().replace(/[^a-z]/g, '');
  return MAP_CONFIGS[key] || null;
}

export function getCallouts(mapName: string): Callout[] {
  const config = getMapConfig(mapName);
  return config?.callouts || [];
}

export function getMapImage(mapName: string): string | null {
  const config = getMapConfig(mapName);
  return config?.image || null;
}

export function getMapMultipliers(mapName: string): MapMultipliers | null {
  const config = getMapConfig(mapName);
  return config?.multipliers || null;
}

// =============================================================================
// GAME COORDINATE CALLOUTS (for boundary validation)
// These are official valorant-api.com callout positions in GAME coordinates
// =============================================================================

export interface GameCallout {
  name: string;
  superRegion: string;
  x: number;  // Game X coordinate
  y: number;  // Game Y coordinate
}

// All callouts with game coordinates - used for boundary validation
export const MAP_CALLOUTS: Record<string, GameCallout[]> = {
  ascent: [
    { name: 'Tree', superRegion: 'A', x: 3980.91, y: -5938.76 },
    { name: 'Lobby', superRegion: 'A', x: 4489.03, y: -3014.05 },
    { name: 'Main', superRegion: 'A', x: 5321.62, y: -4710.13 },
    { name: 'Window', superRegion: 'A', x: 4023.02, y: -8180.69 },
    { name: 'Site', superRegion: 'A', x: 6153.59, y: -6626.21 },
    { name: 'Garden', superRegion: 'A', x: 3773.67, y: -7551.35 },
    { name: 'Rafters', superRegion: 'A', x: 6129.89, y: -8210.00 },
    { name: 'Wine', superRegion: 'A', x: 7358.74, y: -4689.27 },
    { name: 'Lobby', superRegion: 'B', x: -1490.59, y: -1389.97 },
    { name: 'Main', superRegion: 'B', x: -1983.67, y: -5840.81 },
    { name: 'Boat House', superRegion: 'B', x: -4484.77, y: -7763.36 },
    { name: 'Site', superRegion: 'B', x: -2344.07, y: -7548.51 },
    { name: 'Bottom', superRegion: 'Mid', x: 1122.23, y: -5951.70 },
    { name: 'Catwalk', superRegion: 'Mid', x: 2315.79, y: -4127.26 },
    { name: 'Cubby', superRegion: 'Mid', x: 3387.32, y: -5129.76 },
    { name: 'Market', superRegion: 'Mid', x: 1089.10, y: -7363.19 },
    { name: 'Courtyard', superRegion: 'Mid', x: 1222.70, y: -4586.60 },
    { name: 'Link', superRegion: 'Mid', x: -632.09, y: -4280.26 },
    { name: 'Pizza', superRegion: 'Mid', x: 1801.57, y: -7262.17 },
    { name: 'Top', superRegion: 'Mid', x: 2753.93, y: -2129.62 },
  ],
  haven: [
    { name: 'Garden', superRegion: 'A', x: 3100.26, y: -4683.60 },
    { name: 'Link', superRegion: 'A', x: 4244.42, y: -10715.68 },
    { name: 'Lobby', superRegion: 'A', x: 3438.54, y: -6260.41 },
    { name: 'Long', superRegion: 'A', x: 6209.70, y: -6901.14 },
    { name: 'Sewer', superRegion: 'A', x: 3452.87, y: -7915.72 },
    { name: 'Site', superRegion: 'A', x: 6309.31, y: -9225.70 },
    { name: 'Tower', superRegion: 'A', x: 6721.40, y: -10472.52 },
    { name: 'Back', superRegion: 'B', x: 1966.16, y: -10664.78 },
    { name: 'Site', superRegion: 'B', x: 1884.71, y: -9231.34 },
    { name: 'Link', superRegion: 'C', x: -87.76, y: -10004.42 },
    { name: 'Lobby', superRegion: 'C', x: -1642.19, y: -5720.35 },
    { name: 'Long', superRegion: 'C', x: -3356.81, y: -5990.87 },
    { name: 'Garage', superRegion: 'C', x: 180.08, y: -7999.58 },
    { name: 'Window', superRegion: 'C', x: -10.13, y: -8993.24 },
    { name: 'Site', superRegion: 'C', x: -2378.13, y: -9010.56 },
    { name: 'Cubby', superRegion: 'C', x: -2119.77, y: -6561.60 },
    { name: 'Doors', superRegion: 'Mid', x: 151.12, y: -6262.92 },
    { name: 'Courtyard', superRegion: 'Mid', x: 1822.13, y: -6712.69 },
    { name: 'Window', superRegion: 'Mid', x: 1950.22, y: -5567.91 },
  ],
  bind: [
    { name: 'Exit', superRegion: 'A', x: 7550.41, y: 5874.50 },
    { name: 'Link', superRegion: 'A', x: 6365.64, y: -1007.02 },
    { name: 'Lobby', superRegion: 'A', x: 6113.24, y: 3158.82 },
    { name: 'Short', superRegion: 'A', x: 7983.35, y: 803.96 },
    { name: 'Site', superRegion: 'A', x: 10747.90, y: 2664.44 },
    { name: 'Teleporter', superRegion: 'A', x: 9432.30, y: 489.88 },
    { name: 'Bath', superRegion: 'A', x: 9106.54, y: 4449.66 },
    { name: 'Cubby', superRegion: 'A', x: 8605.17, y: 174.90 },
    { name: 'Lamps', superRegion: 'A', x: 10649.47, y: 79.90 },
    { name: 'Tower', superRegion: 'A', x: 12872.58, y: 2556.77 },
    { name: 'Exit', superRegion: 'B', x: 8921.41, y: -1763.23 },
    { name: 'Hall', superRegion: 'B', x: 12981.88, y: -4941.75 },
    { name: 'Link', superRegion: 'B', x: 6361.57, y: -2621.18 },
    { name: 'Fountain', superRegion: 'B', x: 5737.15, y: -5390.45 },
    { name: 'Long', superRegion: 'B', x: 7666.67, y: -6512.80 },
    { name: 'Short', superRegion: 'B', x: 7424.13, y: -3056.45 },
    { name: 'Site', superRegion: 'B', x: 11108.11, y: -4831.46 },
    { name: 'Teleporter', superRegion: 'B', x: 9027.78, y: -7223.81 },
    { name: 'Window', superRegion: 'B', x: 8826.79, y: -4309.41 },
    { name: 'Elbow', superRegion: 'B', x: 11212.90, y: -7095.33 },
    { name: 'Garden', superRegion: 'B', x: 9144.10, y: -5598.13 },
    { name: 'Cave', superRegion: 'Attacker Side', x: 3920.39, y: 256.94 },
  ],
  split: [
    { name: 'Back', superRegion: 'A', x: 7345.05, y: -7858.04 },
    { name: 'Lobby', superRegion: 'A', x: 6814.22, y: -2457.75 },
    { name: 'Main', superRegion: 'A', x: 6279.98, y: -4492.83 },
    { name: 'Rafters', superRegion: 'A', x: 5434.73, y: -6258.44 },
    { name: 'Ramps', superRegion: 'A', x: 4330.00, y: -4750.00 },
    { name: 'Screens', superRegion: 'A', x: 5648.71, y: -8868.61 },
    { name: 'Sewer', superRegion: 'A', x: 4862.61, y: -2367.26 },
    { name: 'Site', superRegion: 'A', x: 6588.66, y: -6761.13 },
    { name: 'Tower', superRegion: 'A', x: 4636.79, y: -6748.23 },
    { name: 'Alley', superRegion: 'B', x: -1158.00, y: -8066.30 },
    { name: 'Back', superRegion: 'B', x: -3107.18, y: -7417.26 },
    { name: 'Link', superRegion: 'B', x: -27.67, y: -2369.78 },
    { name: 'Garage', superRegion: 'B', x: -2190.78, y: -3848.03 },
    { name: 'Rafters', superRegion: 'B', x: -637.14, y: -6070.62 },
    { name: 'Site', superRegion: 'B', x: -2167.25, y: -6264.77 },
    { name: 'Stairs', superRegion: 'B', x: 1061.49, y: -6760.98 },
    { name: 'Tower', superRegion: 'B', x: 168.90, y: -5290.19 },
    { name: 'Lobby', superRegion: 'B', x: -1271.64, y: -1983.62 },
    { name: 'Bottom', superRegion: 'Mid', x: 1922.66, y: -2899.46 },
    { name: 'Mail', superRegion: 'Mid', x: 1155.33, y: -4808.64 },
    { name: 'Top', superRegion: 'Mid', x: 2021.96, y: -4596.94 },
    { name: 'Vent', superRegion: 'Mid', x: 3155.16, y: -5338.52 },
  ],
  icebox: [
    { name: 'Belt', superRegion: 'A', x: -7200.00, y: -850.00 },
    { name: 'Nest', superRegion: 'A', x: -6650.00, y: 900.00 },
    { name: 'Pipes', superRegion: 'A', x: -6150.00, y: 450.00 },
    { name: 'Rafters', superRegion: 'A', x: -6450.00, y: 4250.00 },
    { name: 'Screen', superRegion: 'A', x: -5100.00, y: 3325.00 },
    { name: 'Site', superRegion: 'A', x: -6400.00, y: 3200.00 },
    { name: 'Garage', superRegion: 'B', x: -1250.00, y: -1425.00 },
    { name: 'Yellow', superRegion: 'B', x: 2050.00, y: -25.00 },
    { name: 'Back', superRegion: 'B', x: 251.00, y: 4269.00 },
    { name: 'Cubby', superRegion: 'B', x: 1050.00, y: -975.00 },
    { name: 'Green', superRegion: 'B', x: -450.00, y: -700.00 },
    { name: 'Hall', superRegion: 'B', x: 300.00, y: 3050.00 },
    { name: 'Hut', superRegion: 'B', x: -1425.00, y: 4400.00 },
    { name: 'Kitchen', superRegion: 'B', x: -2221.36, y: 3403.65 },
    { name: 'Orange', superRegion: 'B', x: -632.00, y: 1700.00 },
    { name: 'Site', superRegion: 'B', x: 1725.00, y: 2575.00 },
    { name: 'Snowman', superRegion: 'B', x: 2250.00, y: 3960.32 },
    { name: 'Snow Pile', superRegion: 'B', x: -1775.00, y: 2500.00 },
    { name: 'Tube', superRegion: 'B', x: -2300.00, y: 1275.00 },
    { name: 'Blue', superRegion: 'Mid', x: -2825.00, y: 975.00 },
    { name: 'Boiler', superRegion: 'Mid', x: -3375.00, y: 2925.00 },
    { name: 'Pallet', superRegion: 'Mid', x: -4450.00, y: 1775.00 },
    { name: 'Fence', superRegion: 'B', x: 363.00, y: 3595.00 },
  ],
  breeze: [
    { name: 'Hall', superRegion: 'Mid', x: 4256.57, y: 2491.05 },
    { name: 'Bridge', superRegion: 'A', x: 8400.00, y: 3525.00 },
    { name: 'Arches', superRegion: 'Defender Side', x: 9400.00, y: -1300.00 },
    { name: 'Wood Doors', superRegion: 'Mid', x: 4825.00, y: 2550.00 },
    { name: 'Pillar', superRegion: 'Mid', x: 4175.00, y: 475.00 },
    { name: 'Top', superRegion: 'Mid', x: 6175.00, y: 525.00 },
    { name: 'Nest', superRegion: 'Mid', x: 8650.00, y: 275.00 },
    { name: 'Window', superRegion: 'B', x: 2225.00, y: -4175.00 },
    { name: 'Main', superRegion: 'B', x: 3550.00, y: -4450.00 },
    { name: 'Elbow', superRegion: 'B', x: 4675.00, y: -2900.00 },
    { name: 'Site', superRegion: 'B', x: 6450.00, y: -5650.00 },
    { name: 'Tunnel', superRegion: 'B', x: 6450.00, y: -1450.00 },
    { name: 'Ramp', superRegion: 'A', x: 7300.00, y: 2725.00 },
    { name: 'Back', superRegion: 'B', x: 7550.00, y: -5675.00 },
    { name: 'Wall', superRegion: 'B', x: 8550.00, y: -3000.00 },
    { name: 'Cannon', superRegion: 'Mid', x: 2900.00, y: -1850.00 },
    { name: 'Bottom', superRegion: 'Mid', x: 1575.00, y: 475.00 },
    { name: 'Lobby', superRegion: 'A', x: -1250.00, y: 3400.00 },
    { name: 'Shop', superRegion: 'A', x: 2150.00, y: 4250.00 },
    { name: 'Site', superRegion: 'A', x: 4825.00, y: 6325.00 },
    { name: 'Pyramids', superRegion: 'A', x: 5200.00, y: 5450.00 },
  ],
  fracture: [
    { name: 'Bridge', superRegion: 'Attacker Side', x: 13204.00, y: -756.00 },
    { name: 'Bench', superRegion: 'B', x: 11473.00, y: -2897.00 },
    { name: 'Arcade', superRegion: 'B', x: 10181.00, y: -4179.00 },
    { name: 'Tower', superRegion: 'B', x: 9155.00, y: -5601.00 },
    { name: 'Site', superRegion: 'B', x: 8178.00, y: -5942.00 },
    { name: 'Generator', superRegion: 'B', x: 8362.00, y: -3380.00 },
    { name: 'Link', superRegion: 'B', x: 9198.00, y: -2741.00 },
    { name: 'Canteen', superRegion: 'B', x: 7111.00, y: -3138.00 },
    { name: 'Main', superRegion: 'B', x: 5967.00, y: -5343.00 },
    { name: 'Tree', superRegion: 'B', x: 4965.00, y: -4109.00 },
    { name: 'Tunnel', superRegion: 'B', x: 7402.00, y: -4058.00 },
    { name: 'Link', superRegion: 'A', x: 8578.00, y: 1302.00 },
    { name: 'Hall', superRegion: 'A', x: 5063.55, y: 2057.66 },
    { name: 'Door', superRegion: 'A', x: 5807.86, y: 1940.46 },
    { name: 'Rope', superRegion: 'A', x: 6638.83, y: 1052.65 },
    { name: 'Main', superRegion: 'A', x: 5878.79, y: 3450.96 },
    { name: 'Site', superRegion: 'A', x: 8125.76, y: 3373.79 },
    { name: 'Drop', superRegion: 'A', x: 9306.80, y: 2826.16 },
    { name: 'Dish', superRegion: 'A', x: 11296.67, y: 1391.71 },
    { name: 'Gate', superRegion: 'A', x: 12962.00, y: 1565.00 },
  ],
  pearl: [
    { name: 'Hall', superRegion: 'B', x: 7495.62, y: -4954.14 },
    { name: 'Doors', superRegion: 'Mid', x: 4701.24, y: 597.23 },
    { name: 'Connector', superRegion: 'Mid', x: 6047.05, y: 1800.04 },
    { name: 'Water', superRegion: 'Defender Side', x: 7808.02, y: 1800.04 },
    { name: 'Flowers', superRegion: 'A', x: 9263.97, y: 2507.34 },
    { name: 'Secret', superRegion: 'A', x: 10458.14, y: 3831.51 },
    { name: 'Dugout', superRegion: 'A', x: 7660.66, y: 5854.07 },
    { name: 'Site', superRegion: 'A', x: 6613.85, y: 5569.53 },
    { name: 'Records', superRegion: 'Defender Side', x: 8973.15, y: -1470.27 },
    { name: 'Top', superRegion: 'Mid', x: 2075.00, y: 725.00 },
    { name: 'Tunnel', superRegion: 'B', x: 8973.15, y: -2155.13 },
    { name: 'Tower', superRegion: 'B', x: 8533.42, y: -2851.35 },
    { name: 'Main', superRegion: 'A', x: 6368.57, y: 3825.00 },
    { name: 'Restaurant', superRegion: 'A', x: 4430.45, y: 2813.13 },
    { name: 'Link', superRegion: 'B', x: 4503.36, y: -591.64 },
    { name: 'Art', superRegion: 'A', x: 4561.95, y: 3406.88 },
    { name: 'Link', superRegion: 'A', x: 6055.21, y: 3782.70 },
    { name: 'Plaza', superRegion: 'Mid', x: 2750.00, y: -325.00 },
    { name: 'Shops', superRegion: 'Mid', x: 800.00, y: -1450.00 },
    { name: 'Club', superRegion: 'B', x: 800.00, y: -1450.00 },
    { name: 'Ramp', superRegion: 'B', x: 1750.00, y: -3800.00 },
    { name: 'Main', superRegion: 'B', x: 4050.00, y: -4375.00 },
    { name: 'Site', superRegion: 'B', x: 5800.00, y: -2850.00 },
    { name: 'Screen', superRegion: 'B', x: 6260.43, y: -5000.93 },
  ],
  lotus: [
    { name: 'Top', superRegion: 'A', x: 9260.30, y: 5045.59 },
    { name: 'Drop', superRegion: 'A', x: 9516.38, y: 6092.89 },
    { name: 'Site', superRegion: 'A', x: 7735.54, y: 5557.31 },
    { name: 'Hut', superRegion: 'A', x: 7917.46, y: 5557.31 },
    { name: 'Tree', superRegion: 'A', x: 6149.53, y: 5557.31 },
    { name: 'Door', superRegion: 'A', x: 5608.76, y: 5203.91 },
    { name: 'Main', superRegion: 'A', x: 5288.30, y: 4159.76 },
    { name: 'Rubble', superRegion: 'A', x: 4401.07, y: 4918.19 },
    { name: 'Root', superRegion: 'A', x: 4401.07, y: 3294.15 },
    { name: 'Lobby', superRegion: 'A', x: 2685.95, y: 2927.18 },
    { name: 'Lobby', superRegion: 'C', x: 1403.57, y: -1576.59 },
    { name: 'Pillars', superRegion: 'B', x: 3565.37, y: 668.18 },
    { name: 'Main', superRegion: 'B', x: 4876.83, y: -47.87 },
    { name: 'Door', superRegion: 'C', x: 4818.67, y: -1752.80 },
    { name: 'Site', superRegion: 'B', x: 6368.03, y: 668.18 },
    { name: 'Link', superRegion: 'A', x: 6011.07, y: 2087.65 },
    { name: 'Upper', superRegion: 'B', x: 7682.94, y: 1517.36 },
    { name: 'Waterfall', superRegion: 'C', x: 6719.80, y: -1994.30 },
    { name: 'Link', superRegion: 'C', x: 7504.11, y: -1377.89 },
    { name: 'Stairs', superRegion: 'A', x: 8257.88, y: 3860.93 },
    { name: 'Mound', superRegion: 'C', x: 3863.72, y: -1576.59 },
    { name: 'Main', superRegion: 'C', x: 5311.26, y: -3148.16 },
    { name: 'Bend', superRegion: 'C', x: 5657.52, y: -5281.44 },
    { name: 'Site', superRegion: 'C', x: 6676.66, y: -4265.88 },
    { name: 'Hall', superRegion: 'C', x: 7902.06, y: -4265.88 },
    { name: 'Gravel', superRegion: 'C', x: 8936.88, y: -1752.29 },
  ],
  sunset: [
    { name: 'Boba', superRegion: 'B', x: 2200.00, y: -4800.00 },
    { name: 'Tiles', superRegion: 'Mid', x: -1800.00, y: 400.00 },
    { name: 'Market', superRegion: 'B', x: -200.00, y: -3400.00 },
    { name: 'Site', superRegion: 'B', x: -600.00, y: -5850.00 },
    { name: 'Main', superRegion: 'B', x: -2000.00, y: -5650.00 },
    { name: 'Lobby', superRegion: 'B', x: -3400.00, y: -2600.00 },
    { name: 'Bottom', superRegion: 'Mid', x: -1800.00, y: -2025.00 },
    { name: 'Courtyard', superRegion: 'Mid', x: -600.00, y: -1200.00 },
    { name: 'Lobby', superRegion: 'A', x: -1800.00, y: 2000.00 },
    { name: 'Main', superRegion: 'A', x: -400.00, y: 2200.00 },
    { name: 'Link', superRegion: 'A', x: 2200.00, y: 3000.00 },
    { name: 'Site', superRegion: 'A', x: 1000.00, y: 3200.00 },
    { name: 'Elbow', superRegion: 'A', x: 200.00, y: 4200.00 },
    { name: 'Alley', superRegion: 'A', x: 3400.00, y: 3600.00 },
    { name: 'Top', superRegion: 'Mid', x: 2000.00, y: -2000.00 },
  ],
  abyss: [
    { name: 'Bridge', superRegion: 'A', x: 5700.00, y: -375.00 },
    { name: 'Link', superRegion: 'A', x: 2800.00, y: -2450.00 },
    { name: 'Lobby', superRegion: 'A', x: 3250.00, y: 3400.00 },
    { name: 'Main', superRegion: 'A', x: 3800.00, y: 1650.00 },
    { name: 'Site', superRegion: 'A', x: 4300.00, y: -200.00 },
    { name: 'Tower', superRegion: 'A', x: 3025.00, y: -125.00 },
    { name: 'Bend', superRegion: 'Mid', x: -1700.00, y: 1075.00 },
    { name: 'Link', superRegion: 'B', x: -2000.00, y: -2350.00 },
    { name: 'Lobby', superRegion: 'B', x: -3650.00, y: 4025.00 },
    { name: 'Main', superRegion: 'B', x: -4450.00, y: 1525.00 },
    { name: 'Nest', superRegion: 'B', x: -4975.00, y: 2150.00 },
    { name: 'Bottom', superRegion: 'Mid', x: -400.00, y: 575.00 },
    { name: 'Site', superRegion: 'B', x: -4425.00, y: -1175.00 },
    { name: 'Catwalk', superRegion: 'Mid', x: 600.00, y: 525.00 },
    { name: 'Danger', superRegion: 'B', x: -5850.00, y: 700.00 },
    { name: 'Library', superRegion: 'Mid', x: -325.00, y: -600.00 },
    { name: 'Secret', superRegion: 'A', x: 3775.00, y: -3850.00 },
    { name: 'Security', superRegion: 'A', x: 4900.00, y: -2975.00 },
    { name: 'Top', superRegion: 'Mid', x: 775.00, y: -2375.00 },
    { name: 'Tower', superRegion: 'B', x: -3925.00, y: -2500.00 },
    { name: 'Vent', superRegion: 'A', x: 1700.00, y: -325.00 },
  ],
  corrode: [], // No callout data available yet
};

// =============================================================================
// BOUNDARY VALIDATION FUNCTIONS
// =============================================================================

/**
 * Get the bounding box of all callouts for a map (in game coordinates)
 * Returns min/max X and Y values with a buffer for edge cases
 */
export function getMapPlayableBounds(mapName: string): {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
} | null {
  const key = mapName.toLowerCase().replace(/[^a-z]/g, '');
  const callouts = MAP_CALLOUTS[key];
  if (!callouts || callouts.length === 0) return null;

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;

  for (const callout of callouts) {
    minX = Math.min(minX, callout.x);
    maxX = Math.max(maxX, callout.x);
    minY = Math.min(minY, callout.y);
    maxY = Math.max(maxY, callout.y);
  }

  // Add 15% buffer to account for areas between callouts
  const bufferX = (maxX - minX) * 0.15;
  const bufferY = (maxY - minY) * 0.15;

  return {
    minX: minX - bufferX,
    maxX: maxX + bufferX,
    minY: minY - bufferY,
    maxY: maxY + bufferY,
  };
}

/**
 * Check if a game coordinate is within the playable bounds
 */
export function isWithinPlayableBounds(
  gameX: number,
  gameY: number,
  mapName: string
): boolean {
  const bounds = getMapPlayableBounds(mapName);
  if (!bounds) return true; // If no bounds data, assume valid

  return (
    gameX >= bounds.minX &&
    gameX <= bounds.maxX &&
    gameY >= bounds.minY &&
    gameY <= bounds.maxY
  );
}

/**
 * Find the nearest callout to a given game coordinate
 */
export function findNearestCallout(
  gameX: number,
  gameY: number,
  mapName: string
): GameCallout | null {
  const key = mapName.toLowerCase().replace(/[^a-z]/g, '');
  const callouts = MAP_CALLOUTS[key];
  if (!callouts || callouts.length === 0) return null;

  let nearest: GameCallout | null = null;
  let minDistance = Infinity;

  for (const callout of callouts) {
    const dx = callout.x - gameX;
    const dy = callout.y - gameY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = callout;
    }
  }

  return nearest;
}

/**
 * Clamp a position to within playable bounds
 * If position is outside bounds, move it to the nearest edge
 */
export function clampToPlayableBounds(
  gameX: number,
  gameY: number,
  mapName: string
): { x: number; y: number } {
  const bounds = getMapPlayableBounds(mapName);
  if (!bounds) return { x: gameX, y: gameY };

  return {
    x: Math.max(bounds.minX, Math.min(bounds.maxX, gameX)),
    y: Math.max(bounds.minY, Math.min(bounds.maxY, gameY)),
  };
}

/**
 * Validate and adjust a ghost position to be within playable area
 * Returns the original position if valid, or adjusted position if not
 */
export function validateGhostPosition(
  ghostX: number,
  ghostY: number,
  deathX: number,
  deathY: number,
  mapName: string
): { x: number; y: number; wasAdjusted: boolean } {
  // First check if within playable bounds
  if (isWithinPlayableBounds(ghostX, ghostY, mapName)) {
    return { x: ghostX, y: ghostY, wasAdjusted: false };
  }

  // Option 1: Clamp to bounds
  const clamped = clampToPlayableBounds(ghostX, ghostY, mapName);

  // Option 2: Find nearest callout and position near it
  const nearestCallout = findNearestCallout(deathX, deathY, mapName);

  if (nearestCallout) {
    // Position ghost between death location and nearest callout
    const dx = nearestCallout.x - deathX;
    const dy = nearestCallout.y - deathY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance > 0) {
      // Place ghost 70% of the way toward the callout (within trade range)
      const adjustedX = deathX + (dx / distance) * distance * 0.7;
      const adjustedY = deathY + (dy / distance) * distance * 0.7;

      // Use the adjusted position if it's within bounds, otherwise use clamped
      if (isWithinPlayableBounds(adjustedX, adjustedY, mapName)) {
        return { x: adjustedX, y: adjustedY, wasAdjusted: true };
      }
    }
  }

  return { x: clamped.x, y: clamped.y, wasAdjusted: true };
}

/**
 * Get all game callouts for a map
 */
export function getGameCallouts(mapName: string): GameCallout[] {
  const key = mapName.toLowerCase().replace(/[^a-z]/g, '');
  return MAP_CALLOUTS[key] || [];
}

// Legacy type exports for backwards compatibility
export interface MapBounds {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

export interface GameBounds {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

export interface ImagePadding {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export type MapCalibration = {
  offsetX: number;
  offsetY: number;
  scale: number;
};

export interface ReferencePoint {
  name: string;
  x: number;
  y: number;
}

// Legacy function stubs
export function getMapBounds(_mapName: string): MapBounds | null {
  return null;
}

export function getGameBounds(_mapName: string): GameBounds | null {
  return null;
}

export function getImagePadding(_mapName: string): ImagePadding | null {
  return null;
}

export function getCalibration(_mapName: string): MapCalibration {
  return { offsetX: 0, offsetY: 0, scale: 1 };
}

export function getReferencePoints(_mapName: string): ReferencePoint[] {
  return [];
}

// Callout position is now stored directly in screenX/screenY
export function calloutToImagePosition(
  screenX: number,
  screenY: number,
  _mapName: string
): { x: number; y: number } | null {
  return { x: screenX, y: screenY };
}
