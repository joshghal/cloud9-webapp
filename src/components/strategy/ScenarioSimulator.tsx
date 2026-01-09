'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

interface ApiScenario {
  scenario: string;
  historical_occurrences: number;
  likelihood: number;
  reasoning: string;
}

interface ApiSuggestionsResponse {
  success: boolean;
  opponent: string;
  suggested_scenarios: ApiScenario[];
  error?: string;
}

interface HistoricalData {
  occurrences: number;
  c9_win_rate_when_occurs: number;
}

interface SimulationResult {
  scenario: string;
  predicted_outcome: string;
  confidence: number;
  historical_data: HistoricalData | null;
  countermeasures: string[];
  key_decisions: string[];
  practice_recommendation: string;
  // Computed/transformed fields
  risk_level: 'low' | 'medium' | 'high';
  win_probability_change: number;
  outcomes: { outcome: string; probability: number; reasoning: string }[];
}

interface ApiSimulateResponse {
  success: boolean;
  scenario: string;
  predicted_outcome: string;
  confidence: number;
  historical_data: HistoricalData;
  countermeasures: string[];
  key_decisions: string[];
  practice_recommendation: string;
  error?: string;
}

interface ScenarioSimulatorProps {
  opponent?: string;
  onOpponentChange?: (opponent: string) => void;
}

const OPPONENTS = ['2GAME eSports', 'Guild Esports', 'Sentinels', 'G2 Esports', 'Team Liquid'];

export default function ScenarioSimulator({ opponent, onOpponentChange }: ScenarioSimulatorProps) {
  const [scenarios, setScenarios] = useState<ApiScenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedOpponent, setSelectedOpponent] = useState(opponent || OPPONENTS[0]);
  const [customScenario, setCustomScenario] = useState('');
  const [activeResult, setActiveResult] = useState<SimulationResult | null>(null);
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);

  const simulateScenario = async (scenario: string) => {
    setSimulating(true);

    try {
      const response = await fetch(`${API_BASE}/api/strategy/scenario/simulate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          opponent: selectedOpponent,
          scenario,
        }),
      });

      const apiResult: ApiSimulateResponse = await response.json();

      if (apiResult.success && apiResult.scenario) {
        // Transform API response to frontend format
        const result: SimulationResult = {
          scenario: apiResult.scenario,
          predicted_outcome: apiResult.predicted_outcome,
          confidence: apiResult.confidence,
          historical_data: apiResult.historical_data,
          countermeasures: apiResult.countermeasures || [],
          key_decisions: apiResult.key_decisions || [],
          practice_recommendation: apiResult.practice_recommendation,
          // Compute risk level based on confidence
          risk_level: apiResult.confidence >= 70 ? 'low' : apiResult.confidence >= 40 ? 'medium' : 'high',
          // Generate win probability change estimate
          win_probability_change: Math.round((apiResult.confidence - 50) / 5),
          // Transform countermeasures into outcomes
          outcomes: (apiResult.countermeasures || []).slice(0, 3).map((cm, i) => ({
            outcome: cm,
            probability: Math.round(apiResult.confidence - (i * 10)),
            reasoning: apiResult.key_decisions?.[i] || 'Based on historical analysis'
          }))
        };
        setActiveResult(result);
        setSimulations(prev => [result, ...prev.slice(0, 4)]);
      } else if (!apiResult.success) {
        setError(apiResult.error || 'Simulation failed');
      }
    } catch (err) {
      setError('Failed to run simulation');
    } finally {
      setSimulating(false);
    }
  };

  useEffect(() => {
    if (!selectedOpponent) return;

    const controller = new AbortController();
    let didCancel = false;

    const fetchSuggestions = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${API_BASE}/api/strategy/scenario/suggestions/${encodeURIComponent(selectedOpponent)}`,
          { signal: controller.signal }
        );
        const result: ApiSuggestionsResponse = await response.json();
        if (didCancel) return;

        if (result.success) {
          setScenarios(result.suggested_scenarios || []);
        } else {
          setError(result.error || 'Failed to fetch suggestions');
        }
      } catch (err) {
        if (!didCancel && err instanceof Error && err.name !== 'AbortError') {
          setError('Failed to connect to strategy service');
        }
      } finally {
        if (!didCancel) setLoading(false);
      }
    };

    fetchSuggestions();

    return () => {
      didCancel = true;
      controller.abort();
    };
  }, [selectedOpponent]);

  const handleOpponentChange = (opp: string) => {
    setSelectedOpponent(opp);
    onOpponentChange?.(opp);
  };

  const handleCustomSimulate = () => {
    if (customScenario.trim()) {
      simulateScenario(customScenario);
      setCustomScenario('');
    }
  };

  const getLikelihoodColor = (likelihood: number) => {
    if (likelihood >= 0.7) return 'text-[#ff4757]';
    if (likelihood >= 0.4) return 'text-[#ffa502]';
    return 'text-green-400';
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-[#ff4757] bg-[#ff4757]/20';
      case 'medium': return 'text-[#ffa502] bg-[#ffa502]/20';
      default: return 'text-green-400 bg-green-500/20';
    }
  };

  const getProbabilityColor = (prob: number) => {
    if (prob >= 70) return 'text-green-400';
    if (prob >= 40) return 'text-[#ffa502]';
    return 'text-[#ff4757]';
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="text-lg">🔮</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Scenario Simulator</h2>
            <p className="text-xs text-white/50">What-if analysis for upcoming matches</p>
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
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Scenarios */}
        <div className="w-80 border-r border-white/10 flex flex-col">
          {/* Custom Scenario Input */}
          <div className="p-3 border-b border-white/10">
            <div className="text-xs text-white/50 mb-2">Custom Scenario</div>
            <div className="flex gap-2">
              <input
                type="text"
                value={customScenario}
                onChange={(e) => setCustomScenario(e.target.value)}
                placeholder="What if..."
                className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#00a8e8]/50"
                onKeyDown={(e) => e.key === 'Enter' && handleCustomSimulate()}
              />
              <button
                onClick={handleCustomSimulate}
                disabled={!customScenario.trim() || simulating}
                className="px-3 py-2 rounded-lg bg-[#00a8e8]/20 text-[#00a8e8] hover:bg-[#00a8e8]/30 disabled:opacity-50 transition-colors"
              >
                {simulating ? '...' : '▶'}
              </button>
            </div>
          </div>

          {/* Suggested Scenarios */}
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? (
              <div className="text-center text-white/50 py-4">
                <div className="animate-spin w-6 h-6 border-2 border-[#00a8e8] border-t-transparent rounded-full mx-auto mb-2" />
                Loading scenarios...
              </div>
            ) : error ? (
              <div className="text-center text-[#ff4757] text-sm py-4">{error}</div>
            ) : scenarios.length > 0 ? (
              <div className="space-y-2">
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">AI-Suggested Scenarios</div>
                {scenarios.filter(s => s && s.scenario).map((scenario, i) => (
                  <motion.button
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    onClick={() => simulateScenario(scenario.scenario)}
                    disabled={simulating}
                    className="w-full p-3 rounded-lg bg-white/5 border border-white/10 text-left hover:bg-white/10 transition-all disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${getLikelihoodColor(scenario.likelihood || 0)}`}>
                        {((scenario.likelihood || 0) * 100).toFixed(0)}% likely
                      </span>
                      <span className="text-xs text-white/40">
                        {scenario.historical_occurrences || 0}x occurred
                      </span>
                    </div>
                    <div className="text-sm font-medium text-white mb-1">{scenario.scenario}</div>
                    <p className="text-xs text-white/50">{scenario.reasoning || ''}</p>
                  </motion.button>
                ))}
              </div>
            ) : (
              <div className="text-center text-white/40 py-4">No suggestions available</div>
            )}
          </div>

          {/* Recent Simulations */}
          {simulations.length > 0 && (
            <div className="border-t border-white/10 p-3 max-h-48 overflow-y-auto">
              <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Recent Simulations</div>
              <div className="space-y-1">
                {simulations.filter(Boolean).map((sim, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveResult(sim)}
                    className={`w-full p-2 rounded text-left transition-all text-xs ${
                      activeResult === sim
                        ? 'bg-[#00a8e8]/20 border border-[#00a8e8]/50'
                        : 'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="truncate text-white/80">{sim.scenario}</div>
                    <div className={`${getProbabilityColor(sim.confidence)}`}>
                      {sim.confidence}% confidence
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Panel - Results */}
        <div className="flex-1 overflow-y-auto p-4">
          <AnimatePresence mode="wait">
            {simulating ? (
              <motion.div
                key="simulating"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center">
                  <div className="relative w-16 h-16 mx-auto mb-4">
                    <div className="absolute inset-0 border-4 border-[#00a8e8]/20 rounded-full" />
                    <div className="absolute inset-0 border-4 border-[#00a8e8] border-t-transparent rounded-full animate-spin" />
                    <div className="absolute inset-2 border-4 border-purple-500/20 rounded-full" />
                    <div className="absolute inset-2 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }} />
                  </div>
                  <div className="text-white/50">Simulating scenario...</div>
                </div>
              </motion.div>
            ) : activeResult ? (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                {/* Scenario Header */}
                <div className="p-4 rounded-lg bg-gradient-to-r from-purple-500/20 to-transparent border border-purple-500/30">
                  <h3 className="text-lg font-bold text-white mb-1">{activeResult.scenario}</h3>
                  <div className="flex items-center gap-3">
                    <span className={`text-xs px-2 py-0.5 rounded ${getRiskColor(activeResult.risk_level)}`}>
                      {activeResult.risk_level.toUpperCase()} RISK
                    </span>
                    <span className={`text-sm font-medium ${getProbabilityColor(activeResult.confidence)}`}>
                      {activeResult.confidence}% confidence
                    </span>
                  </div>
                </div>

                {/* Predicted Outcome */}
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Predicted Outcome</div>
                  <p className="text-sm text-white/80">{activeResult.predicted_outcome}</p>

                  <div className="mt-3 flex items-center gap-2">
                    <span className="text-xs text-white/50">Win Probability Impact:</span>
                    <span className={`text-sm font-bold ${
                      activeResult.win_probability_change >= 0 ? 'text-green-400' : 'text-[#ff4757]'
                    }`}>
                      {activeResult.win_probability_change >= 0 ? '+' : ''}{activeResult.win_probability_change}%
                    </span>
                  </div>
                </div>

                {/* Countermeasures / Outcome Probabilities */}
                {activeResult.outcomes?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-white/50 uppercase tracking-wider">Countermeasures</div>
                    {activeResult.outcomes.map((outcome, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 rounded-lg bg-white/5 border border-white/10"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-white">{outcome.outcome}</span>
                          <span className={`text-sm font-bold ${getProbabilityColor(outcome.probability)}`}>
                            {outcome.probability}% effective
                          </span>
                        </div>
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden mb-2">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${outcome.probability}%` }}
                            transition={{ duration: 0.5, delay: i * 0.1 }}
                            className={`h-full ${
                              outcome.probability >= 70 ? 'bg-green-500' :
                              outcome.probability >= 40 ? 'bg-[#ffa502]' : 'bg-[#ff4757]'
                            }`}
                          />
                        </div>
                        <p className="text-xs text-white/50">{outcome.reasoning}</p>
                      </motion.div>
                    ))}
                  </div>
                )}

                {/* Practice Recommendation */}
                {activeResult.practice_recommendation && (
                  <div className="p-4 rounded-lg bg-[#00a8e8]/10 border border-[#00a8e8]/30">
                    <div className="text-xs text-[#00a8e8] uppercase tracking-wider mb-2">Practice Recommendation</div>
                    <p className="text-sm text-white/80">{activeResult.practice_recommendation}</p>
                  </div>
                )}

                {/* Key Decisions */}
                {activeResult.key_decisions?.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-xs text-white/50 uppercase tracking-wider">Key Decisions</div>
                    <div className="space-y-1">
                      {activeResult.key_decisions.map((decision, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-white/60">
                          <span className="text-[#00a8e8]">•</span>
                          {decision}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Historical Context */}
                {activeResult.historical_data && (
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Historical Context</div>
                    <div className="flex gap-4">
                      <div className="text-center">
                        <div className="text-lg font-bold text-white">{activeResult.historical_data.occurrences}</div>
                        <div className="text-xs text-white/50">Occurrences</div>
                      </div>
                      <div className="text-center">
                        <div className={`text-lg font-bold ${activeResult.historical_data.c9_win_rate_when_occurs >= 0.5 ? 'text-green-400' : 'text-[#ff4757]'}`}>
                          {Math.round(activeResult.historical_data.c9_win_rate_when_occurs * 100)}%
                        </div>
                        <div className="text-xs text-white/50">C9 Win Rate</div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex items-center justify-center h-full"
              >
                <div className="text-center text-white/40">
                  <div className="text-4xl mb-2">🔮</div>
                  <p>Select a scenario or create your own</p>
                  <p className="text-xs mt-1">to see the predicted outcome</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
