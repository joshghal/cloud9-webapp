'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface TrendValue {
  date: string;
  match: string;
  value: number;
}

interface TrendData {
  change_rate: number;
  significance: 'high' | 'medium' | 'low';
  trend: 'improving' | 'declining' | 'stable';
  values: TrendValue[];
}

interface Verdict {
  declining: string[];
  improving: string[];
  stagnant: string[];
}

interface ApiResponse {
  success: boolean;
  player: string;
  matches_analyzed: number;
  consistency_score: number;
  focus_area: string;
  trends: Record<string, TrendData>;
  verdict: Verdict;
  error?: string;
}

interface GrowthTrajectoryProps {
  playerName?: string;
  onPlayerChange?: (player: string) => void;
}

const PLAYERS = ['OXY', 'Xeppaa', 'neT', 'mitch', 'v1c'];

export default function GrowthTrajectory({ playerName, onPlayerChange }: GrowthTrajectoryProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState(playerName || PLAYERS[0]);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedPlayer) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchTrajectory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/evaluation/player/${encodeURIComponent(selectedPlayer)}/trajectory`,
          { signal: controller.signal }
        );
        const result: ApiResponse = await response.json();
        if (didCancel) return;

        if (result.success) {
          setData(result);
          const metrics = Object.keys(result.trends || {});
          if (metrics.length > 0) {
            setSelectedMetric(metrics[0]);
          }
        } else {
          setError(result.error || 'Failed to fetch growth trajectory');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to evaluation service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchTrajectory();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [selectedPlayer]);

  const handlePlayerChange = (player: string) => {
    setSelectedPlayer(player);
    onPlayerChange?.(player);
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return '↑';
      case 'declining': return '↓';
      default: return '→';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving': return 'text-green-400';
      case 'declining': return 'text-[#ff4757]';
      default: return 'text-white/60';
    }
  };

  const getSignificanceColor = (sig: string) => {
    switch (sig) {
      case 'high': return 'bg-green-500/20 text-green-400';
      case 'medium': return 'bg-[#ffa502]/20 text-[#ffa502]';
      default: return 'bg-white/10 text-white/50';
    }
  };

  const getConsistencyColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">📊</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Growth Trajectory</h2>
            <p className="text-xs text-white/50">Player improvement over time</p>
          </div>
        </div>

        {/* Player Selector */}
        <select
          value={selectedPlayer}
          onChange={(e) => handlePlayerChange(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-[#00a8e8]/50"
        >
          {PLAYERS.map(player => (
            <option key={player} value={player} className="bg-gray-900">{player}</option>
          ))}
        </select>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Loading trajectory...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[#ff4757]">{error}</div>
        ) : data ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Player Overview */}
            <div className="p-4 rounded-lg bg-gradient-to-r from-[#00a8e8]/20 to-transparent border border-[#00a8e8]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">{data?.player}</h3>
                  <p className="text-sm text-white/50">{data?.matches_analyzed} matches analyzed</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getConsistencyColor(data?.consistency_score)}`}>
                    {data?.consistency_score.toFixed(0)}%
                  </div>
                  <div className="text-xs text-white/50">Consistency Score</div>
                </div>
              </div>
            </div>

            {/* Focus Area */}
            <div className="p-3 rounded-lg bg-[#ffa502]/10 border border-[#ffa502]/30">
              <div className="text-xs text-[#ffa502] uppercase tracking-wider mb-1">Focus Area</div>
              <p className="text-sm text-white">{data?.focus_area}</p>
            </div>

            {/* Verdict */}
            {data?.verdict && (
              <div className="grid grid-cols-3 gap-3">
                {data?.verdict.improving?.length > 0 && (
                  <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                    <div className="text-xs text-green-400 uppercase tracking-wider mb-2">Improving</div>
                    {data?.verdict.improving.map((item, i) => (
                      <div key={i} className="text-xs text-white/70">↑ {item.replace(/_/g, ' ')}</div>
                    ))}
                  </div>
                )}
                {data?.verdict.declining?.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30">
                    <div className="text-xs text-[#ff4757] uppercase tracking-wider mb-2">Declining</div>
                    {data?.verdict.declining.map((item, i) => (
                      <div key={i} className="text-xs text-white/70">↓ {item.replace(/_/g, ' ')}</div>
                    ))}
                  </div>
                )}
                {data?.verdict.stagnant?.length > 0 && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Stagnant</div>
                    {data?.verdict.stagnant.map((item, i) => (
                      <div key={i} className="text-xs text-white/70">→ {item.replace(/_/g, ' ')}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(data?.trends).map(([metric, trendData]) => (
                <motion.button
                  key={metric}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => setSelectedMetric(metric)}
                  className={`p-3 rounded-lg text-left transition-all border ${
                    selectedMetric === metric
                      ? 'bg-[#00a8e8]/20 border-[#00a8e8]/50'
                      : 'bg-white/5 border-white/10 hover:bg-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/50 uppercase">{metric.replace(/_/g, ' ')}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${getSignificanceColor(trendData.significance)}`}>
                      {trendData.significance}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className={`text-lg font-bold ${getTrendColor(trendData.trend)}`}>
                      {getTrendIcon(trendData.trend)} {trendData.trend}
                    </span>
                    <span className={`text-sm ${
                      trendData.change_rate >= 0 ? 'text-green-400' : 'text-[#ff4757]'
                    }`}>
                      {trendData.change_rate >= 0 ? '+' : ''}{trendData.change_rate.toFixed(1)}%
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>

            {/* Selected Metric Detail */}
            {selectedMetric && data?.trends[selectedMetric] && (
              <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-sm font-medium text-white mb-3 capitalize">
                  {selectedMetric.replace(/_/g, ' ')} History
                </h4>

                {/* Mini Chart */}
                <div className="relative h-32 mb-4">
                  <svg className="w-full h-full" viewBox="0 0 100 50" preserveAspectRatio="none">
                    {(() => {
                      const values = data?.trends[selectedMetric].values;
                      if (values.length < 2) return null;
                      const maxVal = Math.max(...values.map(v => v.value));
                      const minVal = Math.min(...values.map(v => v.value));
                      const range = maxVal - minVal || 1;

                      const points = values.map((v, i) => {
                        const x = (i / (values.length - 1)) * 100;
                        const y = 50 - ((v.value - minVal) / range) * 45;
                        return `${x},${y}`;
                      }).join(' ');

                      return (
                        <>
                          <polyline
                            fill="none"
                            stroke="#00a8e8"
                            strokeWidth="2"
                            points={points}
                          />
                          {values.map((v, i) => {
                            const x = (i / (values.length - 1)) * 100;
                            const y = 50 - ((v.value - minVal) / range) * 45;
                            return (
                              <circle
                                key={i}
                                cx={x}
                                cy={y}
                                r="2"
                                fill="#00a8e8"
                              />
                            );
                          })}
                        </>
                      );
                    })()}
                  </svg>
                </div>

                {/* Values List */}
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {data?.trends[selectedMetric].values.slice().reverse().map((val, i) => (
                    <div key={i} className="flex items-center justify-between text-xs py-1 border-b border-white/5">
                      <span className="text-white/50">{val.match}</span>
                      <span className="text-white font-medium">{val.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/40">
            Select a player to view growth trajectory
          </div>
        )}
      </div>
    </div>
  );
}
