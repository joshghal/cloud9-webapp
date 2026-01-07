// VALORANT map configuration with calibration for GRID coordinates
// Reference points from valorant-api.com callouts for calibration verification

export interface MapCalibration {
  // Offset in normalized coordinates (0-1 range)
  // Positive offsetX shifts markers right, positive offsetY shifts markers down
  offsetX: number;
  offsetY: number;
  // Scale factor (1 = no change, >1 = spread out, <1 = compress)
  scale: number;
}

export interface ReferencePoint {
  name: string;
  x: number;
  y: number;
}

export interface MapConfig {
  displayName: string;
  image: string;
  // Rotation in degrees (0, 90, 180, 270) to align map image with GRID coordinates
  rotation: number;
  // Flip horizontally or vertically
  flipX?: boolean;
  flipY?: boolean;
  // Zoom level for the image (1 = normal, 1.2 = 120%)
  zoom?: number;
  // Stretch width only (1 = normal, 1.1 = 110% width)
  scaleX?: number;
  // Stretch height only (1 = normal, 1.1 = 110% height)
  scaleY?: number;
  // Calibration to align GRID coordinates with map image
  calibration: MapCalibration;
  // Reference points for calibration (known locations from valorant-api.com)
  referencePoints: ReferencePoint[];
}

// Default calibration - no adjustment
const DEFAULT_CALIBRATION: MapCalibration = {
  offsetX: 0,
  offsetY: 0,
  scale: 1,
};

export const MAP_CONFIGS: Record<string, MapConfig> = {
  ascent: {
    displayName: 'Ascent',
    image: '/maps/ascent.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 6153.59, y: -6626.21 },
      { name: 'B Site', x: -2344.07, y: -7548.51 },
      { name: 'Mid Catwalk', x: 2315.79, y: -4127.26 },
    ],
  },
  split: {
    displayName: 'Split',
    image: '/maps/split.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 6588.66, y: -6761.13 },
      { name: 'B Site', x: -2167.25, y: -6264.77 },
      { name: 'Mid Bottom', x: 1922.66, y: -2899.46 },
    ],
  },
  fracture: {
    displayName: 'Fracture',
    image: '/maps/fracture.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 8125.76, y: 3373.79 },
      { name: 'B Site', x: 8178, y: -5942 },
      { name: 'Mid Spawn', x: 9156, y: -677 },
    ],
  },
  bind: {
    displayName: 'Bind',
    image: '/maps/bind.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 10747.90, y: 2664.44 },
      { name: 'B Site', x: 11108.11, y: -4831.46 },
      { name: 'Mid Courtyard', x: -600, y: -1200 },
    ],
  },
  breeze: {
    displayName: 'Breeze',
    image: '/maps/breeze.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 4825, y: 6325 },
      { name: 'B Site', x: 6450, y: -5650 },
      { name: 'Mid Nest', x: 8650, y: 275 },
    ],
  },
  abyss: {
    displayName: 'Abyss',
    image: '/maps/abyss.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 4300, y: -200 },
      { name: 'B Site', x: -4425, y: -1175 },
      { name: 'Mid Bend', x: -1700, y: 1075 },
    ],
  },
  lotus: {
    displayName: 'Lotus',
    image: '/maps/lotus.png',
    rotation: 90,  // Rotate 90 degrees right
    flipX: true,   // Flip horizontally
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 7735.54, y: 5557.31 },
      { name: 'B Site', x: 6368.03, y: 668.18 },
      { name: 'C Site', x: 6676.66, y: -4265.88 },
    ],
  },
  sunset: {
    displayName: 'Sunset',
    image: '/maps/sunset.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 1000, y: 3200 },
      { name: 'B Site', x: -600, y: -5850 },
      { name: 'Mid Top', x: 2000, y: -2000 },
    ],
  },
  pearl: {
    displayName: 'Pearl',
    image: '/maps/pearl.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 6613.85, y: 5569.53 },
      { name: 'B Site', x: 5800, y: -2850 },
      { name: 'Mid Connector', x: 6047.05, y: 1800.04 },
    ],
  },
  icebox: {
    displayName: 'Icebox',
    image: '/maps/icebox.png',
    rotation: 0,
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: -6400, y: 3200 },
      { name: 'B Site', x: 1725, y: 2575 },
      { name: 'Mid Boiler', x: -3375, y: 2925 },
    ],
  },
  corrode: {
    displayName: 'Corrode',
    image: '/maps/corrode.png',
    rotation: -90,  // Rotate 90 degrees left
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 3458.28, y: -1824.50 },
      { name: 'B Site', x: -2716.72, y: -1174.51 },
      { name: 'Mid Stairs', x: 133.28, y: -1474.51 },
    ],
  },
  haven: {
    displayName: 'Haven',
    image: '/maps/haven.png',
    rotation: -90,  // Rotate 90 degrees left
    flipY: true,    // Flip vertically
    zoom: 1.05,
    scaleY: 1.1,    // Stretch height by 10%
    calibration: { offsetX: 0, offsetY: 0, scale: 1 },
    referencePoints: [
      { name: 'A Site', x: 4316.09, y: -6782.34 },
      { name: 'B Site', x: 2760.47, y: -5936.08 },
      { name: 'C Site', x: -2284.45, y: -7050.07 },
    ],
  },
};

export function getMapConfig(mapName: string): MapConfig | null {
  const key = mapName.toLowerCase().replace(/[^a-z]/g, '');
  return MAP_CONFIGS[key] || null;
}

export function getCalibration(mapName: string): MapCalibration {
  const config = getMapConfig(mapName);
  return config?.calibration || DEFAULT_CALIBRATION;
}

export function getReferencePoints(mapName: string): ReferencePoint[] {
  const config = getMapConfig(mapName);
  return config?.referencePoints || [];
}
