'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface GhostPosition {
  x: number;
  y: number;
}

interface GhostSnapshot {
  round: number;
  timestamp_ms: number;
  dead_player: string;
  death_position: GhostPosition;
  teammates: {
    name: string;
    actual_position: GhostPosition;
    recommended_position: GhostPosition;
    distance_to_dead: number;
    was_tradeable: boolean;
    improvement_needed: number;
  }[];
  trade_window_expired: boolean;
  nearest_teammate_distance: number;
}

interface GhostTimelineResponse {
  success: boolean;
  total_snapshots: number;
  snapshots: GhostSnapshot[];
  summary: {
    avg_nearest_distance: number;
    untradeable_percentage: number;
    worst_positioning_player: string;
  };
}

interface GhostTimelineProps {
  matchFile?: string;
  onSnapshotSelect?: (snapshot: GhostSnapshot) => void;
}

export default function GhostTimeline({ matchFile, onSnapshotSelect }: GhostTimelineProps) {
  const [data, setData] = useState<GhostTimelineResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<GhostSnapshot | null>(null);
  const [filterPlayer, setFilterPlayer] = useState<string | 'all'>('all');

  useEffect(() => {
    if (!matchFile) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchGhostTimeline = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/analytics/ghost-timeline?match_file=${encodeURIComponent(matchFile)}`,
          { signal: controller.signal }
        );
        const result = await response.json();

        if (didCancel) return;

        if (result.success) {
          setData(result);
          if (result.snapshots?.length > 0) {
            setSelectedSnapshot(result.snapshots[0]);
          }
        } else {
          setError(result.error || 'Failed to fetch ghost timeline');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to analytics service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchGhostTimeline();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [matchFile]);

  const uniquePlayers = [...new Set((data?.snapshots || []).map(s => s.dead_player))];

  const filteredSnapshots = (data?.snapshots || []).filter(s =>
    filterPlayer === 'all' || s.dead_player === filterPlayer
  );

  const handleSnapshotClick = (snapshot: GhostSnapshot) => {
    setSelectedSnapshot(snapshot);
    onSnapshotSelect?.(snapshot);
  };

  const getDistanceColor = (distance: number) => {
    if (distance <= 1200) return 'text-green-400';
    if (distance <= 2000) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">👻</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Ghost Timeline</h2>
            <p className="text-xs text-white/50">
              {data ? `${data?.total_snapshots} positioning snapshots` : 'Teammate positioning recommendations'}
            </p>
          </div>
        </div>

        {/* Player Filter */}
        <select
          value={filterPlayer}
          onChange={(e) => setFilterPlayer(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00a8e8]/50"
        >
          <option value="all">All Deaths</option>
          {uniquePlayers.map(player => (
            <option key={player} value={player}>{player}</option>
          ))}
        </select>
      </div>

      {/* Summary Stats */}
      {data?.summary && (
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className={`text-xl font-bold ${getDistanceColor(data?.summary.avg_nearest_distance)}`}>
                {Math.round(data?.summary.avg_nearest_distance)}
              </div>
              <div className="text-xs text-white/50">Avg Distance</div>
            </div>
            <div>
              <div className={`text-xl font-bold ${
                data?.summary.untradeable_percentage > 50 ? 'text-[#ff4757]' : 'text-white'
              }`}>
                {data?.summary.untradeable_percentage.toFixed(0)}%
              </div>
              <div className="text-xs text-white/50">Untradeable</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#ffa502]">
                {data?.summary.worst_positioning_player}
              </div>
              <div className="text-xs text-white/50">Needs Work</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Snapshot List */}
        <div className="w-56 border-r border-white/10 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-white/50">
              <div className="animate-spin w-6 h-6 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Loading snapshots...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-[#ff4757] text-sm">{error}</div>
          ) : filteredSnapshots.length === 0 ? (
            <div className="p-4 text-center text-white/40 text-sm">No snapshots available</div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredSnapshots.map((snapshot, idx) => (
                <button
                  key={`${snapshot.round}-${snapshot.timestamp_ms}-${idx}`}
                  onClick={() => handleSnapshotClick(snapshot)}
                  className={`w-full p-2 rounded-lg text-left transition-all ${
                    selectedSnapshot?.round === snapshot.round &&
                    selectedSnapshot?.timestamp_ms === snapshot.timestamp_ms
                      ? 'bg-[#00a8e8]/20 border border-[#00a8e8]/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">R{snapshot.round}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      snapshot.trade_window_expired
                        ? 'bg-[#ff4757]/20 text-[#ff4757]'
                        : 'bg-green-500/20 text-green-400'
                    }`}>
                      {snapshot.trade_window_expired ? 'EXPIRED' : 'TRADEABLE'}
                    </span>
                  </div>
                  <div className="text-xs text-white/60 mt-1">{snapshot.dead_player}</div>
                  <div className="text-xs text-white/40">
                    Nearest: {Math.round(snapshot.nearest_teammate_distance)}u
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Snapshot Details */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {selectedSnapshot ? (
              <motion.div
                key={`${selectedSnapshot.round}-${selectedSnapshot.timestamp_ms}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Death Info */}
                <div className="p-4 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-white">{selectedSnapshot.dead_player}</span>
                    <span className="text-sm text-white/50">Round {selectedSnapshot.round}</span>
                  </div>
                  <div className="text-sm text-white/60">
                    Death Position: ({Math.round(selectedSnapshot.death_position.x)}, {Math.round(selectedSnapshot.death_position.y)})
                  </div>
                  <div className={`text-sm mt-1 ${
                    selectedSnapshot.trade_window_expired ? 'text-[#ff4757]' : 'text-green-400'
                  }`}>
                    {selectedSnapshot.trade_window_expired
                      ? 'Trade window expired - no teammate close enough'
                      : 'Trade was possible'}
                  </div>
                </div>

                {/* Teammate Positions */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white/70">Teammate Positions</h4>
                  {selectedSnapshot.teammates.map((teammate, i) => (
                    <motion.div
                      key={teammate.name}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-lg border-l-4 ${
                        teammate.was_tradeable
                          ? 'bg-green-500/10 border-green-500'
                          : 'bg-white/5 border-[#ffa502]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-white">{teammate.name}</span>
                        <span className={`text-sm font-bold ${getDistanceColor(teammate.distance_to_dead)}`}>
                          {Math.round(teammate.distance_to_dead)}u away
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                          <div className="text-white/40 mb-1">Actual Position</div>
                          <div className="text-white/70">
                            ({Math.round(teammate.actual_position.x)}, {Math.round(teammate.actual_position.y)})
                          </div>
                        </div>
                        <div>
                          <div className="text-white/40 mb-1">Recommended</div>
                          <div className="text-[#00a8e8]">
                            ({Math.round(teammate.recommended_position.x)}, {Math.round(teammate.recommended_position.y)})
                          </div>
                        </div>
                      </div>

                      {teammate.improvement_needed > 0 && (
                        <div className="mt-2 pt-2 border-t border-white/10">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-white/50">Repositioning needed</span>
                            <span className={`text-xs font-medium ${
                              teammate.improvement_needed > 500 ? 'text-[#ff4757]' : 'text-[#ffa502]'
                            }`}>
                              {Math.round(teammate.improvement_needed)}u closer
                            </span>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Visual Position Indicator */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-white/70 mb-3">Position Overview</h4>
                  <div className="relative h-40 bg-black/30 rounded-lg overflow-hidden">
                    {/* Dead player marker */}
                    <div
                      className="absolute w-3 h-3 bg-[#ff4757] rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: '50%',
                        top: '50%',
                      }}
                      title={selectedSnapshot.dead_player}
                    />

                    {/* Teammate markers */}
                    {selectedSnapshot.teammates.map((teammate, i) => {
                      const dx = teammate.actual_position.x - selectedSnapshot.death_position.x;
                      const dy = teammate.actual_position.y - selectedSnapshot.death_position.y;
                      const scale = 0.05;
                      return (
                        <div key={teammate.name}>
                          {/* Actual position */}
                          <div
                            className={`absolute w-2.5 h-2.5 rounded-full transform -translate-x-1/2 -translate-y-1/2 ${
                              teammate.was_tradeable ? 'bg-green-400' : 'bg-[#ffa502]'
                            }`}
                            style={{
                              left: `${50 + dx * scale}%`,
                              top: `${50 + dy * scale}%`,
                            }}
                            title={`${teammate.name} (actual)`}
                          />
                          {/* Recommended position */}
                          <div
                            className="absolute w-2 h-2 border-2 border-[#00a8e8] rounded-full transform -translate-x-1/2 -translate-y-1/2 opacity-50"
                            style={{
                              left: `${50 + (teammate.recommended_position.x - selectedSnapshot.death_position.x) * scale}%`,
                              top: `${50 + (teammate.recommended_position.y - selectedSnapshot.death_position.y) * scale}%`,
                            }}
                            title={`${teammate.name} (recommended)`}
                          />
                        </div>
                      );
                    })}

                    {/* Trade radius indicator */}
                    <div
                      className="absolute border border-dashed border-green-500/30 rounded-full transform -translate-x-1/2 -translate-y-1/2"
                      style={{
                        left: '50%',
                        top: '50%',
                        width: '60px',
                        height: '60px',
                      }}
                    />

                    {/* Legend */}
                    <div className="absolute bottom-2 left-2 text-[10px] text-white/40 space-y-0.5">
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-[#ff4757] rounded-full" />
                        <span>Death</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-400 rounded-full" />
                        <span>Tradeable</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 border border-[#00a8e8] rounded-full" />
                        <span>Recommended</span>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                {matchFile ? 'Select a death to view positioning' : 'Select a match to analyze'}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
