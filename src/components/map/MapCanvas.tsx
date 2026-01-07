'use client';

import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MapBounds } from '@/types';
import { getMapConfig, getCalibration, getReferencePoints } from '@/config/maps';

interface DeathMarker {
  id: string;
  x: number;
  y: number;
  player: string;
  team: 'c9' | 'opp';
  killer?: string;
  round: number;
  timestamp?: number;
}

interface PlayerPosition {
  name: string;
  x: number;
  y: number;
  team: 'c9' | 'opp';
}

interface GhostTeammate {
  id: string;
  deathX: number;
  deathY: number;
  deadPlayer: string;
  ghostX: number;
  ghostY: number;
  nearestPlayer: string;
  actualDistance: number;
  optimalDistance: number;
  round: number;
}

interface MapCanvasProps {
  mapName: string;
  deaths: DeathMarker[];
  playerPositions?: PlayerPosition[];
  ghostTeammates?: GhostTeammate[];
  showTradeWeb?: boolean;
  tradeableThreshold?: number; // Distance threshold for tradeable
  bounds?: MapBounds;
  onDeathClick?: (death: DeathMarker) => void;
  showReferencePoints?: boolean; // Show calibration reference points
}

// Default bounds if not provided (fallback for maps without valorant-api config)
const DEFAULT_BOUNDS: MapBounds = {
  min: { x: -5000, y: -12000 },
  max: { x: 9000, y: 3000 }
};

export function MapCanvas({
  mapName,
  deaths,
  playerPositions = [],
  ghostTeammates = [],
  showTradeWeb = false,
  tradeableThreshold = 2000,
  bounds = DEFAULT_BOUNDS,
  onDeathClick,
  showReferencePoints = false,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Get map config, calibration, and reference points
  const mapConfig = useMemo(() => getMapConfig(mapName), [mapName]);
  const calibration = useMemo(() => getCalibration(mapName), [mapName]);
  const referencePoints = useMemo(() => getReferencePoints(mapName), [mapName]);

  // Update dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height: width }); // Square aspect ratio
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Reset image state when map changes
  useEffect(() => {
    setImageLoaded(false);
    setImageError(false);
  }, [mapName]);

  // Convert game coordinates to canvas coordinates
  // Uses GRID bounds for positioning, with calibration adjustments
  const gameToCanvas = useCallback((gameX: number, gameY: number) => {
    const { width, height } = dimensions;
    const { min, max } = bounds;

    // Calculate ranges
    const rangeX = max.x - min.x || 1;
    const rangeY = max.y - min.y || 1;

    // Normalize to 0-1 based on bounds
    const rawNormX = (gameX - min.x) / rangeX;
    const rawNormY = (gameY - min.y) / rangeY;

    // Apply calibration scale (around center 0.5)
    const scaledX = 0.5 + (rawNormX - 0.5) * calibration.scale;
    const scaledY = 0.5 + (rawNormY - 0.5) * calibration.scale;

    // Apply calibration offset
    const calibratedX = scaledX + calibration.offsetX;
    const calibratedY = scaledY + calibration.offsetY;

    // Add small padding so edge markers stay visible
    const padding = 0.02;
    const innerScale = 1 - (padding * 2);
    const normalizedX = padding + calibratedX * innerScale;
    const normalizedY = padding + calibratedY * innerScale;

    // Clamp to valid range
    const clampedX = Math.max(0, Math.min(1, normalizedX));
    const clampedY = Math.max(0, Math.min(1, normalizedY));

    return {
      x: clampedX * width,
      y: (1 - clampedY) * height, // Flip Y axis (GRID Y increases upward)
    };
  }, [dimensions, bounds, calibration]);

  // Calculate distance between two game positions
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Get map image from config
  const mapImage = mapConfig?.image || null;

  // Filter C9 players for trade web
  const c9Positions = playerPositions.filter(p => p.team === 'c9');

  return (
    <div
      ref={containerRef}
      className="map-container relative w-full aspect-square bg-[#060d17] rounded-lg overflow-hidden"
    >
      {/* Map Background */}
      {mapImage && !imageError ? (
        <img
          src={mapImage}
          alt={mapName}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? 'opacity-40' : 'opacity-0'
          }`}
          style={{
            transform: [
              mapConfig?.rotation ? `rotate(${mapConfig.rotation}deg)` : '',
              mapConfig?.flipX ? 'scaleX(-1)' : '',
              mapConfig?.flipY ? 'scaleY(-1)' : '',
              mapConfig?.zoom ? `scale(${mapConfig.zoom})` : '',
              mapConfig?.scaleX ? `scaleX(${mapConfig.scaleX})` : '',
              mapConfig?.scaleY ? `scaleY(${mapConfig.scaleY})` : '',
            ].filter(Boolean).join(' ') || undefined,
          }}
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-[#a0aec0]/50">
            <p className="text-lg font-medium">{mapConfig?.displayName || mapName || 'Map'}</p>
            <p className="text-xs">No image available</p>
          </div>
        </div>
      )}

      {/* Map Name Label */}
      {mapName && (
        <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 rounded text-xs text-white font-medium">
          {mapConfig?.displayName || mapName}
        </div>
      )}

      {/* Grid overlay for reference */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#a0aec0" strokeWidth="0.5"/>
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>

      {/* Proximity Lines - Green = close, Red = far (walls not considered) */}
      {showTradeWeb && c9Positions.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {c9Positions.map((player1, i) =>
            c9Positions.slice(i + 1).map((player2) => {
              const pos1 = gameToCanvas(player1.x, player1.y);
              const pos2 = gameToCanvas(player2.x, player2.y);
              const distance = getDistance(player1.x, player1.y, player2.x, player2.y);
              const isClose = distance <= tradeableThreshold;

              return (
                <line
                  key={`${player1.name}-${player2.name}`}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={isClose ? '#2ed573' : '#ff4757'}
                  strokeWidth={isClose ? 2 : 1}
                  strokeDasharray={isClose ? 'none' : '5,5'}
                  opacity={isClose ? 0.7 : 0.4}
                />
              );
            })
          )}
        </svg>
      )}

      {/* Ghost Teammate Markers - Shows where teammates SHOULD have been */}
      <AnimatePresence>
        {ghostTeammates.map((ghost) => {
          const deathPos = gameToCanvas(ghost.deathX, ghost.deathY);
          const ghostPos = gameToCanvas(ghost.ghostX, ghost.ghostY);

          return (
            <div key={ghost.id}>
              {/* Line from death to ghost position */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <line
                  x1={deathPos.x}
                  y1={deathPos.y}
                  x2={ghostPos.x}
                  y2={ghostPos.y}
                  stroke="#ffa502"
                  strokeWidth="2"
                  strokeDasharray="6,4"
                  opacity="0.8"
                />
              </svg>

              {/* Ghost marker */}
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                style={{ left: ghostPos.x, top: ghostPos.y }}
              >
                <div className="w-8 h-8 rounded-full bg-[#ffa502]/30 border-2 border-dashed border-[#ffa502] flex items-center justify-center">
                  <span className="text-xs font-bold text-[#ffa502]">?</span>
                </div>
                <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 whitespace-nowrap">
                  <span className="text-[9px] bg-[#ffa502] text-black font-bold px-1.5 py-0.5 rounded">
                    {ghost.nearestPlayer}
                  </span>
                </div>
              </motion.div>
            </div>
          );
        })}
      </AnimatePresence>

      {/* Reference Point Markers (for calibration) */}
      {showReferencePoints && referencePoints.map((point) => {
        const pos = gameToCanvas(point.x, point.y);
        return (
          <div
            key={`ref-${point.name}`}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{ left: pos.x, top: pos.y }}
          >
            {/* Crosshair marker */}
            <div className="relative">
              <div className="absolute w-6 h-0.5 bg-yellow-400 -left-3 top-0" />
              <div className="absolute w-0.5 h-6 bg-yellow-400 left-0 -top-3" />
              <div className="absolute w-3 h-3 rounded-full bg-yellow-400/50 -left-1.5 -top-1.5 border-2 border-yellow-400" />
            </div>
            {/* Label with coordinates */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
              <span className="block text-[10px] font-bold px-1.5 py-0.5 rounded-t bg-yellow-400 text-black">
                {point.name}
              </span>
              <span className="block text-[8px] font-mono px-1.5 py-0.5 rounded-b bg-black/80 text-yellow-400">
                {point.x.toFixed(0)}, {point.y.toFixed(0)}
              </span>
            </div>
          </div>
        );
      })}

      {/* Player Position Markers */}
      <AnimatePresence>
        {playerPositions.map((player) => {
          const pos = gameToCanvas(player.x, player.y);
          return (
            <motion.div
              key={`pos-${player.name}`}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className={`absolute w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-bold transform -translate-x-1/2 -translate-y-1/2 ${
                player.team === 'c9'
                  ? 'bg-[#00a8e8] text-white shadow-[0_0_10px_#00a8e8]'
                  : 'bg-[#ff4757] text-white shadow-[0_0_10px_#ff4757]'
              }`}
              style={{ left: pos.x, top: pos.y }}
            >
              {player.name.slice(0, 2).toUpperCase()}
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Death Markers */}
      <AnimatePresence>
        {deaths.map((death) => {
          const pos = gameToCanvas(death.x, death.y);
          return (
            <motion.div
              key={death.id}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: 1,
                opacity: 1,
                transition: { type: 'spring', stiffness: 500, damping: 25 }
              }}
              exit={{ scale: 0, opacity: 0 }}
              onClick={() => onDeathClick?.(death)}
              className={`absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 ${
                onDeathClick ? 'hover:scale-125' : ''
              }`}
              style={{ left: pos.x, top: pos.y }}
            >
              {/* Death X marker */}
              <div className={`relative w-5 h-5 ${death.team === 'c9' ? 'text-[#00a8e8]' : 'text-[#ff4757]'}`}>
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full drop-shadow-lg">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
                {/* Pulse ring */}
                <motion.div
                  className={`absolute inset-0 rounded-full ${
                    death.team === 'c9' ? 'bg-[#00a8e8]' : 'bg-[#ff4757]'
                  }`}
                  initial={{ scale: 1, opacity: 0.5 }}
                  animate={{
                    scale: [1, 2, 2],
                    opacity: [0.5, 0.2, 0],
                  }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                />
              </div>

              {/* Player name tooltip */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  death.team === 'c9'
                    ? 'bg-[#00a8e8]/80 text-white'
                    : 'bg-[#ff4757]/80 text-white'
                }`}>
                  {death.player}
                </span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Legend */}
      <div className="absolute bottom-2 left-2 flex gap-3 text-[10px] text-[#a0aec0]">
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#00a8e8]" />
          <span>C9</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-[#ff4757]" />
          <span>Enemy</span>
        </div>
      </div>

      {/* Round indicator */}
      {deaths.length > 0 && (
        <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-xs text-white">
          {deaths.length} death{deaths.length !== 1 ? 's' : ''}
        </div>
      )}

      {/* Debug: Show bounds and aspect info */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute bottom-2 right-2 px-2 py-1 bg-black/70 rounded text-[8px] text-white/70 font-mono">
          {((bounds.max.x - bounds.min.x) / (bounds.max.y - bounds.min.y)).toFixed(2)} aspect
          {showTradeWeb && ` | ${c9Positions.length}p`}
        </div>
      )}
    </div>
  );
}
