'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PlayerRanking {
  rank: number;
  player: string;
  contribution_score: number;
  label: string;
  strengths: string[];
  weaknesses: string[];
}

interface MetricBreakdown {
  first_bloods: number;
  first_deaths: number;
  kd: number;
  panic_abilities: number;
}

interface ApiResponse {
  success: boolean;
  matches_analyzed: number;
  rankings: PlayerRanking[];
  metric_breakdown: Record<string, MetricBreakdown>;
  insights: string[];
  recommendations: string[];
  error?: string;
}

export default function TeamStackRank() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    let didCancel = false;

    const fetchStackRank = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/evaluation/team/stack-rank`, {
          signal: controller.signal,
        });
        const result: ApiResponse = await response.json();
        if (didCancel) return;

        if (result.success) {
          setData(result);
          if (result.rankings?.length > 0) {
            setSelectedPlayer(result.rankings[0].player);
          }
        } else {
          setError(result.error || 'Failed to fetch team stack rank');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to evaluation service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchStackRank();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, []);

  const getLabelColor = (label: string) => {
    switch (label) {
      case 'STAR': return 'bg-[#ffa502]/20 text-[#ffa502]';
      case 'CORE': return 'bg-[#00a8e8]/20 text-[#00a8e8]';
      case 'SUPPORT': return 'bg-purple-500/20 text-purple-400';
      default: return 'bg-white/10 text-white/60';
    }
  };

  const getRankMedal = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-[#00a8e8]';
    if (score >= 60) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">🏆</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Team Stack Rank</h2>
            <p className="text-xs text-white/50">Comparative roster analysis</p>
          </div>
        </div>
        {data && (
          <span className="text-xs text-white/40">{data?.matches_analyzed} matches analyzed</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Loading rankings...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[#ff4757]">{error}</div>
        ) : data ? (
          <div className="space-y-4">
            {/* Rankings List */}
            <div className="space-y-2">
              {(data?.rankings || []).map((player, i) => (
                <motion.button
                  key={player.player}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedPlayer(player.player)}
                  className={`w-full p-4 rounded-lg text-left transition-all border ${
                    selectedPlayer === player.player
                      ? 'bg-[#00a8e8]/20 border-[#00a8e8]/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getRankMedal(player.rank)}</span>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-bold text-white">{player.player}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${getLabelColor(player.label)}`}>
                            {player.label}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getScoreColor(player.contribution_score)}`}>
                        {player.contribution_score.toFixed(0)}
                      </div>
                      <div className="text-xs text-white/50">Contribution</div>
                    </div>
                  </div>

                  {/* Strengths & Weaknesses Preview */}
                  <div className="mt-3 flex gap-4">
                    <div className="flex-1">
                      <div className="text-xs text-green-400 mb-1">Strengths</div>
                      <div className="text-xs text-white/60">
                        {player.strengths.slice(0, 2).join(' • ')}
                      </div>
                    </div>
                    {player.weaknesses.length > 0 && (
                      <div className="flex-1">
                        <div className="text-xs text-[#ff4757] mb-1">Improve</div>
                        <div className="text-xs text-white/60">
                          {player.weaknesses.slice(0, 1).join(' • ')}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Player Metrics */}
            {selectedPlayer && data?.metric_breakdown[selectedPlayer] && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium text-white mb-3">{selectedPlayer} - Detailed Stats</h4>
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded bg-black/30 text-center">
                    <div className="text-lg font-bold text-white">
                      {data?.metric_breakdown[selectedPlayer].kd.toFixed(2)}
                    </div>
                    <div className="text-xs text-white/50">K/D</div>
                  </div>
                  <div className="p-3 rounded bg-black/30 text-center">
                    <div className="text-lg font-bold text-green-400">
                      {data?.metric_breakdown[selectedPlayer].first_bloods.toFixed(1)}
                    </div>
                    <div className="text-xs text-white/50">FB/Match</div>
                  </div>
                  <div className="p-3 rounded bg-black/30 text-center">
                    <div className="text-lg font-bold text-[#ff4757]">
                      {data?.metric_breakdown[selectedPlayer].first_deaths.toFixed(1)}
                    </div>
                    <div className="text-xs text-white/50">FD/Match</div>
                  </div>
                  <div className="p-3 rounded bg-black/30 text-center">
                    <div className="text-lg font-bold text-[#ffa502]">
                      {data?.metric_breakdown[selectedPlayer].panic_abilities.toFixed(1)}
                    </div>
                    <div className="text-xs text-white/50">Panic Utils</div>
                  </div>
                </div>
              </div>
            )}

            {/* Insights */}
            {(data?.insights?.length || 0) > 0 && (
              <div className="p-4 rounded-lg bg-[#00a8e8]/10 border border-[#00a8e8]/30">
                <h4 className="text-xs text-[#00a8e8] uppercase tracking-wider mb-2">Team Insights</h4>
                <ul className="space-y-1">
                  {(data?.insights || []).map((insight, i) => (
                    <li key={i} className="text-sm text-white/70">• {insight}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommendations */}
            {data?.recommendations?.length > 0 && (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <h4 className="text-xs text-green-400 uppercase tracking-wider mb-2">Recommendations</h4>
                <ul className="space-y-1">
                  {(data?.recommendations || []).map((rec, i) => (
                    <li key={i} className="text-sm text-white/70">✓ {rec}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/40">
            Loading team data?...
          </div>
        )}
      </div>
    </div>
  );
}
