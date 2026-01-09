/**
 * Data-Driven Thresholds for Intervention Engine Frontend
 *
 * All values derived from analysis of 750 rounds of C9 VALORANT match data.
 * See docs/THRESHOLDS.md for methodology and derivation details.
 * These values mirror the backend constants in src/constants/thresholds.py
 *
 * Last updated: January 2026
 * Data source: 15 GRID matches, 750 rounds, 5,193 deaths
 */

// =============================================================================
// TRADE DETECTION
// =============================================================================

/** Time window for trade detection (90th percentile of actual trade times) */
export const TRADE_WINDOW_MS = 7000;

/** Optimal distance for trade positioning (median of successful trades) */
export const OPTIMAL_TRADE_DISTANCE = 1250;

/** Maximum distance where trade is still possible (90th percentile) */
export const MAX_TRADEABLE_DISTANCE = 3900;

/** C9's historical trade rate benchmark (as decimal) */
export const BENCHMARK_TRADE_RATE = 0.327;

/** Movement speed assumption for trade time estimation */
export const PLAYER_MOVEMENT_SPEED = 500;

// =============================================================================
// FRONTEND DISPLAY THRESHOLDS
// =============================================================================

// Color thresholds for trade rate display
/** Trade rate >= this is green (good) */
export const TRADE_RATE_GOOD = 50;
/** Trade rate < this is red (below warning = red) */
export const TRADE_RATE_WARNING = 30;

// Color thresholds for distance display
/** Distance <= this is green (good) */
export const DISTANCE_GOOD = 1200;
/** Distance > this is red (above warning = red) */
export const DISTANCE_WARNING = 2000;

// Color thresholds for K/D display
/** K/D >= this is green */
export const KD_GOOD = 1.2;
/** K/D < this is red (below warning = red) */
export const KD_WARNING = 0.8;

// Untradeable percentage threshold
/** Percentage > this shows as red warning */
export const UNTRADEABLE_WARNING = 50;

// =============================================================================
// POSITION VISUALIZATION
// =============================================================================

/** Scale factor for converting game units to pixels */
export const POSITION_SCALE_FACTOR = 0.05;

/** Visual circle for optimal trade distance (OPTIMAL_TRADE_DISTANCE * POSITION_SCALE_FACTOR) */
export const OPTIMAL_TRADE_RADIUS_PX = Math.round(OPTIMAL_TRADE_DISTANCE * POSITION_SCALE_FACTOR);

/** Visual circle for max tradeable distance (MAX_TRADEABLE_DISTANCE * POSITION_SCALE_FACTOR) */
export const MAX_TRADE_RADIUS_PX = Math.round(MAX_TRADEABLE_DISTANCE * POSITION_SCALE_FACTOR);

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get color class for distance value
 * @param distance Distance in game units
 * @returns Tailwind color class
 */
export function getDistanceColor(distance: number): string {
  if (distance <= DISTANCE_GOOD) return 'text-green-400';
  if (distance <= DISTANCE_WARNING) return 'text-[#ffa502]';
  return 'text-[#ff4757]';
}

/**
 * Get color class for trade rate percentage
 * @param tradeRate Trade rate as percentage (0-100)
 * @returns Tailwind color class
 */
export function getTradeRateColor(tradeRate: number): string {
  if (tradeRate >= TRADE_RATE_GOOD) return 'text-green-400';
  if (tradeRate >= TRADE_RATE_WARNING) return 'text-[#ffa502]';
  return 'text-[#ff4757]';
}

/**
 * Get color class for K/D ratio
 * @param kd K/D ratio
 * @returns Tailwind color class
 */
export function getKDColor(kd: number): string {
  if (kd >= KD_GOOD) return 'text-green-400';
  if (kd >= KD_WARNING) return 'text-[#ffa502]';
  return 'text-[#ff4757]';
}

/**
 * Get color class for performance rating
 * @param rating Performance rating
 * @returns Tailwind color class
 */
export function getRatingColor(rating: number): string {
  if (rating >= KD_GOOD) return 'text-green-400';
  if (rating >= 1.0) return 'text-blue-400';
  if (rating >= KD_WARNING) return 'text-[#ffa502]';
  return 'text-[#ff4757]';
}
