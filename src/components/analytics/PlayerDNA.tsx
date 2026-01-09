'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface StatComparison {
  value: number;
  personal_avg: number;
  team_avg: number;
  percentile: number;
}

interface PlayerDNAData {
  player_name: string;
  match_name: string;
  role: string;
  performance_rating: number;
  stats: {
    kills: StatComparison;
    deaths: StatComparison;
    assists: StatComparison;
    adr: StatComparison;
    kast: StatComparison;
    first_kills: StatComparison;
    first_deaths: StatComparison;
    trade_rate: StatComparison;
    clutch_rate: StatComparison;
  };
  strengths: string[];
  weaknesses: string[];
  notable_rounds: {
    round: number;
    description: string;
    impact: 'positive' | 'negative';
  }[];
  comparison_verdict: 'above_average' | 'average' | 'below_average';
}

interface PlayerDNAResponse {
  success: boolean;
  dna: PlayerDNAData;
  error?: string;
}

interface PlayerDNAProps {
  matchFile?: string;
  playerName?: string;
  onPlayerChange?: (player: string) => void;
}

const PLAYERS = ['OXY', 'Xeppaa', 'neT', 'mCe', 'jakee'];

export default function PlayerDNA({ matchFile, playerName, onPlayerChange }: PlayerDNAProps) {
  const [data, setData] = useState<PlayerDNAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState(playerName || PLAYERS[0]);

  useEffect(() => {
    if (!matchFile || !selectedPlayer) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchPlayerDNA = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(`${API_BASE}/api/analytics/player-dna`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            match_file: matchFile,
            player_name: selectedPlayer,
          }),
          signal: controller.signal,
        });

        const result: PlayerDNAResponse = await response.json();
        if (didCancel) return;

        if (result.success) {
          setData(result.dna);
        } else {
          setError(result.error || 'Failed to generate player DNA');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to analytics service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchPlayerDNA();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [matchFile, selectedPlayer]);

  const handlePlayerChange = (player: string) => {
    setSelectedPlayer(player);
    onPlayerChange?.(player);
  };

  const getPercentileColor = (percentile: number) => {
    if (percentile >= 80) return 'text-green-400';
    if (percentile >= 50) return 'text-white';
    if (percentile >= 30) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  const getPercentileBar = (percentile: number) => {
    const color = percentile >= 80 ? 'bg-green-500' : percentile >= 50 ? 'bg-[#00a8e8]' : percentile >= 30 ? 'bg-[#ffa502]' : 'bg-[#ff4757]';
    return (
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className={`h-full ${color} transition-all duration-500`} style={{ width: `${percentile}%` }} />
      </div>
    );
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'above_average':
        return 'bg-green-500/20 text-green-400';
      case 'below_average':
        return 'bg-[#ff4757]/20 text-[#ff4757]';
      default:
        return 'bg-white/10 text-white/60';
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 1.2) return 'text-green-400';
    if (rating >= 1.0) return 'text-white';
    if (rating >= 0.8) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">🧬</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Player DNA</h2>
            <p className="text-xs text-white/50">Individual match performance report</p>
          </div>
        </div>

        {/* Player Selector */}
        <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
          {PLAYERS.map(player => (
            <button
              key={player}
              onClick={() => handlePlayerChange(player)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                selectedPlayer === player
                  ? 'bg-[#00a8e8]/20 text-[#00a8e8]'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              {player}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Generating player DNA...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[#ff4757]">{error}</div>
        ) : data ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Player Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white">{data?.player_name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-sm text-white/50">{data?.role}</span>
                  <span className={`text-xs px-2 py-0.5 rounded capitalize ${getVerdictBadge(data?.comparison_verdict)}`}>
                    {data?.comparison_verdict.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-4xl font-black ${getRatingColor(data?.performance_rating)}`}>
                  {data?.performance_rating.toFixed(2)}
                </div>
                <div className="text-xs text-white/50">Rating</div>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                <h4 className="text-xs text-green-400 uppercase tracking-wider mb-2">Strengths</h4>
                <ul className="space-y-1">
                  {(data?.strengths || []).map((strength, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-green-400">+</span>
                      {strength}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="p-3 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30">
                <h4 className="text-xs text-[#ff4757] uppercase tracking-wider mb-2">Areas to Improve</h4>
                <ul className="space-y-1">
                  {(data?.weaknesses || []).map((weakness, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="text-[#ff4757]">-</span>
                      {weakness}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-white/70">Performance Breakdown</h4>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(data?.stats).map(([key, stat]) => (
                  <div key={key} className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/50 uppercase">{key.replace('_', ' ')}</span>
                      <span className={`text-sm font-bold ${getPercentileColor(stat.percentile)}`}>
                        {typeof stat.value === 'number' && stat.value % 1 !== 0
                          ? stat.value.toFixed(1)
                          : stat.value}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getPercentileBar(stat.percentile)}
                      <span className="text-[10px] text-white/40 w-8">{stat.percentile}%</span>
                    </div>
                    <div className="flex justify-between mt-1.5 text-[10px] text-white/30">
                      <span>Personal: {stat.personal_avg.toFixed(1)}</span>
                      <span>Team: {stat.team_avg.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Notable Rounds */}
            {(data?.notable_rounds?.length || 0) > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-white/70">Notable Rounds</h4>
                <div className="space-y-2">
                  {(data?.notable_rounds || []).map((round, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={`p-3 rounded-lg border-l-4 ${
                        round.impact === 'positive'
                          ? 'bg-green-500/10 border-green-500'
                          : 'bg-[#ff4757]/10 border-[#ff4757]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-white">Round {round.round}</span>
                        <span className={`text-xs ${
                          round.impact === 'positive' ? 'text-green-400' : 'text-[#ff4757]'
                        }`}>
                          {round.impact === 'positive' ? '↑' : '↓'}
                        </span>
                      </div>
                      <p className="text-sm text-white/60">{round.description}</p>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

            {/* Radar Chart Placeholder */}
            <div className="p-4 rounded-lg bg-white/5 border border-white/10">
              <h4 className="text-sm font-medium text-white/70 mb-3">Performance Profile</h4>
              <div className="relative aspect-square max-w-xs mx-auto">
                {/* Hexagon background */}
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  {/* Background rings */}
                  {[1, 0.75, 0.5, 0.25].map((scale, i) => (
                    <polygon
                      key={i}
                      points="50,5 95,27.5 95,72.5 50,95 5,72.5 5,27.5"
                      fill="none"
                      stroke="white"
                      strokeOpacity={0.1}
                      transform={`scale(${scale}) translate(${(1 - scale) * 50} ${(1 - scale) * 50})`}
                    />
                  ))}

                  {/* Data polygon */}
                  <polygon
                    points={`
                      ${50},${5 + (1 - data?.stats.kills.percentile / 100) * 45}
                      ${95 - (1 - data?.stats.adr.percentile / 100) * 45},${27.5 + (1 - data?.stats.adr.percentile / 100) * 22.5}
                      ${95 - (1 - data?.stats.trade_rate.percentile / 100) * 45},${72.5 - (1 - data?.stats.trade_rate.percentile / 100) * 22.5}
                      ${50},${95 - (1 - data?.stats.kast.percentile / 100) * 45}
                      ${5 + (1 - data?.stats.first_kills.percentile / 100) * 45},${72.5 - (1 - data?.stats.first_kills.percentile / 100) * 22.5}
                      ${5 + (1 - data?.stats.clutch_rate.percentile / 100) * 45},${27.5 + (1 - data?.stats.clutch_rate.percentile / 100) * 22.5}
                    `}
                    fill="rgba(0, 168, 232, 0.2)"
                    stroke="#00a8e8"
                    strokeWidth="2"
                  />

                  {/* Labels */}
                  <text x="50" y="0" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="4">Kills</text>
                  <text x="100" y="27.5" textAnchor="end" fill="white" fillOpacity="0.5" fontSize="4">ADR</text>
                  <text x="100" y="77.5" textAnchor="end" fill="white" fillOpacity="0.5" fontSize="4">Trade</text>
                  <text x="50" y="100" textAnchor="middle" fill="white" fillOpacity="0.5" fontSize="4">KAST</text>
                  <text x="0" y="77.5" textAnchor="start" fill="white" fillOpacity="0.5" fontSize="4">First Kill</text>
                  <text x="0" y="27.5" textAnchor="start" fill="white" fillOpacity="0.5" fontSize="4">Clutch</text>
                </svg>
              </div>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-white/40">
            Select a match to view player DNA
          </div>
        )}
      </div>
    </div>
  );
}
