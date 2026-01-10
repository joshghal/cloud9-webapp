/**
 * Test pathfinding to verify it works correctly
 */

import { NAV_GRIDS, getNavGrid } from '../src/data/navgrids';

// Simple A* implementation for testing (copied from pathfinding.ts logic)
interface GridPoint {
  row: number;
  col: number;
}

function heuristic(a: GridPoint, b: GridPoint): number {
  return Math.sqrt((a.col - b.col) ** 2 + (a.row - b.row) ** 2);
}

function getNeighbors(row: number, col: number, grid: number[][], gridSize: number): GridPoint[] {
  const neighbors: GridPoint[] = [];
  const directions = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];

  for (const [dr, dc] of directions) {
    const newRow = row + dr;
    const newCol = col + dc;
    if (newRow >= 0 && newRow < gridSize && newCol >= 0 && newCol < gridSize) {
      if (grid[newRow][newCol] === 1) {
        if (dr !== 0 && dc !== 0) {
          if (grid[row + dr][col] === 0 || grid[row][col + dc] === 0) continue;
        }
        neighbors.push({ row: newRow, col: newCol });
      }
    }
  }
  return neighbors;
}

function astar(start: GridPoint, end: GridPoint, grid: number[][], gridSize: number): GridPoint[] | null {
  interface AStarNode {
    row: number;
    col: number;
    g: number;
    h: number;
    f: number;
    parent: AStarNode | null;
  }

  const openSet: AStarNode[] = [];
  const closedSet = new Set<string>();

  const startNode: AStarNode = {
    row: start.row,
    col: start.col,
    g: 0,
    h: heuristic(start, end),
    f: 0,
    parent: null,
  };
  startNode.f = startNode.g + startNode.h;
  openSet.push(startNode);

  let iterations = 0;
  const maxIterations = gridSize * gridSize;

  while (openSet.length > 0 && iterations < maxIterations) {
    iterations++;
    openSet.sort((a, b) => a.f - b.f);
    const current = openSet.shift()!;
    const currentKey = `${current.row},${current.col}`;

    if (current.row === end.row && current.col === end.col) {
      const path: GridPoint[] = [];
      let node: AStarNode | null = current;
      while (node) {
        path.unshift({ row: node.row, col: node.col });
        node = node.parent;
      }
      return path;
    }

    closedSet.add(currentKey);

    for (const neighbor of getNeighbors(current.row, current.col, grid, gridSize)) {
      const neighborKey = `${neighbor.row},${neighbor.col}`;
      if (closedSet.has(neighborKey)) continue;

      const isDiagonal = neighbor.row !== current.row && neighbor.col !== current.col;
      const g = current.g + (isDiagonal ? 1.414 : 1);
      const existingNode = openSet.find(n => n.row === neighbor.row && n.col === neighbor.col);

      if (!existingNode) {
        const h = heuristic(neighbor, end);
        openSet.push({ row: neighbor.row, col: neighbor.col, g, h, f: g + h, parent: current });
      } else if (g < existingNode.g) {
        existingNode.g = g;
        existingNode.f = g + existingNode.h;
        existingNode.parent = current;
      }
    }
  }

  return null;
}

// Test function
function testPathfinding() {
  const mapName = 'haven';
  const navGrid = getNavGrid(mapName);

  if (!navGrid) {
    console.error('Failed to load nav grid for', mapName);
    return;
  }

  console.log(`Testing pathfinding on ${mapName}`);
  console.log(`Grid size: ${navGrid.gridSize}x${navGrid.gridSize}`);

  // Count walkable vs wall cells
  let walkable = 0;
  let walls = 0;
  for (const row of navGrid.grid) {
    for (const cell of row) {
      if (cell === 1) walkable++;
      else walls++;
    }
  }
  console.log(`Walkable: ${walkable}, Walls: ${walls} (${((walkable / (walkable + walls)) * 100).toFixed(1)}% walkable)`);

  // Find some walkable cells to test pathfinding between
  const walkableCells: GridPoint[] = [];
  for (let row = 0; row < navGrid.gridSize; row++) {
    for (let col = 0; col < navGrid.gridSize; col++) {
      if (navGrid.grid[row][col] === 1) {
        walkableCells.push({ row, col });
      }
    }
  }

  console.log(`\nFound ${walkableCells.length} walkable cells`);

  // Test path between opposite corners of the walkable area
  const start = walkableCells[0];
  const end = walkableCells[walkableCells.length - 1];

  console.log(`\nTesting path from (${start.col}, ${start.row}) to (${end.col}, ${end.row})`);
  console.log(`Start walkable: ${navGrid.grid[start.row][start.col] === 1}`);
  console.log(`End walkable: ${navGrid.grid[end.row][end.col] === 1}`);

  const path = astar(start, end, navGrid.grid, navGrid.gridSize);

  if (path) {
    console.log(`\nPath found with ${path.length} points!`);
    console.log('First 5 points:', path.slice(0, 5));
    console.log('Last 5 points:', path.slice(-5));

    // Check if path is straight or has turns
    if (path.length > 2) {
      let turns = 0;
      for (let i = 2; i < path.length; i++) {
        const dir1 = {
          dr: path[i-1].row - path[i-2].row,
          dc: path[i-1].col - path[i-2].col,
        };
        const dir2 = {
          dr: path[i].row - path[i-1].row,
          dc: path[i].col - path[i-1].col,
        };
        if (dir1.dr !== dir2.dr || dir1.dc !== dir2.dc) {
          turns++;
        }
      }
      console.log(`Path has ${turns} direction changes (turns)`);
    }
  } else {
    console.log('\nNo path found!');
  }

  // Test a specific scenario - path that should go around a wall
  // Find two walkable cells that have a wall between them
  console.log('\n--- Testing wall avoidance ---');
  const midRow = Math.floor(navGrid.gridSize / 2);
  const midCol = Math.floor(navGrid.gridSize / 2);

  // Find walkable cell on left side
  let leftCell: GridPoint | null = null;
  for (let col = 0; col < midCol && !leftCell; col++) {
    if (navGrid.grid[midRow]?.[col] === 1) {
      leftCell = { row: midRow, col };
    }
  }

  // Find walkable cell on right side
  let rightCell: GridPoint | null = null;
  for (let col = navGrid.gridSize - 1; col > midCol && !rightCell; col--) {
    if (navGrid.grid[midRow]?.[col] === 1) {
      rightCell = { row: midRow, col };
    }
  }

  if (leftCell && rightCell) {
    console.log(`Testing path from left (${leftCell.col}, ${leftCell.row}) to right (${rightCell.col}, ${rightCell.row})`);

    // Check if there's a wall in between
    let wallsBetween = 0;
    for (let col = leftCell.col + 1; col < rightCell.col; col++) {
      if (navGrid.grid[midRow][col] === 0) wallsBetween++;
    }
    console.log(`Walls in direct path: ${wallsBetween}`);

    const horizontalPath = astar(leftCell, rightCell, navGrid.grid, navGrid.gridSize);
    if (horizontalPath) {
      console.log(`Path found with ${horizontalPath.length} points`);

      // Check if path went around
      const minRow = Math.min(...horizontalPath.map(p => p.row));
      const maxRow = Math.max(...horizontalPath.map(p => p.row));
      console.log(`Path row range: ${minRow} to ${maxRow} (started at ${midRow})`);

      if (minRow < midRow - 2 || maxRow > midRow + 2) {
        console.log('Path successfully went AROUND obstacles!');
      } else {
        console.log('Path appears to be mostly horizontal');
      }
    } else {
      console.log('No path found between left and right');
    }
  }

  // Print a small section of the grid for visual inspection
  console.log('\n--- Grid sample (center 20x20) ---');
  const centerRow = Math.floor(navGrid.gridSize / 2);
  const centerCol = Math.floor(navGrid.gridSize / 2);
  for (let r = centerRow - 10; r < centerRow + 10; r++) {
    let row = '';
    for (let c = centerCol - 10; c < centerCol + 10; c++) {
      row += navGrid.grid[r]?.[c] === 1 ? '.' : '#';
    }
    console.log(row);
  }
}

testPathfinding();
