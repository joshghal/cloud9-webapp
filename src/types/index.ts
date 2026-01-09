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
  killer_team?: 'c9' | 'opp';
  victim_team?: 'c9' | 'opp';
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

// Map coordinate normalization - bounds from actual GRID esports match data
export const VALORANT_MAPS: Record<string, { bounds: MapBounds; image: string }> = {
  lotus: {
    // GRID bounds: min {x: 300, y: -5500}, max {x: 11000, y: 6550}
    bounds: { min: { x: 300, y: -5500 }, max: { x: 11000, y: 6550 } },
    image: '/maps/lotus.png'
  },
  haven: {
    // GRID bounds: min {x: -3700, y: -14100}, max {x: 7450, y: -1800}
    bounds: { min: { x: -3700, y: -14100 }, max: { x: 7450, y: -1800 } },
    image: '/maps/haven.png'
  },
  ascent: {
    // GRID bounds: min {x: -4850, y: -11100}, max {x: 7550, y: 2200}
    bounds: { min: { x: -4850, y: -11100 }, max: { x: 7550, y: 2200 } },
    image: '/maps/ascent.png'
  },
  bind: {
    // GRID bounds: min {x: 100, y: -7300}, max {x: 16100, y: 6050}
    bounds: { min: { x: 100, y: -7300 }, max: { x: 16100, y: 6050 } },
    image: '/maps/bind.png'
  },
  icebox: {
    // GRID bounds: min {x: -8300, y: -5200}, max {x: 3100, y: 7200}
    bounds: { min: { x: -8300, y: -5200 }, max: { x: 3100, y: 7200 } },
    image: '/maps/icebox.png'
  },
  sunset: {
    // Estimated - no GRID data available yet
    bounds: { min: { x: -6500, y: -9000 }, max: { x: 6500, y: 7000 } },
    image: '/maps/sunset.png'
  },
  fracture: {
    // GRID bounds: min {x: 3000, y: -6850}, max {x: 13900, y: 4700}
    bounds: { min: { x: 3000, y: -6850 }, max: { x: 13900, y: 4700 } },
    image: '/maps/fracture.png'
  },
  abyss: {
    // Estimated - no GRID data available yet
    bounds: { min: { x: -7000, y: -7000 }, max: { x: 7000, y: 7000 } },
    image: '/maps/abyss.png'
  },
  pearl: {
    // GRID bounds: min {x: -500, y: -6100}, max {x: 11250, y: 6550}
    bounds: { min: { x: -500, y: -6100 }, max: { x: 11250, y: 6550 } },
    image: '/maps/pearl.png'
  },
  split: {
    // GRID bounds: min {x: -3450, y: -10050}, max {x: 8300, y: 950}
    bounds: { min: { x: -3450, y: -10050 }, max: { x: 8300, y: 950 } },
    image: '/maps/split.png'
  },
  corrode: {
    // GRID bounds: min {x: -6000, y: -7100}, max {x: 6000, y: 6500}
    bounds: { min: { x: -6000, y: -7100 }, max: { x: 6000, y: 6500 } },
    image: '/maps/corrode.png'
  }
};
