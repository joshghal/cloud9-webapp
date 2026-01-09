'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface MatchHistory {
  date: string;
  maps: string[];
  result: 'win' | 'loss';
  score: string;
  series_id: string;
  trends: Record<string, { kd_change: number; trend: string }>;
}

interface ApiResponse {
  success: boolean;
  opponent: string;
  historical_record: {
    wins: number;
    losses: number;
    win_rate: number;
  };
  match_history: MatchHistory[];
  opponent_patterns: string[];
  where_c9_loses: string[];
  weaknesses_identified: string[];
  error?: string;
}

interface OpponentMatrixProps {
  opponent?: string;
  onOpponentChange?: (opponent: string) => void;
}

const OPPONENTS = ['2GAME eSports', 'Guild Esports', 'Sentinels', 'G2 Esports', 'Team Liquid'];

export default function OpponentMatrix({ opponent, onOpponentChange }: OpponentMatrixProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState(opponent || OPPONENTS[0]);
  const [selectedMatch, setSelectedMatch] = useState<MatchHistory | null>(null);

  useEffect(() => {
    if (!selectedOpponent) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchMatrix = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/evaluation/opponent/${encodeURIComponent(selectedOpponent)}/matrix`,
          { signal: controller.signal }
        );
        const result: ApiResponse = await response.json();
        if (didCancel) return;

        if (result.success) {
          setData(result);
          if (result.match_history?.length > 0) {
            setSelectedMatch(result.match_history[0]);
          }
        } else {
          setError(result.error || 'Failed to fetch opponent matrix');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to evaluation service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchMatrix();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [selectedOpponent]);

  const handleOpponentChange = (opp: string) => {
    setSelectedOpponent(opp);
    onOpponentChange?.(opp);
  };

  const getWinRateColor = (rate: number) => {
    if (rate >= 0.6) return 'text-green-400';
    if (rate >= 0.4) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving': return { icon: '↑', color: 'text-green-400' };
      case 'declining': return { icon: '↓', color: 'text-[#ff4757]' };
      default: return { icon: '→', color: 'text-white/50' };
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">⚔️</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Opponent Matrix</h2>
            <p className="text-xs text-white/50">Head-to-head historical analysis</p>
          </div>
        </div>

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

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Loading opponent data?...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[#ff4757]">{error}</div>
        ) : data ? (
          <div className="space-y-4">
            {/* Overall Record */}
            <div className="p-4 rounded-lg bg-linear-to-r from-[#00a8e8]/20 to-transparent border border-[#00a8e8]/30">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">vs {data?.opponent}</h3>
                  <p className="text-sm text-white/50">{data?.match_history?.length || 0} matches analyzed</p>
                </div>
                <div className="text-right">
                  <div className={`text-3xl font-bold ${getWinRateColor(data?.historical_record.win_rate)}`}>
                    {(data?.historical_record.win_rate * 100).toFixed(0)}%
                  </div>
                  <div className="text-sm text-white/50">
                    {data?.historical_record.wins}W - {data?.historical_record.losses}L
                  </div>
                </div>
              </div>
            </div>

            {/* Match History */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/70">Match History</h4>
                {(data?.match_history || []).map((match, i) => (
                  <motion.button
                    key={match.series_id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => setSelectedMatch(match)}
                    className={`w-full p-3 rounded-lg text-left transition-all border ${
                      selectedMatch?.series_id === match.series_id
                        ? 'bg-[#00a8e8]/20 border-[#00a8e8]/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-sm font-bold ${
                        match.result === 'win' ? 'text-green-400' : 'text-[#ff4757]'
                      }`}>
                        {match.result.toUpperCase()}
                      </span>
                      <span className="text-sm text-white">{match.score}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/50">
                      <span>{match.maps.join(', ')}</span>
                      <span>•</span>
                      <span>{new Date(match.date).toLocaleDateString()}</span>
                    </div>
                  </motion.button>
                ))}
              </div>

              {/* Match Details */}
              {selectedMatch && (
                <div className="space-y-3">
                  <h4 className="text-sm font-medium text-white/70">Player Trends</h4>
                  <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 mb-3">
                      {selectedMatch.maps.join(', ')} • {selectedMatch.score}
                    </div>
                    {Object.keys(selectedMatch.trends).length > 0 ? (
                      <div className="space-y-2">
                        {Object.entries(selectedMatch.trends).map(([player, stats]) => {
                          const trend = getTrendIcon(stats.trend);
                          return (
                            <div key={player} className="flex items-center justify-between">
                              <span className="text-sm text-white">{player}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-sm ${
                                  stats.kd_change >= 0 ? 'text-green-400' : 'text-[#ff4757]'
                                }`}>
                                  {stats.kd_change >= 0 ? '+' : ''}{stats.kd_change.toFixed(2)} KD
                                </span>
                                <span className={trend.color}>{trend.icon}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="text-sm text-white/40">No trend data for this match</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Insights Grid */}
            <div className="grid grid-cols-3 gap-3">
              {/* Opponent Patterns */}
              <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                <h4 className="text-xs text-[#00a8e8] uppercase tracking-wider mb-2">Their Patterns</h4>
                {(data?.opponent_patterns?.length || 0) > 0 ? (
                  <ul className="space-y-1">
                    {(data?.opponent_patterns || []).map((pattern, i) => (
                      <li key={i} className="text-xs text-white/70">• {pattern}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-white/40">No patterns identified</p>
                )}
              </div>

              {/* Where C9 Loses */}
              <div className="p-3 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30">
                <h4 className="text-xs text-[#ff4757] uppercase tracking-wider mb-2">Where C9 Struggles</h4>
                {(data?.where_c9_loses?.length || 0) > 0 ? (
                  <ul className="space-y-1">
                    {(data?.where_c9_loses || []).map((issue, i) => (
                      <li key={i} className="text-xs text-white/70">• {issue}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-white/40">No issues identified</p>
                )}
              </div>

              {/* Weaknesses Identified */}
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <h4 className="text-xs text-green-400 uppercase tracking-wider mb-2">Their Weaknesses</h4>
                {(data?.weaknesses_identified?.length || 0) > 0 ? (
                  <ul className="space-y-1">
                    {(data?.weaknesses_identified || []).map((weakness, i) => (
                      <li key={i} className="text-xs text-white/70">✓ {weakness}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-white/40">No weaknesses found</p>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/40">
            Select an opponent to view head-to-head analysis
          </div>
        )}
      </div>
    </div>
  );
}
