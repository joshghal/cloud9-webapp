// Types matching the Python backend data structures

export interface DeathPosition {
  x: number;
  y: number;
  player: string;
  team: 'c9' | 'opp';
  round_num: number;
  killer: string;
  killer_pos?: [number, number];
}

export interface TradeTimeEntry {
  round: number;
  trade_time_ms: number;
  traded: boolean;
}

export interface PlayerPosition {
  [playerName: string]: [number, number];
}

export interface MapBounds {
  min: { x: number; y: number };
  max: { x: number; y: number };
}

export interface TiltData {
  has_data: boolean;
  tilt_index: number;
  diagnosis: 'tilt' | 'tactical' | 'enemy_strong' | 'locked_in' | 'stable' | 'no_data';
  insight: string;
  trade_time_current: number | null;
  trade_time_baseline: number;
  trade_time_avg: number | null;
  trade_success_rate: number | null;
  early_trade_rate: number | null;
  recent_win_rate: number | null;
}

export interface DuelLost {
  round: number;
  c9_player: string;
  enemy: string;
  damage_dealt: number;
  enemies_involved: number;
  shot_first: 'c9' | 'enemy' | 'even';
  time_diff_ms: number;
}

export interface UntradeableDeath {
  round: number;
  player: string;
  killer: string;
  position: [number, number];
  nearest_teammate: string;
  distance_to_nearest: number;
  threshold_used: number;
  agent: string;
}

export interface RoundData {
  round: number;
  score: string;
  round_won: boolean;
  half: number;
  c9_deaths: Array<{
    player: string;
    killer: string;
    position: [number, number];
    killer_pos?: [number, number];
  }>;
  opp_deaths: Array<{
    player: string;
    killer: string;
    position: [number, number];
  }>;
  duels_lost: DuelLost[];
  untradeable_deaths: UntradeableDeath[];
}

export interface SpatialTimeline {
  has_data: boolean;
  maps: Array<{
    game_number: number;
    map_name: string;
    final_score: string;
    total_rounds: number;
    rounds: RoundData[];
    untradeable_deaths: UntradeableDeath[];
    duels_lost: DuelLost[];
  }>;
  summary: {
    total_maps: number;
    total_rounds: number;
    total_untradeable_deaths: number;
    total_duels_lost: number;
    worst_spacing?: {
      player: string;
      count: number;
    };
    worst_duels?: {
      player: string;
      count: number;
    };
  };
}

export interface MapInfo {
  name: string;
  bounds: MapBounds | null;
  width: number;
  height: number;
  aspect_ratio: number;
  diagonal: number;
}

export interface RoundUpdate {
  round: number;
  c9_score: number;
  opp_score: number;
  consecutive_losses: number;
  timeouts_available: number;
  win_probability: number;
  momentum: string;
  momentum_trend: 'improving' | 'declining' | 'stable';
  warning_level: 'none' | 'caution' | 'warning' | 'critical';
  tilt: TiltData;
  map: MapInfo;
  position_warning?: {
    message: string;
    confidence: number;
    count: number;
  };
  damage_efficiency?: {
    duels_lost: number;
    worst_player?: string;
  };
  trade_distance?: {
    fragmentation_rate: number;
    insight: string;
  };
}

export interface TimeoutAlert {
  round: number;
  confidence: number;
  reasons: string[];
  score: string;
  consecutive_losses: number;
  player_warnings: string[];
  timestamp: string;
  ai_insight?: {
    recommendation: string;
    reasoning: string;
    talking_points: string[];
    urgency: string;
    success: boolean;
  };
}

export interface KillEvent {
  killer: string;
  victim: string;
  round: number;
}

export interface MatchInfo {
  filename: string;
  name: string;
  tournament: string;
  date: string;
}

export interface ReplayComplete {
  final_score: string;
  total_rounds: number;
  alerts_generated: number;
  actual_timeouts: number;
  spatial_timeline: SpatialTimeline;
}

// Map coordinate normalization
export const VALORANT_MAPS: Record<string, { bounds: MapBounds; image: string }> = {
  lotus: {
    bounds: { min: { x: -6000, y: -6000 }, max: { x: 6000, y: 6000 } },
    image: '/maps/lotus.png'
  },
  haven: {
    bounds: { min: { x: -5500, y: -5500 }, max: { x: 5500, y: 5500 } },
    image: '/maps/haven.png'
  },
  ascent: {
    bounds: { min: { x: -5000, y: -5000 }, max: { x: 5000, y: 5000 } },
    image: '/maps/ascent.png'
  },
  bind: {
    bounds: { min: { x: -4500, y: -4500 }, max: { x: 4500, y: 4500 } },
    image: '/maps/bind.png'
  },
  icebox: {
    bounds: { min: { x: -5000, y: -5000 }, max: { x: 5000, y: 5000 } },
    image: '/maps/icebox.png'
  },
  sunset: {
    bounds: { min: { x: -5000, y: -5000 }, max: { x: 5000, y: 5000 } },
    image: '/maps/sunset.png'
  },
  fracture: {
    bounds: { min: { x: -6000, y: -6000 }, max: { x: 6000, y: 6000 } },
    image: '/maps/fracture.png'
  },
  abyss: {
    bounds: { min: { x: -5000, y: -5000 }, max: { x: 5000, y: 5000 } },
    image: '/maps/abyss.png'
  },
  pearl: {
    bounds: { min: { x: -5000, y: -5000 }, max: { x: 5000, y: 5000 } },
    image: '/maps/pearl.png'
  },
  split: {
    bounds: { min: { x: -4500, y: -4500 }, max: { x: 4500, y: 4500 } },
    image: '/maps/split.png'
  }
};
