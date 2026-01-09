'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface TurningPoint {
  round: number;
  type: 'negative' | 'positive';
  severity: 'critical' | 'major' | 'moderate';
  trigger: string;
  description: string;
  score_before: string;
  score_after: string;
  momentum_shift: number;
  contributing_factors: string[];
  recovery_actions?: string[];
}

interface ApiTurningPoint {
  round_number: number;
  type: 'negative' | 'positive';
  category: string;
  description: string;
  impact: string;
  score_before: { c9: number; opp: number };
  score_after: { c9: number; opp: number };
  win_probability_before: number;
  win_probability_after: number;
  key_events: string[];
  what_if_analysis: string | null;
}

interface TurningPointsResponse {
  success: boolean;
  total_turning_points: number;
  positive_count: number;
  negative_count: number;
  turning_points: TurningPoint[];
}

interface TurningPointsProps {
  matchFile?: string;
  onPointSelect?: (point: TurningPoint) => void;
}

export default function TurningPoints({ matchFile, onPointSelect }: TurningPointsProps) {
  const [data, setData] = useState<TurningPointsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPoint, setSelectedPoint] = useState<TurningPoint | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'negative' | 'positive'>('all');

  const transformApiResponse = (apiPoints: ApiTurningPoint[]): TurningPoint[] => {
    return apiPoints.map(p => {
      const probShift = Math.round((p.win_probability_after - p.win_probability_before) * 100);
      return {
        round: p.round_number,
        type: p.type,
        severity: Math.abs(probShift) >= 15 ? 'critical' : Math.abs(probShift) >= 8 ? 'major' : 'moderate',
        trigger: p.key_events[0] || p.category,
        description: p.description,
        score_before: `${p.score_before.c9}-${p.score_before.opp}`,
        score_after: `${p.score_after.c9}-${p.score_after.opp}`,
        momentum_shift: probShift,
        contributing_factors: p.key_events,
        recovery_actions: p.what_if_analysis ? [p.what_if_analysis] : undefined,
      };
    });
  };

  useEffect(() => {
    if (!matchFile) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchTurningPoints = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/analytics/turning-points`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ match_file: matchFile }),
          signal: controller.signal,
        });

        const result = await response.json();
        if (didCancel) return;

        if (result.success) {
          const transformed: TurningPointsResponse = {
            success: true,
            total_turning_points: result.total_turning_points,
            positive_count: result.positive_count,
            negative_count: result.negative_count,
            turning_points: transformApiResponse(result.turning_points),
          };
          setData(transformed);
          if (transformed.turning_points.length > 0) {
            setSelectedPoint(transformed.turning_points[0]);
          }
        } else {
          setError(result.error || 'Failed to detect turning points');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to analytics service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchTurningPoints();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [matchFile]);

  const filteredPoints = data?.turning_points.filter(p =>
    filterType === 'all' || p.type === filterType
  ) || [];

  const handlePointClick = (point: TurningPoint) => {
    setSelectedPoint(point);
    onPointSelect?.(point);
  };

  const getTypeIcon = (type: string) => {
    return type === 'positive' ? '📈' : '📉';
  };

  const getSeverityBadge = (severity: string, type: string) => {
    const baseColor = type === 'positive'
      ? 'bg-green-500/20 text-green-400'
      : severity === 'critical'
      ? 'bg-[#ff4757]/20 text-[#ff4757]'
      : severity === 'major'
      ? 'bg-[#ffa502]/20 text-[#ffa502]'
      : 'bg-white/10 text-white/60';

    return `text-[10px] px-2 py-0.5 rounded uppercase ${baseColor}`;
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">🎯</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Turning Points</h2>
            <p className="text-xs text-white/50">
              {data ? `${data?.total_turning_points} momentum shifts detected` : 'Critical momentum shifts'}
            </p>
          </div>
        </div>

        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {(['all', 'negative', 'positive'] as const).map(type => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-2 py-1 text-xs rounded transition-colors capitalize ${
                filterType === type
                  ? type === 'positive'
                    ? 'bg-green-500/20 text-green-400'
                    : type === 'negative'
                    ? 'bg-[#ff4757]/20 text-[#ff4757]'
                    : 'bg-[#00a8e8]/20 text-[#00a8e8]'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Summary Stats */}
      {data && (
        <div className="px-4 py-3 border-b border-white/10 bg-white/5">
          <div className="grid grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-[#ff4757]">
                {data?.negative_count}
              </div>
              <div className="text-xs text-white/50">Collapses</div>
            </div>
            <div>
              <div className="text-xl font-bold text-green-400">
                {data?.positive_count}
              </div>
              <div className="text-xs text-white/50">Recoveries</div>
            </div>
            <div>
              <div className="text-xl font-bold text-[#ffa502]">
                {(data?.turning_points?.length || 0) > 0
                  ? `R${(data?.turning_points || []).reduce((max, p) =>
                      Math.abs(p.momentum_shift) > Math.abs(max.momentum_shift) ? p : max
                    ).round}`
                  : '-'}
              </div>
              <div className="text-xs text-white/50">Biggest Swing</div>
            </div>
            <div>
              <div className={`text-xl font-bold ${
                data?.positive_count >= data?.negative_count ? 'text-green-400' : 'text-[#ff4757]'
              }`}>
                {data?.total_turning_points > 0
                  ? Math.round((data?.positive_count / data?.total_turning_points) * 100)
                  : 0}%
              </div>
              <div className="text-xs text-white/50">Recovery Rate</div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Timeline */}
        <div className="w-64 border-r border-white/10 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-white/50">
              <div className="animate-spin w-6 h-6 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Detecting turning points...
            </div>
          ) : error ? (
            <div className="p-4 text-center text-[#ff4757] text-sm">{error}</div>
          ) : filteredPoints.length === 0 ? (
            <div className="p-4 text-center text-white/40 text-sm">No turning points found</div>
          ) : (
            <div className="relative p-4">
              {/* Timeline line */}
              <div className="absolute left-8 top-4 bottom-4 w-0.5 bg-white/10" />

              <div className="space-y-3">
                {filteredPoints.map((point, idx) => (
                  <button
                    key={`${point.round}-${idx}`}
                    onClick={() => handlePointClick(point)}
                    className={`relative w-full text-left transition-all ${
                      selectedPoint?.round === point.round
                        ? 'scale-105'
                        : ''
                    }`}
                  >
                    {/* Timeline dot */}
                    <div className={`absolute left-0 w-4 h-4 rounded-full border-2 ${
                      point.type === 'positive'
                        ? 'bg-green-500 border-green-400'
                        : point.severity === 'critical'
                        ? 'bg-[#ff4757] border-[#ff4757]'
                        : 'bg-[#ffa502] border-[#ffa502]'
                    }`} />

                    {/* Card */}
                    <div className={`ml-8 p-3 rounded-lg transition-all ${
                      selectedPoint?.round === point.round
                        ? 'bg-[#00a8e8]/20 border border-[#00a8e8]/50'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">
                          {getTypeIcon(point.type)} R{point.round}
                        </span>
                        <span className={getSeverityBadge(point.severity, point.type)}>
                          {point.severity}
                        </span>
                      </div>
                      <div className="text-xs text-white/60 truncate">{point.trigger}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-white/40">{point.score_before}</span>
                        <span className="text-[10px] text-white/30">→</span>
                        <span className="text-xs text-white/40">{point.score_after}</span>
                        <span className={`text-xs font-medium ${
                          point.type === 'positive' ? 'text-green-400' : 'text-[#ff4757]'
                        }`}>
                          {point.momentum_shift > 0 ? '+' : ''}{point.momentum_shift}%
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Point Details */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {selectedPoint ? (
              <motion.div
                key={selectedPoint.round}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Header */}
                <div className={`p-4 rounded-lg ${
                  selectedPoint.type === 'positive'
                    ? 'bg-green-500/10 border border-green-500/30'
                    : 'bg-[#ff4757]/10 border border-[#ff4757]/30'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">
                      {getTypeIcon(selectedPoint.type)} Round {selectedPoint.round}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      selectedPoint.type === 'positive'
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-[#ff4757]/20 text-[#ff4757]'
                    }`}>
                      {selectedPoint.type === 'positive' ? 'MOMENTUM GAIN' : 'MOMENTUM LOSS'}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">{selectedPoint.description}</p>
                </div>

                {/* Trigger */}
                <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-1">Trigger Event</div>
                  <p className="text-sm text-white">{selectedPoint.trigger}</p>
                </div>

                {/* Score Change */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <div className="text-xl font-bold text-white">{selectedPoint.score_before}</div>
                    <div className="text-xs text-white/50">Before</div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center flex items-center justify-center">
                    <div className={`text-2xl font-bold ${
                      selectedPoint.type === 'positive' ? 'text-green-400' : 'text-[#ff4757]'
                    }`}>
                      {selectedPoint.momentum_shift > 0 ? '+' : ''}{selectedPoint.momentum_shift}%
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <div className="text-xl font-bold text-white">{selectedPoint.score_after}</div>
                    <div className="text-xs text-white/50">After</div>
                  </div>
                </div>

                {/* Contributing Factors */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-white/70">Contributing Factors</h4>
                  <div className="space-y-1">
                    {selectedPoint.contributing_factors.map((factor, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-2 p-2 rounded bg-white/5"
                      >
                        <span className={`text-sm ${
                          selectedPoint.type === 'positive' ? 'text-green-400' : 'text-[#ff4757]'
                        }`}>•</span>
                        <span className="text-sm text-white/70">{factor}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Recovery Actions (for negative points) */}
                {selectedPoint.type === 'negative' && selectedPoint.recovery_actions && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-white/70">Recovery Actions</h4>
                    <div className="p-3 rounded-lg bg-[#00a8e8]/10 border border-[#00a8e8]/30">
                      <ul className="space-y-1">
                        {selectedPoint.recovery_actions.map((action, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                            <span className="text-[#00a8e8]">✓</span>
                            {action}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* Momentum Visualization */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-white/70 mb-3">Momentum Impact</h4>
                  <div className="relative h-8 bg-black/30 rounded-full overflow-hidden">
                    <div
                      className={`absolute top-0 bottom-0 transition-all duration-500 ${
                        selectedPoint.type === 'positive'
                          ? 'bg-gradient-to-r from-green-500/50 to-green-400'
                          : 'bg-gradient-to-r from-[#ff4757]/50 to-[#ff4757]'
                      }`}
                      style={{
                        left: selectedPoint.type === 'positive' ? '50%' : `${50 + selectedPoint.momentum_shift}%`,
                        right: selectedPoint.type === 'positive' ? `${50 - selectedPoint.momentum_shift}%` : '50%',
                      }}
                    />
                    <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-white/30" />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                      {Math.abs(selectedPoint.momentum_shift)}% Shift
                    </div>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="flex items-center justify-center h-full text-white/40">
                {matchFile ? 'Select a turning point to view details' : 'Select a match to analyze'}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
