'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface AttackPattern {
  map_name: string;
  default_play: string;
  percentage: number;
  after_loss_streak: string;
  timeout_behavior: string;
}

interface RoundTypePerf {
  notes: string;
  win_rate: number;
}

interface RoundTypePerformance {
  pistol: RoundTypePerf;
  eco: RoundTypePerf;
  full_buy: RoundTypePerf;
  post_plant: RoundTypePerf;
}

interface PlayerTendency {
  player: string;
  role: string;
  entry_rate: number;
  preferred_site: string;
  weakness: string;
  counter_strategy: string;
}

interface ApiResponse {
  success: boolean;
  opponent: string;
  maps_analyzed: number;
  attack_patterns: Record<string, AttackPattern>;
  player_tendencies: PlayerTendency[];
  round_type_performance: RoundTypePerformance;
  weaknesses: string[];
  strengths: string[];
  error?: string;
}

interface EnemyPlaybookProps {
  opponent?: string;
  onOpponentChange?: (opponent: string) => void;
}

const OPPONENTS = ['2GAME eSports', 'Guild Esports', 'Sentinels', 'G2 Esports', 'Team Liquid'];

export default function EnemyPlaybook({ opponent, onOpponentChange }: EnemyPlaybookProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState(opponent || OPPONENTS[0]);
  const [activeSection, setActiveSection] = useState<'overview' | 'players' | 'patterns' | 'maps'>('overview');
  const [selectedMap, setSelectedMap] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedOpponent) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchPlaybook = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/strategy/opponent/${encodeURIComponent(selectedOpponent)}/playbook`,
          { signal: controller.signal }
        );
        const result: ApiResponse = await response.json();
        if (didCancel) return;

        if (result.success) {
          setData(result);
          const maps = Object.keys(result.attack_patterns || {});
          if (maps.length > 0) {
            setSelectedMap(maps[0]);
          }
        } else {
          setError(result.error || 'Failed to generate playbook');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to strategy service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchPlaybook();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [selectedOpponent]);

  const handleOpponentChange = (opp: string) => {
    setSelectedOpponent(opp);
    onOpponentChange?.(opp);
  };

  const getWinRateColor = (percentage: number) => {
    if (percentage >= 60) return 'text-green-400';
    if (percentage >= 40) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">📋</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Enemy Playbook</h2>
            <p className="text-xs text-white/50">Auto-generated scouting report</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Section Tabs */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            {(['overview', 'players', 'patterns', 'maps'] as const).map(section => (
              <button
                key={section}
                onClick={() => setActiveSection(section)}
                className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                  activeSection === section
                    ? 'bg-[#00a8e8]/20 text-[#00a8e8]'
                    : 'text-white/50 hover:text-white/70'
                }`}
              >
                {section}
              </button>
            ))}
          </div>

          {/* Opponent Selector */}
          <select
            value={selectedOpponent}
            onChange={(e) => handleOpponentChange(e.target.value)}
            className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00a8e8]/50"
          >
            {OPPONENTS.map(opp => (
              <option key={opp} value={opp} className="bg-gray-900">{opp}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Generating playbook...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[#ff4757]">{error}</div>
        ) : data ? (
          <AnimatePresence mode="wait">
            {activeSection === 'overview' ? (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Team Overview */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{data?.opponent}</h3>
                      <p className="text-sm text-white/50 mt-1">
                        {data?.maps_analyzed} maps analyzed
                      </p>
                    </div>
                  </div>
                </div>

                {/* Round Type Performance */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-white mb-3">Round Type Performance</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(data?.round_type_performance).map(([type, perf]) => (
                      <div key={type} className="p-3 rounded-lg bg-black/30">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#00a8e8] uppercase">{type.replace(/_/g, ' ')}</span>
                          <span className={`text-sm font-bold ${
                            perf.win_rate >= 0.5 ? 'text-green-400' : 'text-[#ff4757]'
                          }`}>
                            {(perf.win_rate * 100).toFixed(0)}%
                          </span>
                        </div>
                        <p className="text-xs text-white/50">{perf.notes}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Strengths & Weaknesses */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30">
                    <h4 className="text-xs text-[#ff4757] uppercase tracking-wider mb-2">Their Strengths</h4>
                    <ul className="space-y-1">
                      {(data?.strengths || []).map((s, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <span className="text-[#ff4757]">•</span>{s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                    <h4 className="text-xs text-green-400 uppercase tracking-wider mb-2">Their Weaknesses</h4>
                    <ul className="space-y-1">
                      {(data?.weaknesses || []).map((w, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                          <span className="text-green-400">✓</span>{w}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.div>
            ) : activeSection === 'players' ? (
              <motion.div
                key="players"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-medium text-white/70">Enemy Player Analysis</h4>
                {(data?.player_tendencies?.length || 0) > 0 ? (
                  (data?.player_tendencies || []).map((player, i) => (
                    <motion.div
                      key={player.player}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className="p-4 rounded-lg bg-white/5 border border-white/10"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-bold text-white">{player.player}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            player.role === 'Entry Fragger' ? 'bg-[#ff4757]/20 text-[#ff4757]' :
                            player.role === 'Star Player' ? 'bg-[#ffa502]/20 text-[#ffa502]' :
                            player.role === 'Support' ? 'bg-purple-500/20 text-purple-400' :
                            'bg-white/10 text-white/60'
                          }`}>
                            {player.role}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded bg-[#ff4757]/10 border border-[#ff4757]/30">
                          <div className="text-xs text-[#ff4757] uppercase mb-1">Weakness</div>
                          <p className="text-sm text-white/80">{player.weakness}</p>
                        </div>
                        <div className="p-3 rounded bg-green-500/10 border border-green-500/30">
                          <div className="text-xs text-green-400 uppercase mb-1">Counter Strategy</div>
                          <p className="text-sm text-white/80">{player.counter_strategy}</p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center text-white/40 py-8">
                    No enemy player data available yet
                  </div>
                )}
              </motion.div>
            ) : activeSection === 'patterns' ? (
              <motion.div
                key="patterns"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h4 className="text-sm font-medium text-white/70">Attack Patterns by Map</h4>
                {Object.entries(data?.attack_patterns).map(([mapName, pattern], i) => (
                  <motion.div
                    key={mapName}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h5 className="text-lg font-medium text-white capitalize">{mapName}</h5>
                      <span className={`text-lg font-bold ${getWinRateColor(pattern.percentage)}`}>
                        {pattern.percentage.toFixed(0)}%
                      </span>
                    </div>

                    <div className="space-y-3">
                      <div className="p-3 rounded bg-black/30">
                        <div className="text-xs text-white/50 mb-1">Default Play</div>
                        <p className="text-sm text-white/80">{pattern.default_play}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 rounded bg-black/30">
                          <div className="text-xs text-[#ffa502] mb-1">After Loss Streak</div>
                          <p className="text-sm text-white/70">{pattern.after_loss_streak}</p>
                        </div>
                        <div className="p-3 rounded bg-black/30">
                          <div className="text-xs text-[#00a8e8] mb-1">Timeout Behavior</div>
                          <p className="text-sm text-white/70">{pattern.timeout_behavior}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="maps"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-4"
              >
                {/* Map List */}
                <div className="w-40 space-y-2">
                  {Object.entries(data?.attack_patterns).map(([mapName, pattern], i) => (
                    <motion.button
                      key={mapName}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedMap(mapName)}
                      className={`w-full p-3 rounded-lg text-left transition-all border ${
                        selectedMap === mapName
                          ? 'bg-[#00a8e8]/20 border-[#00a8e8]/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      <div className="text-sm font-medium text-white capitalize">{mapName}</div>
                      <div className={`text-xs mt-1 ${getWinRateColor(pattern.percentage)}`}>
                        C9 {pattern.percentage.toFixed(0)}% WR
                      </div>
                    </motion.button>
                  ))}
                </div>

                {/* Map Details */}
                {selectedMap && data?.attack_patterns[selectedMap] && (
                  <div className="flex-1 space-y-4">
                    <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                      <h4 className="text-lg font-bold text-white capitalize mb-4">{selectedMap}</h4>

                      <div className="space-y-4">
                        <div>
                          <div className="text-xs text-white/50 uppercase mb-2">Their Strategy</div>
                          <p className="text-sm text-white/80 p-3 rounded bg-black/30">
                            {data?.attack_patterns[selectedMap].default_play}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs text-[#ffa502] uppercase mb-2">After Loss Streak</div>
                            <p className="text-sm text-white/70 p-3 rounded bg-[#ffa502]/10">
                              {data?.attack_patterns[selectedMap].after_loss_streak}
                            </p>
                          </div>
                          <div>
                            <div className="text-xs text-[#00a8e8] uppercase mb-2">Post-Timeout</div>
                            <p className="text-sm text-white/70 p-3 rounded bg-[#00a8e8]/10">
                              {data?.attack_patterns[selectedMap].timeout_behavior}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-full text-white/40">
            Select an opponent to generate playbook
          </div>
        )}
      </div>

      {/* Footer */}
      {data && (
        <div className="px-4 py-2 border-t border-white/10 text-xs text-white/30 text-right">
          Based on {data?.maps_analyzed} maps analyzed
        </div>
      )}
    </div>
  );
}
