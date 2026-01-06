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

interface PositionUpdate {
  positions: Record<string, [number, number]>;
  map_bounds: MapBounds;
}

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000';

interface UseSocketReturn {
  // Connection state
  isConnected: boolean;
  isRunning: boolean;
  error: string | null;

  // Match data
  matches: MatchInfo[];
  currentMatch: string | null;

  // Live data
  roundData: RoundUpdate | null;
  alerts: TimeoutAlert[];
  killFeed: KillEvent[];
  tradeTimeHistory: TradeTimeEntry[];

  // Map visualization data
  deaths: DeathEvent[];
  roundDeaths: DeathEvent[];
  playerPositions: Record<string, [number, number]>;
  mapBounds: MapBounds | null;

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

  // Map visualization state
  const [deaths, setDeaths] = useState<DeathEvent[]>([]);
  const [roundDeaths, setRoundDeaths] = useState<DeathEvent[]>([]);
  const [playerPositions, setPlayerPositions] = useState<Record<string, [number, number]>>({});
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);
  const deathIdCounter = useRef(0);

  const [replayComplete, setReplayComplete] = useState<ReplayComplete | null>(null);

  // Initialize socket connection
  useEffect(() => {
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
      setError(data.message);
    });

    socket.on('status', (data: { message: string }) => {
      console.log('Status:', data.message);
    });

    // Replay events
    socket.on('replay_started', (data: { match: string; speed: number }) => {
      setIsRunning(true);
      setCurrentMatch(data.match);
      setAlerts([]);
      setKillFeed([]);
      setTradeTimeHistory([]);
      setDeaths([]);
      setRoundDeaths([]);
      setPlayerPositions({});
      setReplayComplete(null);
      deathIdCounter.current = 0;
      console.log(`Replay started: ${data.match} at ${data.speed}x`);
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
      console.log('Replay complete:', data.final_score);
    });

    // Live data events
    socket.on('round_update', (data: RoundUpdate) => {
      setRoundData(data);

      // Track trade time history for tilt graph
      if (data.tilt?.has_data && data.tilt.trade_time_current > 0) {
        setTradeTimeHistory(prev => {
          // Avoid duplicates
          const exists = prev.some(t => t.round === data.round);
          if (exists) return prev;
          return [...prev, {
            round: data.round,
            trade_time_ms: data.tilt.trade_time_current,
            traded: data.tilt.trade_time_current < 5000
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

    // Death event with position for map visualization
    socket.on('death_event', (data: {
      x: number;
      y: number;
      player: string;
      team: 'c9' | 'opp';
      killer: string;
      round: number;
    }) => {
      const death: DeathEvent = {
        ...data,
        id: `death-${deathIdCounter.current++}`,
      };
      setDeaths(prev => [...prev, death]);
      setRoundDeaths(prev => [...prev, death]);
    });

    // Position updates for trade web
    socket.on('position_update', (data: PositionUpdate) => {
      setPlayerPositions(data.positions);
      if (data.map_bounds) {
        setMapBounds(data.map_bounds);
      }
    });

    // Round start - clear round deaths
    socket.on('round_start', (data: { round: number; map_bounds?: MapBounds }) => {
      setRoundDeaths([]);
      if (data.map_bounds) {
        setMapBounds(data.map_bounds);
      }
    });

    socket.on('speed_changed', (data: { speed: number }) => {
      console.log(`Speed changed to ${data.speed}x`);
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
    deaths,
    roundDeaths,
    playerPositions,
    mapBounds,
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
