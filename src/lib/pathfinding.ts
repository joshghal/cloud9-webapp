/**
 * A* Pathfinding for Valorant Maps
 *
 * Uses pre-generated navigation grids to find paths that avoid walls
 */

import { getNavGrid } from '@/data/navgrids';
import { gridToNormalized } from '@/config/maps';

interface Point {
  x: number;
  y: number;
}

interface GridPoint {
  row: number;
  col: number;
}

interface AStarNode {
  row: number;
  col: number;
  g: number; // Cost from start
  h: number; // Heuristic (estimated cost to end)
  f: number; // Total cost (g + h)
  parent: AStarNode | null;
}

/**
 * Convert normalized coordinates (0-1) to grid coordinates
 */
function normalizedToGrid(x: number, y: number, gridSize: number): GridPoint {
  return {
    col: Math.floor(Math.max(0, Math.min(gridSize - 1, x * gridSize))),
    row: Math.floor(Math.max(0, Math.min(gridSize - 1, y * gridSize))),
  };
}

/**
 * Convert grid coordinates to normalized coordinates (0-1)
 */
function gridToNormalizedCoord(row: number, col: number, gridSize: number): Point {
  return {
    x: (col + 0.5) / gridSize,
    y: (row + 0.5) / gridSize,
  };
}

/**
 * Heuristic function for A* (Euclidean distance)
 */
function heuristic(a: GridPoint, b: GridPoint): number {
  const dx = a.col - b.col;
  const dy = a.row - b.row;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Get valid neighbors for a grid cell
 */
function getNeighbors(
  row: number,
  col: number,
  grid: number[][],
  gridSize: number
): GridPoint[] {
  const neighbors: GridPoint[] = [];
  // 8-directional movement
  const directions = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],          [0, 1],
    [1, -1], [1, 0], [1, 1],
  ];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;

    // Check bounds
    if (newRow < 0 || newRow >= gridSize || newCol < 0 || newCol >= gridSize) {
      continue;
    }

    // Check if walkable (use optional chaining for safety)
    if (grid[newRow]?.[newCol] === 1) {
      // For diagonal movement, also check that we're not cutting corners
      if (dr !== 0 && dc !== 0) {
        // Diagonal - check adjacent cells are also walkable
        if (grid[row + dr]?.[col] === 0 || grid[row]?.[col + dc] === 0) {
          continue; // Can't cut corners
        }
      }
      neighbors.push({ row: newRow, col: newCol });
    }
  }

  return neighbors;
}

/**
 * A* pathfinding algorithm
 */
function astar(
  start: GridPoint,
  end: GridPoint,
  grid: number[][],
  gridSize: number
): GridPoint[] | null {
  // If start or end is not walkable, find nearest walkable cell
  const actualStart = findNearestWalkable(start, grid, gridSize) || start;
  const actualEnd = findNearestWalkable(end, grid, gridSize) || end;

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    row: actualStart.row,
    col: actualStart.col,
    g: 0,
    h: heuristic(actualStart, actualEnd),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);

  const maxIterations = gridSize * gridSize; // Prevent infinite loops
  let iterations = 0;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;

    // Find node with lowest f score
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = `${current.row},${current.col}`;

    // Check if we reached the end
    if (current.row === actualEnd.row && current.col === actualEnd.col) {
      // Reconstruct path
      const path: GridPoint[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ row: node.row, col: node.col });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    // Check neighbors
    for (const neighbor of getNeighbors(current.row, current.col, grid, gridSize)) {
      const neighborKey = `${neighbor.row},${neighbor.col}`;

      if (closedSet.has(neighborKey)) continue;

      // Cost to reach neighbor
      const isDiagonal = neighbor.row !== current.row && neighbor.col !== current.col;
      const moveCost = isDiagonal ? 1.414 : 1; // sqrt(2) for diagonal
      const g = current.g + moveCost;

      // Check if neighbor is in open set
      const existingNode = openSet.find(
        n => n.row === neighbor.row && n.col === neighbor.col
      );

      if (!existingNode) {
        // Add new node
        const h = heuristic(neighbor, actualEnd);
        openSet.push({
          row: neighbor.row,
          col: neighbor.col,
          g,
          h,
          f: g + h,
          parent: current,
        });
      } else if (g < existingNode.g) {
        // Found better path to existing node
        existingNode.g = g;
        existingNode.f = g + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  // No path found - return straight line
  return null;
}

/**
 * Find nearest walkable cell to a given position
 */
function findNearestWalkable(
  point: GridPoint,
  grid: number[][],
  gridSize: number
): GridPoint | null {
  if (grid[point.row]?.[point.col] === 1) {
    return point;
  }

  // BFS to find nearest walkable
  const visited = new Set<string>();
  const queue: GridPoint[] = [point];
  visited.add(`${point.row},${point.col}`);

  const maxRadius = 20; // Don't search too far
  let iterations = 0;

  while (queue.length > 0 && iterations < maxRadius * maxRadius * 4) {
    iterations++;
    const current = queue.shift()!;

    // Check all 8 directions
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;

        const newRow = current.row + dr;
        const newCol = current.col + dc;
        const key = `${newRow},${newCol}`;

        if (
          newRow >= 0 &&
          newRow < gridSize &&
          newCol >= 0 &&
          newCol < gridSize &&
          !visited.has(key)
        ) {
          visited.add(key);
          if (grid[newRow]?.[newCol] === 1) {
            return { row: newRow, col: newCol };
          }
          queue.push({ row: newRow, col: newCol });
        }
      }
    }
  }

  return null;
}

/**
 * Simplify path by removing unnecessary waypoints
 * Uses Douglas-Peucker-like algorithm
 */
function simplifyPath(path: GridPoint[], tolerance: number = 1): GridPoint[] {
  if (path.length <= 2) return path;

  // Find point furthest from line between first and last
  const first = path[0];
  const last = path[path.length - 1];

  let maxDist = 0;
  let maxIndex = 0;

  for (let i = 1; i < path.length - 1; i++) {
    const dist = pointToLineDistance(path[i], first, last);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  // If max distance is greater than tolerance, recursively simplify
  if (maxDist > tolerance) {
    const left = simplifyPath(path.slice(0, maxIndex + 1), tolerance);
    const right = simplifyPath(path.slice(maxIndex), tolerance);
    return [...left.slice(0, -1), ...right];
  }

  // Otherwise, just keep endpoints
  return [first, last];
}

/**
 * Distance from point to line segment
 */
function pointToLineDistance(point: GridPoint, lineStart: GridPoint, lineEnd: GridPoint): number {
  const dx = lineEnd.col - lineStart.col;
  const dy = lineEnd.row - lineStart.row;
  const len = Math.sqrt(dx * dx + dy * dy);

  if (len === 0) {
    return Math.sqrt(
      (point.col - lineStart.col) ** 2 + (point.row - lineStart.row) ** 2
    );
  }

  const t = Math.max(0, Math.min(1,
    ((point.col - lineStart.col) * dx + (point.row - lineStart.row) * dy) / (len * len)
  ));

  const projCol = lineStart.col + t * dx;
  const projRow = lineStart.row + t * dy;

  return Math.sqrt((point.col - projCol) ** 2 + (point.row - projRow) ** 2);
}

// Debug flag - set to true to enable console logging
const DEBUG_PATHFINDING = true;

/**
 * Find path between two game coordinates
 * Returns array of normalized (0-1) coordinates for the path
 */
export function findPath(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  mapName: string
): Point[] | null {
  const navGrid = getNavGrid(mapName);
  if (!navGrid) {
    if (DEBUG_PATHFINDING) console.log(`[Pathfinding] No nav grid for map: ${mapName}`);
    return null;
  }

  // Convert game coordinates to normalized (0-1)
  const startNorm = gridToNormalized(startX, startY, mapName);
  const endNorm = gridToNormalized(endX, endY, mapName);

  if (!startNorm || !endNorm) {
    if (DEBUG_PATHFINDING) console.log(`[Pathfinding] Failed to normalize coords`);
    return null;
  }

  // Convert normalized to grid coordinates
  const gridSize = navGrid.gridSize;
  const startGrid = normalizedToGrid(startNorm.x, startNorm.y, gridSize);
  const endGrid = normalizedToGrid(endNorm.x, endNorm.y, gridSize);

  // Check if start/end are walkable
  const startWalkable = navGrid.grid[startGrid.row]?.[startGrid.col] === 1;
  const endWalkable = navGrid.grid[endGrid.row]?.[endGrid.col] === 1;

  if (DEBUG_PATHFINDING) {
    console.log(`[Pathfinding] Map: ${mapName}`);
    console.log(`  Start: (${startGrid.col}, ${startGrid.row}) walkable: ${startWalkable}`);
    console.log(`  End: (${endGrid.col}, ${endGrid.row}) walkable: ${endWalkable}`);
  }

  // Run A* pathfinding
  const gridPath = astar(startGrid, endGrid, navGrid.grid, gridSize);

  if (!gridPath || gridPath.length === 0) {
    if (DEBUG_PATHFINDING) console.log(`[Pathfinding] A* failed to find path`);
    return [startNorm, endNorm];
  }

  if (DEBUG_PATHFINDING) {
    console.log(`[Pathfinding] A* found path with ${gridPath.length} points`);
  }

  // Simplify path to reduce waypoints while preserving shape
  // Only simplify if path is long to avoid performance issues
  let finalPath: GridPoint[];
  if (gridPath.length > 100) {
    // For long paths, use minimal simplification
    finalPath = simplifyPath(gridPath, 0.3);
  } else {
    // For shorter paths, keep more detail
    finalPath = simplifyPath(gridPath, 0.1);
  }

  // Ensure minimum of 3 points if original had more than 2
  if (gridPath.length > 2 && finalPath.length <= 2) {
    // Simplification was too aggressive - sample evenly from original
    const step = Math.max(1, Math.floor(gridPath.length / 5)); // Ensure step is at least 1
    finalPath = [];
    for (let i = 0; i < gridPath.length; i += step) {
      finalPath.push(gridPath[i]);
    }
    // Add last point if not already included
    if (finalPath[finalPath.length - 1] !== gridPath[gridPath.length - 1]) {
      finalPath.push(gridPath[gridPath.length - 1]);
    }
  }

  if (DEBUG_PATHFINDING) {
    console.log(`[Pathfinding] Raw: ${gridPath.length} pts, Final: ${finalPath.length} pts`);
  }

  // Convert grid path back to normalized coordinates
  const normalizedPath = finalPath.map(p =>
    gridToNormalizedCoord(p.row, p.col, gridSize)
  );

  // Ensure start and end points are exact
  normalizedPath[0] = startNorm;
  normalizedPath[normalizedPath.length - 1] = endNorm;

  return normalizedPath;
}

/**
 * Find optimal ghost position that is:
 * 1. Within trade distance of the death location
 * 2. On a walkable area (not in a wall)
 * 3. Along the path toward the nearest teammate
 */
export function findOptimalGhostPosition(
  deathX: number,
  deathY: number,
  teammateX: number,
  teammateY: number,
  tradeDistance: number,
  mapName: string
): Point | null {
  const navGrid = getNavGrid(mapName);
  if (!navGrid) return null;

  // Convert death and teammate positions to normalized
  const deathNorm = gridToNormalized(deathX, deathY, mapName);
  const teammateNorm = gridToNormalized(teammateX, teammateY, mapName);

  if (!deathNorm || !teammateNorm) return null;

  const gridSize = navGrid.gridSize;
  const deathGrid = normalizedToGrid(deathNorm.x, deathNorm.y, gridSize);
  const teammateGrid = normalizedToGrid(teammateNorm.x, teammateNorm.y, gridSize);

  // Find path from death to teammate
  const fullPath = astar(deathGrid, teammateGrid, navGrid.grid, gridSize);

  if (!fullPath || fullPath.length < 2) {
    return null;
  }

  // Calculate trade distance in grid units (approximate)
  // Trade distance is in game units, we need to convert to grid units
  // Average map size is roughly 15000 game units, grid is 128 cells
  const gameToGridScale = gridSize / 15000;
  const tradeDistanceGrid = tradeDistance * gameToGridScale * 0.8; // 80% of trade distance

  // Walk along the path until we reach trade distance from death
  let accumulatedDistance = 0;
  let targetIndex = 1;

  for (let i = 1; i < fullPath.length; i++) {
    const prev = fullPath[i - 1];
    const curr = fullPath[i];
    const segmentDist = Math.sqrt(
      (curr.col - prev.col) ** 2 + (curr.row - prev.row) ** 2
    );
    accumulatedDistance += segmentDist;

    if (accumulatedDistance >= tradeDistanceGrid) {
      targetIndex = i;
      break;
    }
  }

  // Get the target position
  const targetGrid = fullPath[Math.min(targetIndex, fullPath.length - 1)];

  // Convert back to normalized coordinates
  const targetNorm = gridToNormalizedCoord(targetGrid.row, targetGrid.col, gridSize);

  return targetNorm;
}

/**
 * Check if a position is walkable
 */
export function isWalkable(
  gameX: number,
  gameY: number,
  mapName: string
): boolean {
  const navGrid = getNavGrid(mapName);
  if (!navGrid) return true; // Assume walkable if no data

  const norm = gridToNormalized(gameX, gameY, mapName);
  if (!norm) return true;

  const gridSize = navGrid.gridSize;
  const gridPos = normalizedToGrid(norm.x, norm.y, gridSize);

  return navGrid.grid[gridPos.row]?.[gridPos.col] === 1;
}

/**
 * Find nearest walkable position to a given game coordinate
 */
export function findNearestWalkablePosition(
  gameX: number,
  gameY: number,
  mapName: string
): Point | null {
  const navGrid = getNavGrid(mapName);
  if (!navGrid) return null;

  const norm = gridToNormalized(gameX, gameY, mapName);
  if (!norm) return null;

  const gridSize = navGrid.gridSize;
  const gridPos = normalizedToGrid(norm.x, norm.y, gridSize);

  // If already walkable, return original position
  if (navGrid.grid[gridPos.row]?.[gridPos.col] === 1) {
    return norm;
  }

  // Find nearest walkable cell
  const nearest = findNearestWalkable(gridPos, navGrid.grid, gridSize);
  if (!nearest) return norm;

  return gridToNormalizedCoord(nearest.row, nearest.col, gridSize);
}

export function pathCrossesWall(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  mapName: string
): boolean {
  const navGrid = getNavGrid(mapName);
  if (!navGrid) return false;

  const startNorm = gridToNormalized(startX, startY, mapName);
  const endNorm = gridToNormalized(endX, endY, mapName);

  if (!startNorm || !endNorm) return false;

  const gridSize = navGrid.gridSize;
  const startGrid = normalizedToGrid(startNorm.x, startNorm.y, gridSize);
  const endGrid = normalizedToGrid(endNorm.x, endNorm.y, gridSize);

  // Use Bresenham's line algorithm to check cells along the line
  const dx = Math.abs(endGrid.col - startGrid.col);
  const dy = Math.abs(endGrid.row - startGrid.row);
  const sx = startGrid.col < endGrid.col ? 1 : -1;
  const sy = startGrid.row < endGrid.row ? 1 : -1;
  let err = dx - dy;

  let col = startGrid.col;
  let row = startGrid.row;

  while (true) {
    // Check if current cell is a wall
    if (navGrid.grid[row]?.[col] === 0) {
      return true; // Found a wall
    }

    if (col === endGrid.col && row === endGrid.row) break;

    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      col += sx;
    }
    if (e2 < dx) {
      err += dx;
      row += sy;
    }
  }

  return false;
}
