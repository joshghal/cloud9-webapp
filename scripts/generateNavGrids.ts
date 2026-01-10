/**
 * Generate Navigation Grids from Valorant Minimap Images
 *
 * This script:
 * 1. Downloads minimap images from valorant-api.com
 * 2. Processes them to identify walkable areas (lighter) vs walls (darker)
 * 3. Creates navigation grids for A* pathfinding
 * 4. Saves as JSON files
 *
 * Run with: npx ts-node scripts/generateNavGrids.ts
 */

import sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

// Map configurations with image URLs
const MAPS = {
  ascent: {
    url: 'https://media.valorant-api.com/maps/7eaecc1b-4337-bbf6-6ab9-04b8f06b3319/displayicon.png',
    threshold: 25, // Brightness threshold for walkable areas
  },
  haven: {
    url: 'https://media.valorant-api.com/maps/2bee0dc9-4ffe-519b-1cbd-7fbe763a6047/displayicon.png',
    threshold: 25,
  },
  bind: {
    url: 'https://media.valorant-api.com/maps/2c9d57ec-4431-9c5e-2939-8f9ef6dd5cba/displayicon.png',
    threshold: 25,
  },
  split: {
    url: 'https://media.valorant-api.com/maps/d960549e-485c-e861-8d71-aa9d1aed12a2/displayicon.png',
    threshold: 25,
  },
  icebox: {
    url: 'https://media.valorant-api.com/maps/e2ad5c54-4114-a870-9641-8ea21279579a/displayicon.png',
    threshold: 20,
  },
  breeze: {
    url: 'https://media.valorant-api.com/maps/2fb9a4fd-47b8-4e7d-a969-74b4046ebd53/displayicon.png',
    threshold: 25,
  },
  fracture: {
    url: 'https://media.valorant-api.com/maps/b529448b-4d60-346e-e89e-00a4c527a405/displayicon.png',
    threshold: 25,
  },
  pearl: {
    url: 'https://media.valorant-api.com/maps/fd267378-4d1d-484f-ff52-77821ed10dc2/displayicon.png',
    threshold: 25,
  },
  lotus: {
    url: 'https://media.valorant-api.com/maps/2fe4ed3a-450a-948b-6d6b-e89a78e680a9/displayicon.png',
    threshold: 25,
  },
  sunset: {
    url: 'https://media.valorant-api.com/maps/92584fbe-486a-b1b2-9faa-39b0f486b498/displayicon.png',
    threshold: 25,
  },
  abyss: {
    url: 'https://media.valorant-api.com/maps/224b0a95-48b9-f703-1bd8-67aca101a61f/displayicon.png',
    threshold: 25,
  },
};

// Grid resolution - higher = more accurate but slower pathfinding
const GRID_SIZE = 128;

// Processing configuration for wall detection
const PROCESS_SIZE = 1024; // Process at very high resolution to capture thin walls
const WALL_DILATION_RADIUS = 6; // Aggressively expand walls to ensure thin walls are captured
const WALL_THRESHOLD_PERCENT = 0.10; // Only 10% wall coverage needed to mark cell as wall

interface NavGrid {
  mapName: string;
  gridSize: number;
  grid: number[][]; // 0 = wall/obstacle, 1 = walkable
  timestamp: string;
}

async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${url}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

async function processMapImage(
  mapName: string,
  imageBuffer: Buffer,
  threshold: number
): Promise<NavGrid> {
  console.log(`Processing ${mapName}...`);
  console.log(`  Resolution: ${PROCESS_SIZE}px, Dilation: ${WALL_DILATION_RADIUS}px, Wall threshold: ${WALL_THRESHOLD_PERCENT * 100}%`);

  // Convert to grayscale at very high resolution
  const { data: highResData } = await sharp(imageBuffer)
    .resize(PROCESS_SIZE, PROCESS_SIZE, { fit: 'fill' })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  // Create high-res binary mask first (before downsampling)
  // Use brightness threshold of 50 - walls are 0-20, walkable is 100+
  const highResMask: number[][] = [];
  for (let y = 0; y < PROCESS_SIZE; y++) {
    const row: number[] = [];
    for (let x = 0; x < PROCESS_SIZE; x++) {
      const pixelIndex = y * PROCESS_SIZE + x;
      const brightness = highResData[pixelIndex];
      row.push(brightness > 50 ? 1 : 0);
    }
    highResMask.push(row);
  }

  // DILATE walls aggressively to ensure thin walls are captured
  // This expands wall regions before downsampling so thin walls don't disappear
  const dilatedMask = dilateWalls(highResMask, PROCESS_SIZE, WALL_DILATION_RADIUS);

  // Downsample to final grid size with VERY conservative threshold
  const scale = PROCESS_SIZE / GRID_SIZE;
  const grid: number[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    const row: number[] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      // Count wall pixels in this region
      let wallCount = 0;
      let totalCount = 0;

      const startY = Math.floor(y * scale);
      const endY = Math.floor((y + 1) * scale);
      const startX = Math.floor(x * scale);
      const endX = Math.floor((x + 1) * scale);

      for (let hy = startY; hy < endY; hy++) {
        for (let hx = startX; hx < endX; hx++) {
          if (dilatedMask[hy]?.[hx] !== undefined) {
            totalCount++;
            if (dilatedMask[hy][hx] === 0) wallCount++;
          }
        }
      }

      // Cell is a WALL if even a small portion has walls
      // This ensures thin walls are NEVER lost during downsampling
      row.push(wallCount / totalCount > WALL_THRESHOLD_PERCENT ? 0 : 1);
    }
    grid.push(row);
  }

  // Skip cleanGrid to preserve thin walls - no gap filling that could erase walls
  return {
    mapName,
    gridSize: GRID_SIZE,
    grid: grid,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Dilate walls (erode walkable areas) to ensure thin walls are captured
 * Uses efficient multi-pass box dilation for larger radii
 */
function dilateWalls(mask: number[][], size: number, radius: number): number[][] {
  // For large radius, use multiple passes of smaller dilations (faster)
  let current = mask.map(row => [...row]);

  // Apply multiple small dilations to approximate the larger radius
  const passes = Math.ceil(radius / 2);
  for (let pass = 0; pass < passes; pass++) {
    const next: number[][] = current.map(row => [...row]);

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (current[y][x] === 0) {
          // Expand to 8-connected neighbors (box dilation)
          for (let dy = -2; dy <= 2; dy++) {
            for (let dx = -2; dx <= 2; dx++) {
              const ny = y + dy;
              const nx = x + dx;
              if (ny >= 0 && ny < size && nx >= 0 && nx < size) {
                next[ny][nx] = 0;
              }
            }
          }
        }
      }
    }
    current = next;
  }

  return current;
}

/**
 * Clean up the grid by removing noise and filling small gaps
 * Uses simple erosion/dilation-like operations
 */
function cleanGrid(grid: number[][]): number[][] {
  const size = grid.length;
  const result: number[][] = grid.map(row => [...row]);

  // Fill small gaps (if a cell is surrounded by mostly walkable, make it walkable)
  for (let y = 1; y < size - 1; y++) {
    for (let x = 1; x < size - 1; x++) {
      let walkableNeighbors = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          if (grid[y + dy][x + dx] === 1) walkableNeighbors++;
        }
      }
      // If 6+ neighbors are walkable, this cell should be walkable too
      if (walkableNeighbors >= 6) {
        result[y][x] = 1;
      }
    }
  }

  return result;
}

async function generateAllNavGrids() {
  const outputDir = path.join(__dirname, '../src/data/navgrids');

  // Create output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const allGrids: Record<string, NavGrid> = {};

  for (const [mapName, config] of Object.entries(MAPS)) {
    try {
      console.log(`\nDownloading ${mapName} minimap...`);
      const imageBuffer = await downloadImage(config.url);

      const navGrid = await processMapImage(mapName, imageBuffer, config.threshold);
      allGrids[mapName] = navGrid;

      // Save individual grid file
      const outputPath = path.join(outputDir, `${mapName}.json`);
      fs.writeFileSync(outputPath, JSON.stringify(navGrid, null, 2));
      console.log(`Saved ${outputPath}`);

      // Count walkable cells for stats
      const walkableCells = navGrid.grid.flat().filter(c => c === 1).length;
      const totalCells = GRID_SIZE * GRID_SIZE;
      const walkablePercent = ((walkableCells / totalCells) * 100).toFixed(1);
      console.log(`  Walkable: ${walkablePercent}% (${walkableCells}/${totalCells})`);

    } catch (error) {
      console.error(`Error processing ${mapName}:`, error);
    }
  }

  // Save combined file for easy import
  const combinedPath = path.join(outputDir, 'all-navgrids.json');
  fs.writeFileSync(combinedPath, JSON.stringify(allGrids, null, 2));
  console.log(`\nSaved combined file: ${combinedPath}`);

  // Generate TypeScript module for import
  const tsContent = `// Auto-generated navigation grids
// Generated: ${new Date().toISOString()}

export interface NavGrid {
  mapName: string;
  gridSize: number;
  grid: number[][];
  timestamp: string;
}

export const NAV_GRIDS: Record<string, NavGrid> = ${JSON.stringify(allGrids, null, 2)};

export function getNavGrid(mapName: string): NavGrid | null {
  const key = mapName.toLowerCase().replace(/[^a-z]/g, '');
  return NAV_GRIDS[key] || null;
}
`;

  const tsPath = path.join(__dirname, '../src/data/navgrids.ts');
  fs.writeFileSync(tsPath, tsContent);
  console.log(`Generated TypeScript module: ${tsPath}`);
}

// Run the script
generateAllNavGrids().catch(console.error);
