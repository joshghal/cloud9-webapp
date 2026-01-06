'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MapBounds } from '@/types';

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

interface MapCanvasProps {
  mapName: string;
  deaths: DeathMarker[];
  playerPositions?: PlayerPosition[];
  showTradeWeb?: boolean;
  tradeableThreshold?: number; // Distance threshold for tradeable
  bounds?: MapBounds;
  onDeathClick?: (death: DeathMarker) => void;
}

// Default bounds if not provided
const DEFAULT_BOUNDS: MapBounds = {
  min: { x: -6000, y: -6000 },
  max: { x: 6000, y: 6000 }
};

// Map image paths - will use placeholder if image not found
const MAP_IMAGES: Record<string, string> = {
  lotus: '/maps/lotus.png',
  haven: '/maps/haven.png',
  ascent: '/maps/ascent.png',
  bind: '/maps/bind.png',
  icebox: '/maps/icebox.png',
  sunset: '/maps/sunset.png',
  fracture: '/maps/fracture.png',
  abyss: '/maps/abyss.png',
  pearl: '/maps/pearl.png',
  split: '/maps/split.png',
};

export function MapCanvas({
  mapName,
  deaths,
  playerPositions = [],
  showTradeWeb = false,
  tradeableThreshold = 2000,
  bounds = DEFAULT_BOUNDS,
  onDeathClick,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 400, height: 400 });
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

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

  // Convert game coordinates to canvas coordinates
  const gameToCanvas = useCallback((gameX: number, gameY: number) => {
    const { width, height } = dimensions;
    const { min, max } = bounds;

    // Normalize to 0-1 range
    const normalizedX = (gameX - min.x) / (max.x - min.x);
    const normalizedY = (gameY - min.y) / (max.y - min.y);

    // Convert to canvas coordinates (flip Y for screen coords)
    return {
      x: normalizedX * width,
      y: (1 - normalizedY) * height, // Flip Y axis
    };
  }, [dimensions, bounds]);

  // Calculate distance between two game positions
  const getDistance = (x1: number, y1: number, x2: number, y2: number) => {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
  };

  // Get map image path
  const mapKey = mapName.toLowerCase().replace(/[^a-z]/g, '');
  const mapImage = MAP_IMAGES[mapKey] || null;

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
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center text-[#a0aec0]/50">
            <p className="text-lg font-medium">{mapName || 'Map'}</p>
            <p className="text-xs">No image available</p>
          </div>
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

      {/* Trade Web Lines */}
      {showTradeWeb && c9Positions.length > 1 && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {c9Positions.map((player1, i) =>
            c9Positions.slice(i + 1).map((player2, j) => {
              const pos1 = gameToCanvas(player1.x, player1.y);
              const pos2 = gameToCanvas(player2.x, player2.y);
              const distance = getDistance(player1.x, player1.y, player2.x, player2.y);
              const isTradeable = distance <= tradeableThreshold;

              return (
                <line
                  key={`${player1.name}-${player2.name}`}
                  x1={pos1.x}
                  y1={pos1.y}
                  x2={pos2.x}
                  y2={pos2.y}
                  stroke={isTradeable ? '#2ed573' : '#ff4757'}
                  strokeWidth={isTradeable ? 2 : 1}
                  strokeDasharray={isTradeable ? 'none' : '5,5'}
                  opacity={isTradeable ? 0.7 : 0.4}
                />
              );
            })
          )}
        </svg>
      )}

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
    </div>
  );
}
