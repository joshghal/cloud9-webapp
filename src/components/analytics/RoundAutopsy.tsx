'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PositioningMistake {
  player: string;
  issue: string;
  severity: 'critical' | 'major' | 'minor';
  actual_position: { x: number; y: number };
  recommended_position?: { x: number; y: number };
}

interface RoundAutopsyData {
  round_number: number;
  outcome: 'win' | 'loss';
  c9_score: number;
  opp_score: number;
  key_mistakes: string[];
  positioning_mistakes: PositioningMistake[];
  trade_analysis: {
    deaths: number;
    traded: number;
    untradeable: number;
    avg_trade_time_ms: number;
  };
  economy_impact: {
    eco_disadvantage: boolean;
    loadout_diff: number;
  };
  first_death: {
    player: string;
    position: string;
    was_traded: boolean;
  } | null;
  round_duration_ms: number;
}

interface MatchAutopsyResponse {
  success: boolean;
  match_name: string;
  total_rounds: number;
  autopsies: RoundAutopsyData[];
}

interface RoundAutopsyProps {
  matchFile?: string;
  onRoundSelect?: (round: number) => void;
}

export default function RoundAutopsy({ matchFile, onRoundSelect }: RoundAutopsyProps) {
  const [data, setData] = useState<MatchAutopsyResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'losses' | 'critical'>('all');

  useEffect(() => {
    if (!matchFile) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchAutopsy = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/analytics/match-autopsy`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_file: matchFile }),
          signal: controller.signal,
        });

        const result = await response.json();
        if (didCancel) return;

        if (result.success) {
          setData(result);
          if (result.autopsies?.length > 0) {
            setSelectedRound(result.autopsies[0].round_number);
          }
        } else {
          setError(result.error || 'Failed to generate autopsy');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to analytics service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchAutopsy();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [matchFile]);

  const filteredAutopsies = data?.autopsies?.filter(a => {
    if (filterType === 'losses') return a.outcome === 'loss';
    if (filterType === 'critical') return a.positioning_mistakes.some(m => m.severity === 'critical');
    return true;
  }) || [];

  const selectedAutopsy = data?.autopsies?.find(a => a.round_number === selectedRound);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-[#ff4757] bg-[#ff4757]/20';
      case 'major': return 'text-[#ffa502] bg-[#ffa502]/20';
      default: return 'text-white/60 bg-white/10';
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">🔬</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Round Autopsy</h2>
            <p className="text-xs text-white/50">
              {data ? `${data?.total_rounds} rounds analyzed` : 'Per-round mistake analysis'}
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['all', 'losses', 'critical'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                filterType === type
                  ? 'bg-[#00a8e8]/20 text-[#00a8e8]'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Round Timeline */}
        <div className="w-48 border-r border-white/10 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-white/50">
              <div className="animate-spin w-6 h-6 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Analyzing rounds...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-[#ff4757] text-sm">{error}</div>
          ) : filteredAutopsies.length === 0 ? (
            <div className="p-4 text-center text-white/40 text-sm">
              {matchFile ? 'No rounds to analyze' : 'Select a match to analyze'}
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {filteredAutopsies.map(autopsy => (
                <button
                  key={autopsy.round_number}
                  onClick={() => {
                    setSelectedRound(autopsy.round_number);
                    onRoundSelect?.(autopsy.round_number);
                  }}
                  className={`w-full p-2 rounded-lg text-left transition-all ${
                    selectedRound === autopsy.round_number
                      ? 'bg-[#00a8e8]/20 border border-[#00a8e8]/50'
                      : 'bg-white/5 hover:bg-white/10 border border-transparent'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">R{autopsy.round_number}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${
                      autopsy.outcome === 'win'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-[#ff4757]/20 text-[#ff4757]'
                    }`}>
                      {autopsy.outcome.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    {autopsy.c9_score}-{autopsy.opp_score}
                  </div>
                  {autopsy.positioning_mistakes.some(m => m.severity === 'critical') && (
                    <div className="text-[10px] text-[#ff4757] mt-1">
                      Critical mistakes
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Round Details */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {selectedAutopsy ? (
              <motion.div
                key={selectedAutopsy.round_number}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Round Header */}
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-white">
                    Round {selectedAutopsy.round_number} Analysis
                  </h3>
                  <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedAutopsy.outcome === 'win'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-[#ff4757]/20 text-[#ff4757]'
                  }`}>
                    {selectedAutopsy.outcome === 'win' ? 'VICTORY' : 'DEFEAT'}
                  </div>
                </div>

                {/* Key Metrics */}
                <div className="grid grid-cols-4 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-white">
                      {selectedAutopsy.trade_analysis.traded}/{selectedAutopsy.trade_analysis.deaths}
                    </div>
                    <div className="text-xs text-white/50">Deaths Traded</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className={`text-2xl font-bold ${
                      selectedAutopsy.trade_analysis.avg_trade_time_ms > 6000
                        ? 'text-[#ff4757]'
                        : 'text-white'
                    }`}>
                      {(selectedAutopsy.trade_analysis.avg_trade_time_ms / 1000).toFixed(1)}s
                    </div>
                    <div className="text-xs text-white/50">Avg Trade Time</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className={`text-2xl font-bold ${
                      selectedAutopsy.trade_analysis.untradeable > 2
                        ? 'text-[#ffa502]'
                        : 'text-white'
                    }`}>
                      {selectedAutopsy.trade_analysis.untradeable}
                    </div>
                    <div className="text-xs text-white/50">Untradeable</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-2xl font-bold text-white">
                      {(selectedAutopsy.round_duration_ms / 1000).toFixed(0)}s
                    </div>
                    <div className="text-xs text-white/50">Duration</div>
                  </div>
                </div>

                {/* First Death */}
                {selectedAutopsy.first_death && (
                  <div className={`p-3 rounded-lg border-l-4 ${
                    selectedAutopsy.first_death.was_traded
                      ? 'bg-white/5 border-green-500'
                      : 'bg-[#ff4757]/10 border-[#ff4757]'
                  }`}>
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-1">First Death</div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">
                        {selectedAutopsy.first_death.player}
                      </span>
                      <span className="text-xs text-white/50">
                        @ {selectedAutopsy.first_death.position}
                      </span>
                    </div>
                    <div className={`text-xs mt-1 ${
                      selectedAutopsy.first_death.was_traded ? 'text-green-400' : 'text-[#ff4757]'
                    }`}>
                      {selectedAutopsy.first_death.was_traded ? 'Successfully traded' : 'NOT TRADED'}
                    </div>
                  </div>
                )}

                {/* Positioning Mistakes */}
                {selectedAutopsy.positioning_mistakes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white/70">Positioning Issues</h4>
                    {selectedAutopsy.positioning_mistakes.map((mistake, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`p-3 rounded-lg border-l-4 ${
                          mistake.severity === 'critical'
                            ? 'bg-[#ff4757]/10 border-[#ff4757]'
                            : mistake.severity === 'major'
                            ? 'bg-[#ffa502]/10 border-[#ffa502]'
                            : 'bg-white/5 border-white/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{mistake.player}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded uppercase ${getSeverityColor(mistake.severity)}`}>
                            {mistake.severity}
                          </span>
                        </div>
                        <p className="text-sm text-white/70">{mistake.issue}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Key Mistakes Summary */}
                {selectedAutopsy.key_mistakes.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white/70">Key Takeaways</h4>
                    <ul className="space-y-1">
                      {selectedAutopsy.key_mistakes.map((mistake, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-white/60">
                          <span className="text-[#00a8e8] mt-1">•</span>
                          {mistake}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Economy Impact */}
                {selectedAutopsy.economy_impact.eco_disadvantage && (
                  <div className="p-3 rounded-lg bg-[#ffa502]/10 border border-[#ffa502]/30">
                    <div className="text-xs text-[#ffa502] uppercase tracking-wider mb-1">Economy Alert</div>
                    <p className="text-sm text-white/70">
                      Playing at ${Math.abs(selectedAutopsy.economy_impact.loadout_diff).toLocaleString()} loadout disadvantage
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                {matchFile ? 'Select a round to view analysis' : 'Select a match to analyze'}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
