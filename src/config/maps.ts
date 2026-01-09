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
