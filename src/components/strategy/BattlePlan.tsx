'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface PlayerInstruction {
  player: string;
  do: string[];
  dont: string[];
  key_matchup: string;
}

interface RoundGuidance {
  phase: string;
  guidance: string;
}

interface StrategicObjective {
  metric: string;
  objective: string;
  priority: number;
  reasoning: string;
}

interface ApiResponse {
  success: boolean;
  opponent: string;
  date: string;
  strategic_objectives: StrategicObjective[];
  what_to_remember: string[];
  player_instructions: Record<string, PlayerInstruction>;
  round_by_round_guidance: RoundGuidance[];
  timeout_triggers: string[];
  error?: string;
}

interface BattlePlanProps {
  opponent?: string;
  onOpponentChange?: (opponent: string) => void;
}

const OPPONENTS = ['2GAME eSports', 'Guild Esports', 'Sentinels', 'G2 Esports', 'Team Liquid'];

export default function BattlePlan({ opponent, onOpponentChange }: BattlePlanProps) {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState(opponent || OPPONENTS[0]);
  const [activeTab, setActiveTab] = useState<'summary' | 'remember' | 'players' | 'rounds'>('summary');
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(null);

  const generatePlan = async (signal?: AbortSignal) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_BASE}/api/strategy/battle-plan/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ opponent: selectedOpponent }),
        signal,
      });
      const result: ApiResponse = await response.json();

      if (result.success) {
        setData(result);
        const players = Object.keys(result.player_instructions || {});
        if (players.length > 0) {
          setSelectedPlayer(players[0]);
        }
      } else {
        setError(result.error || 'Failed to generate battle plan');
      }
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError('Failed to connect to strategy service');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedOpponent) return;

    const controller = new AbortController();
    generatePlan(controller.signal);

    return () => controller.abort();
  }, [selectedOpponent]);

  const handleOpponentChange = (opp: string) => {
    setSelectedOpponent(opp);
    onOpponentChange?.(opp);
  };

  const TABS = [
    { id: 'summary' as const, label: 'Summary', icon: '📋' },
    { id: 'remember' as const, label: 'Remember', icon: '🧠' },
    { id: 'players' as const, label: 'Players', icon: '👥' },
    { id: 'rounds' as const, label: 'Rounds', icon: '🎯' },
  ];

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">⚔️</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Battle Plan</h2>
            <p className="text-xs text-white/50">AI-generated match strategy</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Tab Switcher */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-2 py-1 text-xs rounded transition-colors ${activeTab === tab.id
                  ? 'bg-[#00a8e8]/20 text-[#00a8e8]'
                  : 'text-white/50 hover:text-white/70'
                  }`}
              >
                {tab.label}
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

          {/* Regenerate Button */}
          <button
            onClick={() => generatePlan()}
            disabled={loading}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-50"
          >
            ↻
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full text-white/50">
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
              Generating battle plan...
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full text-[#ff4757]">{error}</div>
        ) : data ? (
          <AnimatePresence mode="wait">
            {activeTab === 'summary' ? (
              <motion.div
                key="summary"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-4"
              >
                {/* Opponent Header */}
                <div className="p-4 rounded-lg bg-linear-to-r from-[#ff4757]/20 to-transparent border border-[#ff4757]/30">
                  <h3 className="text-xl font-bold text-white">vs {data?.opponent}</h3>
                  <p className="text-xs text-white/50 mt-1">
                    Generated: {new Date(data?.date).toLocaleString()}
                  </p>
                </div>

                {/* Strategic Objectives */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <h4 className="text-sm font-medium text-[#00a8e8] mb-3">Strategic Objectives</h4>
                  <div className="space-y-3">
                    {data?.strategic_objectives?.map((obj, i) => (
                      <div key={i} className="p-3 rounded bg-black/30 border-l-2 border-[#00a8e8]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{obj.objective}</span>
                          <span className="text-xs text-[#00a8e8] bg-[#00a8e8]/20 px-2 py-0.5 rounded">
                            P{obj.priority}
                          </span>
                        </div>
                        <p className="text-xs text-white/60 mb-1">{obj.reasoning}</p>
                        <div className="text-xs text-[#ffa502]">📊 {obj.metric}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeout Triggers */}
                {data?.timeout_triggers?.length > 0 && (
                  <div className="p-4 rounded-lg bg-[#ffa502]/10 border border-[#ffa502]/30">
                    <h4 className="text-sm font-medium text-[#ffa502] mb-3">Timeout Triggers</h4>
                    <ul className="space-y-1">
                      {(data?.timeout_triggers || []).map((trigger, i) => (
                        <li key={i} className="text-sm text-white/70">⏰ {trigger}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            ) : activeTab === 'remember' ? (
              <motion.div
                key="remember"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-medium text-white/70">What to Remember</h4>
                {(data?.what_to_remember ?? []).map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <p className="text-sm text-white/80">{item}</p>
                  </motion.div>
                ))}
              </motion.div>
            ) : activeTab === 'players' ? (
              <motion.div
                key="players"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex gap-4"
              >
                {/* Player List */}
                <div className="w-32 space-y-2">
                  {Object.keys(data?.player_instructions || {}).map((player, i) => (
                    <motion.button
                      key={player}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.05 }}
                      onClick={() => setSelectedPlayer(player)}
                      className={`w-full p-3 rounded-lg text-left transition-all border ${selectedPlayer === player
                        ? 'bg-[#00a8e8]/20 border-[#00a8e8]/50'
                        : 'bg-white/5 border-white/10 hover:bg-white/10'
                        }`}
                    >
                      <div className="text-sm font-medium text-white">{player}</div>
                    </motion.button>
                  ))}
                </div>

                {/* Player Instructions */}
                {selectedPlayer && data?.player_instructions[selectedPlayer] && (
                  <div className="flex-1 space-y-4">
                    <h4 className="text-lg font-bold text-white">{selectedPlayer}</h4>

                    {/* Key Matchup */}
                    <div className="p-3 rounded-lg bg-[#00a8e8]/10 border border-[#00a8e8]/30">
                      <div className="text-xs text-[#00a8e8] uppercase mb-1">Key Matchup</div>
                      <p className="text-sm text-white/80">
                        {data?.player_instructions[selectedPlayer]?.key_matchup}
                      </p>
                    </div>

                    {/* Do's */}
                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                      <h5 className="text-xs text-green-400 uppercase tracking-wider mb-2">Do</h5>
                      <ul className="space-y-1">
                        {data?.player_instructions[selectedPlayer]?.do.map((item, i) => (
                          <li key={i} className="text-sm text-white/70">✓ {item}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Don'ts */}
                    <div className="p-4 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30">
                      <h5 className="text-xs text-[#ff4757] uppercase tracking-wider mb-2">Don't</h5>
                      <ul className="space-y-1">
                        {data?.player_instructions[selectedPlayer]?.dont.map((item, i) => (
                          <li key={i} className="text-sm text-white/70">✗ {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="rounds"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-3"
              >
                <h4 className="text-sm font-medium text-white/70">Round-by-Round Guidance</h4>
                {(data?.round_by_round_guidance ?? []).map((round, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="p-4 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="text-xs text-[#00a8e8] uppercase tracking-wider mb-2">
                      {round.phase}
                    </div>
                    <p className="text-sm text-white/80">{round.guidance}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        ) : (
          <div className="flex items-center justify-center h-full text-white/40">
            Select an opponent to generate battle plan
          </div>
        )}
      </div>
    </div>
  );
}
