'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  RoundUpdate,
  TimeoutAlert,
  KillEvent,
  MatchInfo,
  ReplayComplete,
  TradeTimeEntry,
  MapBounds
} from '@/types';

interface DeathEvent {
  id: string;
  x: number;
  y: number;
  player: string;
  team: 'c9' | 'opp';
  killer: string;
  round: number;
}

interface PlayerPositionData {
  pos: [number, number];
  team: 'c9' | 'opp';
}

interface PositionUpdate {
  positions: Record<string, PlayerPositionData>;
  map_bounds: MapBounds;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || API_BASE;

interface WinProbabilityEntry {
  round: number;
  probability: number;
  event?: string;
  c9Score: number;
  oppScore: number;
}

interface AbilityUsage {
  player: string;
  team: 'c9' | 'opp';
  ability: string;
  round: number;
  timestamp: string;
}

interface PanicUtilityEvent {
  player: string;
  ability: string;
  round: number;
  timeToDeath: number; // milliseconds
}

interface GhostTeammate {
  id: string;
  deathX: number;    // Where C9 player died
  deathY: number;
  deadPlayer: string;
  ghostX: number;    // Where teammate SHOULD have been
  ghostY: number;
  nearestPlayer: string;  // Nearest teammate who was too far
  actualDistance: number;
  optimalDistance: number;
  round: number;
}

// Series-level data for multi-game matches
interface GameData {
  gameNumber: number;
  mapName: string;
  alerts: TimeoutAlert[];
  panicUtilityEvents: PanicUtilityEvent[];
  tradeTimeHistory: TradeTimeEntry[];
  finalScore?: string;
}

interface SeriesData {
  games: GameData[];
  allAlerts: TimeoutAlert[];
  allPanicEvents: PanicUtilityEvent[];
  allTradeTimeHistory: { gameNumber: number; mapName: string; entries: TradeTimeEntry[] }[];
}

interface UseSocketReturn {
  // Connection state
  isConnected: boolean;
  isRunning: boolean;
  error: string | null;

  // Match data
  matches: MatchInfo[];
  currentMatch: string | null;

  // Live data (current game)
  roundData: RoundUpdate | null;
  alerts: TimeoutAlert[];
  killFeed: KillEvent[];
  tradeTimeHistory: TradeTimeEntry[];
  winProbabilityHistory: WinProbabilityEntry[];
  panicUtilityEvents: PanicUtilityEvent[];

  // Series data (all games combined)
  seriesData: SeriesData;

  // Map visualization data
  deaths: DeathEvent[];
  roundDeaths: DeathEvent[];
  playerPositions: Record<string, PlayerPositionData>;
  mapBounds: MapBounds | null;
  ghostTeammates: GhostTeammate[];

  // Replay complete data
  replayComplete: ReplayComplete | null;

  // Actions
  startReplay: (filename: string, speed: number, aiEnabled: boolean) => void;
  stopReplay: () => void;
  changeSpeed: (speed: number) => void;
  pauseReplay: () => void;
  resumeReplay: () => void;
  fetchMatches: () => void;
  clearRoundDeaths: () => void;
}

export function useSocket(): UseSocketReturn {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [matches, setMatches] = useState<MatchInfo[]>([]);
  const [currentMatch, setCurrentMatch] = useState<string | null>(null);

  const [roundData, setRoundData] = useState<RoundUpdate | null>(null);
  const [alerts, setAlerts] = useState<TimeoutAlert[]>([]);
  const [killFeed, setKillFeed] = useState<KillEvent[]>([]);
  const [tradeTimeHistory, setTradeTimeHistory] = useState<TradeTimeEntry[]>([]);
  const [winProbabilityHistory, setWinProbabilityHistory] = useState<WinProbabilityEntry[]>([]);
  const [panicUtilityEvents, setPanicUtilityEvents] = useState<PanicUtilityEvent[]>([]);
  const recentAbilities = useRef<AbilityUsage[]>([]);

  // Map visualization state
  const [deaths, setDeaths] = useState<DeathEvent[]>([]);
  const [roundDeaths, setRoundDeaths] = useState<DeathEvent[]>([]);
  const [playerPositions, setPlayerPositions] = useState<Record<string, PlayerPositionData>>({});
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const deathIdCounter = useRef(0);

  const [replayComplete, setReplayComplete] = useState<ReplayComplete | null>(null);
  const [ghostTeammates, setGhostTeammates] = useState<GhostTeammate[]>([]);
  const ghostIdCounter = useRef(0);
  const playerPositionsRef = useRef<Record<string, PlayerPositionData>>({});
  const lastRoundRef = useRef<number>(0);

  // Series-level tracking (persists across games)
  const [seriesData, setSeriesData] = useState<SeriesData>({
    games: [],
    allAlerts: [],
    allPanicEvents: [],
    allTradeTimeHistory: [],
  });
  const currentGameRef = useRef<{ gameNumber: number; mapName: string }>({ gameNumber: 1, mapName: '' });

  // Initialize socket connection
  useEffect(() => {
    // Prevent duplicate connections in React 18 strict mode
    if (socketRef.current?.connected) {
      return;
    }

    const socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      console.log('Connected to Intervention Engine');
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setIsRunning(false);
      console.log('Disconnected from server');
    });

    socket.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
      console.error('Socket connection error:', err);
    });

    socket.on('error', (data: { message: string }) => {
      setError(data?.message);
    });

    socket.on('status', (data: { message: string }) => {
      console.log('Status:', data?.message);
    });

    // Replay events
    socket.on('replay_started', (data: { match: string; speed: number }) => {
      setIsRunning(true);
      setCurrentMatch(data?.match);
      setAlerts([]);
      setKillFeed([]);
      setTradeTimeHistory([]);
      setWinProbabilityHistory([]);
      setPanicUtilityEvents([]);
      recentAbilities.current = [];
      setDeaths([]);
      setRoundDeaths([]);
      setPlayerPositions({});
      playerPositionsRef.current = {};
      setGhostTeammates([]);
      ghostIdCounter.current = 0;
      lastRoundRef.current = 0;
      setReplayComplete(null);
      deathIdCounter.current = 0;
      // Reset series data for new replay
      setSeriesData({
        games: [],
        allAlerts: [],
        allPanicEvents: [],
        allTradeTimeHistory: [],
      });
      currentGameRef.current = { gameNumber: 1, mapName: '' };
      console.log(`Replay started: ${data?.match} at ${data?.speed}x`);
    });

    socket.on('replay_stopped', () => {
      setIsRunning(false);
      console.log('Replay stopped');
    });

    socket.on('replay_paused', () => {
      console.log('Replay paused');
    });

    socket.on('replay_resumed', () => {
      console.log('Replay resumed');
    });

    socket.on('replay_complete', (data: ReplayComplete) => {
      setIsRunning(false);
      setReplayComplete(data);
      console.log('Replay complete:', data?.final_score);
    });

    // Live data events
    socket.on('round_update', (data: RoundUpdate) => {
      setRoundData(data);

      // Clear ghost teammates and round deaths when round changes
      if (data?.round !== lastRoundRef.current) {
        lastRoundRef.current = data?.round;
        setGhostTeammates([]);
        setRoundDeaths([]);
      }

      // Update map bounds from round data if available
      if (data?.map?.bounds) {
        setMapBounds(data?.map.bounds);
      }

      // Track win probability history
      setWinProbabilityHistory(prev => {
        // Avoid duplicates
        const exists = prev.some(p => p.round === data?.round);
        if (exists) return prev;
        return [...prev, {
          round: data?.round,
          probability: data?.win_probability,
          c9Score: data?.c9_score,
          oppScore: data?.opp_score,
        }];
      });

      // Track trade time history for tilt graph
      if (data?.tilt?.has_data && data?.tilt.trade_time_current != null && data?.tilt.trade_time_current > 0) {
        const tradeTime = data?.tilt.trade_time_current;
        setTradeTimeHistory(prev => {
          // Avoid duplicates
          const exists = prev.some(t => t.round === data?.round);
          if (exists) return prev;
          return [...prev, {
            round: data?.round,
            trade_time_ms: tradeTime,
            traded: tradeTime < 5000
          }];
        });
      }
    });

    socket.on('timeout_alert', (data: TimeoutAlert) => {
      setAlerts(prev => [...prev, data]);
    });

    socket.on('kill_event', (data: KillEvent) => {
      setKillFeed(prev => [...prev.slice(-19), data]); // Keep last 20
    });

    // Ability usage tracking for panic utility detection
    socket.on('ability_used', (data: {
      player: string;
      team: 'c9' | 'opp';
      ability: string;
      round: number;
      timestamp: string;
    }) => {
      // Only track C9 abilities for panic utility detection
      if (data?.team === 'c9') {
        recentAbilities.current.push(data);
        // Keep only last 50 abilities to prevent memory bloat
        if (recentAbilities.current.length > 50) {
          recentAbilities.current = recentAbilities.current.slice(-50);
        }
      }
    });

    // Death event with position for map visualization
    socket.on('death_event', (data: {
      x: number;
      y: number;
      player: string;
      team: 'c9' | 'opp';
      killer: string;
      round: number;
      timestamp?: string;
    }) => {
      const death: DeathEvent = {
        ...data,
        id: `death-${deathIdCounter.current++}`,
      };
      setDeaths(prev => [...prev, death]);
      // Only add to roundDeaths if same round, and filter out any stale deaths
      setRoundDeaths(prev => {
        const currentRoundDeaths = prev.filter(d => d.round === data?.round);
        return [...currentRoundDeaths, death];
      });

      // Check for panic utility: C9 player used ability within 2 seconds of dying
      if (data?.team === 'c9') {
        const deathTime = data?.timestamp ? new Date(data?.timestamp).getTime() : Date.now();
        const panicThreshold = 2000; // 2 seconds

        // Find abilities used by this player in the last 2 seconds
        const panicAbilities = recentAbilities.current.filter(ability => {
          if (ability.player !== data?.player) return false;
          const abilityTime = new Date(ability.timestamp).getTime();
          const timeDiff = deathTime - abilityTime;
          return timeDiff >= 0 && timeDiff <= panicThreshold;
        });

        // Record panic utility events
        panicAbilities.forEach(ability => {
          const abilityTime = new Date(ability.timestamp).getTime();
          const timeToDeath = deathTime - abilityTime;

          setPanicUtilityEvents(prev => [...prev, {
            player: data?.player,
            ability: ability.ability,
            round: data?.round,
            timeToDeath
          }]);
        });

        // Remove used abilities from tracking
        recentAbilities.current = recentAbilities.current.filter(
          a => !panicAbilities.includes(a)
        );

        // Ghost Teammates: Clear first, then check if death was untradeable
        setGhostTeammates([]); // Always clear on any C9 death

        const positions = playerPositionsRef.current;
        const c9Teammates = Object.entries(positions)
          .filter(([name, posData]) => posData.team === 'c9' && name !== data?.player);

        if (c9Teammates.length > 0) {
          const TRADE_THRESHOLD = 2000; // units for trade distance

          // Find nearest teammate using reduce
          const nearestTeammate = c9Teammates.reduce<{ name: string; pos: [number, number]; distance: number } | null>(
            (nearest, [name, posData]) => {
              const dx = posData.pos[0] - data?.x;
              const dy = posData.pos[1] - data?.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (!nearest || distance < nearest.distance) {
                return { name, pos: posData.pos, distance };
              }
              return nearest;
            },
            null
          );

          // If nearest teammate was too far, create ghost position
          if (nearestTeammate && nearestTeammate.distance > TRADE_THRESHOLD) {
            // Calculate ghost position: along vector from death to teammate, at TRADE_THRESHOLD distance
            const dx = nearestTeammate.pos[0] - data?.x;
            const dy = nearestTeammate.pos[1] - data?.y;
            const distance = nearestTeammate.distance;

            // Normalize and scale to trade threshold
            const ghostX = data?.x + (dx / distance) * TRADE_THRESHOLD * 0.8;
            const ghostY = data?.y + (dy / distance) * TRADE_THRESHOLD * 0.8;

            const ghostId = `ghost-${ghostIdCounter.current++}`;
            setGhostTeammates([{
              id: ghostId,
              deathX: data?.x,
              deathY: data?.y,
              deadPlayer: data?.player,
              ghostX,
              ghostY,
              nearestPlayer: nearestTeammate.name,
              actualDistance: Math.round(nearestTeammate.distance),
              optimalDistance: TRADE_THRESHOLD,
              round: data?.round,
            }]);

            // Auto-clear ghost after 3 seconds
            setTimeout(() => {
              setGhostTeammates(prev => prev.filter(g => g.id !== ghostId));
            }, 3000);
          }
        }
      }
    });

    // Position updates for trade web
    socket.on('position_update', (data: PositionUpdate) => {
      setPlayerPositions(data?.positions);
      playerPositionsRef.current = data?.positions;
      if (data?.map_bounds) {
        setMapBounds(data?.map_bounds);
      }
    });

    // Round start - clear round deaths and ghost teammates
    socket.on('round_start', (data: { round: number; map_bounds?: MapBounds }) => {
      setRoundDeaths([]);
      setGhostTeammates([]);
      if (data?.map_bounds) {
        setMapBounds(data?.map_bounds);
      }
    });

    socket.on('speed_changed', (data: { speed: number }) => {
      console.log(`Speed changed to ${data?.speed}x`);
    });

    // Game changed (new map in series) - archive current game data, then reset
    socket.on('game_changed', (data: { map: { name: string }; game_number: number }) => {
      console.log(`Game changed to ${data?.map?.name} (Game ${data?.game_number})`);

      // Archive current game data to series before resetting
      setSeriesData(prev => {
        // Get current state values via closure - we need to capture them
        const currentAlerts = [...prev.allAlerts];
        const currentPanicEvents = [...prev.allPanicEvents];
        const currentTradeTime = [...prev.allTradeTimeHistory];

        return prev; // Will be updated properly below
      });

      // Use function form to access current state
      setAlerts(currentAlerts => {
        // Add to series
        setSeriesData(prev => ({
          ...prev,
          allAlerts: [...prev.allAlerts, ...currentAlerts.filter(a =>
            !prev.allAlerts.some(pa => pa.round === a.round && pa.score === a.score)
          )],
        }));
        return []; // Reset for new game
      });

      setPanicUtilityEvents(currentEvents => {
        setSeriesData(prev => ({
          ...prev,
          allPanicEvents: [...prev.allPanicEvents, ...currentEvents],
        }));
        return []; // Reset for new game
      });

      setTradeTimeHistory(currentHistory => {
        if (currentHistory.length > 0) {
          setSeriesData(prev => ({
            ...prev,
            allTradeTimeHistory: [
              ...prev.allTradeTimeHistory,
              {
                gameNumber: currentGameRef.current.gameNumber,
                mapName: currentGameRef.current.mapName,
                entries: currentHistory,
              }
            ],
            games: [
              ...prev.games,
              {
                gameNumber: currentGameRef.current.gameNumber,
                mapName: currentGameRef.current.mapName,
                alerts: [],
                panicUtilityEvents: [],
                tradeTimeHistory: currentHistory,
              }
            ],
          }));
        }
        return []; // Reset for new game
      });

      // Update current game ref for next game
      currentGameRef.current = {
        gameNumber: data?.game_number,
        mapName: data?.map?.name || '',
      };

      // Reset other per-game state
      setWinProbabilityHistory([]);
      recentAbilities.current = [];
      setRoundDeaths([]);
      setDeaths([]);
      setPlayerPositions({});
      playerPositionsRef.current = {};
      setGhostTeammates([]);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch available matches
  const fetchMatches = useCallback(async () => {
    try {
      const response = await fetch(`${SOCKET_URL}/api/matches`);
      const data = await response.json();
      setMatches(data);
    } catch (err) {
      console.error('Failed to fetch matches:', err);
      setError('Failed to fetch matches');
    }
  }, []);

  // Start replay
  const startReplay = useCallback((filename: string, speed: number, aiEnabled: boolean) => {
    if (socketRef.current) {
      socketRef.current.emit('start_replay', { filename, speed, ai_enabled: aiEnabled });
    }
  }, []);

  // Stop replay
  const stopReplay = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('stop_replay');
    }
  }, []);

  // Change speed
  const changeSpeed = useCallback((speed: number) => {
    if (socketRef.current) {
      socketRef.current.emit('change_speed', { speed });
    }
  }, []);

  // Pause replay
  const pauseReplay = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('pause_replay');
    }
  }, []);

  // Resume replay
  const resumeReplay = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.emit('resume_replay');
    }
  }, []);

  // Clear round deaths manually
  const clearRoundDeaths = useCallback(() => {
    setRoundDeaths([]);
  }, []);

  return {
    isConnected,
    isRunning,
    error,
    matches,
    currentMatch,
    roundData,
    alerts,
    killFeed,
    tradeTimeHistory,
    winProbabilityHistory,
    panicUtilityEvents,
    seriesData,
    deaths,
    roundDeaths,
    playerPositions,
    mapBounds,
    ghostTeammates,
    replayComplete,
    startReplay,
    stopReplay,
    changeSpeed,
    pauseReplay,
    resumeReplay,
    fetchMatches,
    clearRoundDeaths,
  };
}
