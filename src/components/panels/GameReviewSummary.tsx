'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useState } from 'react';
import type { TimeoutAlert, ReplayComplete } from '@/types';

interface PanicUtilityEvent {
  player: string;
  ability: string;
  round: number;
  timeToDeath: number;
}

interface TradeTimeEntry {
  round: number;
  trade_time_ms: number;
  traded: boolean;
}

interface SeriesData {
  games: {
    gameNumber: number;
    mapName: string;
    alerts: TimeoutAlert[];
    panicUtilityEvents: PanicUtilityEvent[];
    tradeTimeHistory: TradeTimeEntry[];
  }[];
  allAlerts: TimeoutAlert[];
  allPanicEvents: PanicUtilityEvent[];
  allTradeTimeHistory: { gameNumber: number; mapName: string; entries: TradeTimeEntry[] }[];
}

interface GameReviewSummaryProps {
  replayComplete: ReplayComplete;
  alerts: TimeoutAlert[];
  panicUtilityEvents: PanicUtilityEvent[];
  tradeTimeHistory: TradeTimeEntry[];
  seriesData: SeriesData;
  onDismiss?: () => void;
}

export function GameReviewSummary({
  replayComplete,
  alerts,
  panicUtilityEvents,
  tradeTimeHistory,
  seriesData,
}: GameReviewSummaryProps) {
  const [selectedGame, setSelectedGame] = useState<number | 'all'>('all');

  // Combine current game data with series data for complete picture
  const completeSeriesData = useMemo(() => {
    // All alerts = series archived + current game
    const allAlerts = [...seriesData.allAlerts, ...alerts];

    // All panic events = series archived + current game
    const allPanicEvents = [...seriesData.allPanicEvents, ...panicUtilityEvents];

    // Calculate the next game number (avoid duplicates)
    const maxArchivedGame = seriesData.games.reduce((max, g) => Math.max(max, g.gameNumber), 0);
    const currentGameNumber = maxArchivedGame + 1;

    // All trade time = series archived + current game
    const allTradeTime = [
      ...seriesData.allTradeTimeHistory,
      ...(tradeTimeHistory.length > 0 ? [{
        gameNumber: currentGameNumber,
        mapName: 'Current',
        entries: tradeTimeHistory,
      }] : [])
    ];

    // Build games list including current (only if there's data)
    const hasCurrentData = tradeTimeHistory.length > 0 || alerts.length > 0 || panicUtilityEvents.length > 0;
    const games = [
      ...seriesData.games,
      ...(hasCurrentData ? [{
        gameNumber: currentGameNumber,
        mapName: 'Current Game',
        alerts: alerts,
        panicUtilityEvents: panicUtilityEvents,
        tradeTimeHistory: tradeTimeHistory,
      }] : [])
    ];

    return {
      allAlerts,
      allPanicEvents,
      allTradeTime,
      games,
      totalGames: games.length,
    };
  }, [seriesData, alerts, panicUtilityEvents, tradeTimeHistory]);

  // Calculate metrics based on selection
  const metrics = useMemo(() => {
    const baseline = 6000;
    let targetAlerts: TimeoutAlert[];
    let targetPanicEvents: PanicUtilityEvent[];
    let targetTradeTime: TradeTimeEntry[];

    if (selectedGame === 'all') {
      targetAlerts = completeSeriesData.allAlerts;
      targetPanicEvents = completeSeriesData.allPanicEvents;
      targetTradeTime = completeSeriesData.allTradeTime.flatMap(g => g.entries);
    } else {
      const game = completeSeriesData.games.find(g => g.gameNumber === selectedGame);
      targetAlerts = game?.alerts || [];
      targetPanicEvents = game?.panicUtilityEvents || [];
      targetTradeTime = game?.tradeTimeHistory || [];
    }

    // Peak trade time degradation
    const peakTradeTime = Math.max(...targetTradeTime.map(t => t.trade_time_ms), 0);
    const peakDegradation = baseline > 0 && peakTradeTime > 0
      ? Math.round((peakTradeTime / baseline - 1) * 100)
      : 0;
    const peakRound = targetTradeTime.find(t => t.trade_time_ms === peakTradeTime)?.round || 0;

    // Panic utility by player
    const panicByPlayer: Record<string, number> = {};
    targetPanicEvents.forEach(e => {
      panicByPlayer[e.player] = (panicByPlayer[e.player] || 0) + 1;
    });
    const topPanicPlayer = Object.entries(panicByPlayer).sort((a, b) => b[1] - a[1])[0];

    // Alerts by confidence
    const highConfidenceAlerts = targetAlerts.filter(a => a.confidence >= 80).length;

    // Per-game stats
    const gameStats = completeSeriesData.games.map(game => {
      const gamePeakTT = Math.max(...game.tradeTimeHistory.map(t => t.trade_time_ms), 0);
      const gamePeakDeg = baseline > 0 && gamePeakTT > 0
        ? Math.round((gamePeakTT / baseline - 1) * 100)
        : 0;
      return {
        gameNumber: game.gameNumber,
        mapName: game.mapName,
        alerts: game.alerts?.length || 0,
        panicEvents: game.panicUtilityEvents?.length || 0,
        peakDegradation: gamePeakDeg,
        rounds: game.tradeTimeHistory?.length || 0,
      };
    });

    return {
      peakTradeTime,
      peakDegradation,
      peakRound,
      topPanicPlayer,
      highConfidenceAlerts,
      totalAlerts: targetAlerts.length,
      totalPanicEvents: targetPanicEvents.length,
      gameStats,
      collapseRounds: targetAlerts.filter(a => a.confidence >= 70).map(a => a.round),
    };
  }, [selectedGame, completeSeriesData]);

  // Generate insights
  const insights = useMemo(() => {
    const list: { type: 'critical' | 'warning' | 'info'; text: string }[] = [];

    if (metrics.peakDegradation > 150) {
      list.push({
        type: 'critical',
        text: `Peak coordination breakdown: +${metrics.peakDegradation}% trade time in Round ${metrics.peakRound}. Team fragmented under pressure.`
      });
    } else if (metrics.peakDegradation > 100) {
      list.push({
        type: 'warning',
        text: `Trade time spiked +${metrics.peakDegradation}% in Round ${metrics.peakRound}. Signs of communication breakdown.`
      });
    }

    if (metrics.topPanicPlayer && metrics.topPanicPlayer[1] >= 3) {
      list.push({
        type: 'warning',
        text: `${metrics.topPanicPlayer[0]} showed panic behavior: ${metrics.topPanicPlayer[1]} abilities used within 2s of death. Consider mentality check.`
      });
    }

    if (metrics.totalAlerts >= 3) {
      list.push({
        type: 'critical',
        text: `${metrics.totalAlerts} timeout recommendations generated across the series. ${replayComplete.actual_timeouts} were called.`
      });
    }

    // Multi-game insight
    if (completeSeriesData.totalGames > 1) {
      const worstGame = metrics.gameStats.reduce((worst, game) =>
        game.peakDegradation > worst.peakDegradation ? game : worst
      , metrics.gameStats[0]);

      if (worstGame && worstGame.peakDegradation > 100) {
        list.push({
          type: 'warning',
          text: `Game ${worstGame.gameNumber} (${worstGame.mapName}) had the worst collapse: +${worstGame.peakDegradation}% trade time degradation.`
        });
      }
    }

    if (list.length === 0) {
      list.push({
        type: 'info',
        text: 'No significant collapse patterns detected. Team maintained composure throughout the series.'
      });
    }

    return list;
  }, [metrics, replayComplete, completeSeriesData]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-3">
            Series Analysis
            <span className="text-xs text-[#00a8e8] bg-[#00a8e8]/10 px-2 py-1 rounded-full">
              ASSISTANT COACH REVIEW
            </span>
          </h2>
          <p className="text-sm text-white/50 mt-1">
            {completeSeriesData.totalGames} game{completeSeriesData.totalGames > 1 ? 's' : ''} analyzed • All data aggregated
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-black text-white">{replayComplete.final_score}</div>
          <div className="text-sm text-white/40">{replayComplete.total_rounds} total rounds</div>
        </div>
      </div>

      {/* Game Selector Tabs */}
      {completeSeriesData.totalGames > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setSelectedGame('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
              selectedGame === 'all'
                ? 'bg-[#00a8e8] text-white'
                : 'bg-white/5 text-white/60 hover:bg-white/10'
            }`}
          >
            All Games
          </button>
          {completeSeriesData.games.map((game, idx) => (
            <button
              key={`game-${game.gameNumber}-${idx}`}
              onClick={() => setSelectedGame(game.gameNumber)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedGame === game.gameNumber
                  ? 'bg-[#00a8e8] text-white'
                  : 'bg-white/5 text-white/60 hover:bg-white/10'
              }`}
            >
              Game {game.gameNumber}
              {game.mapName && <span className="ml-1 opacity-60">({game.mapName})</span>}
            </button>
          ))}
        </div>
      )}

      {/* Per-Game Breakdown (when viewing all) */}
      {selectedGame === 'all' && completeSeriesData.totalGames > 1 && (
        <div className="grid grid-cols-3 gap-3">
          {metrics.gameStats.map((game, idx) => (
            <motion.div
              key={`stats-${game.gameNumber}-${idx}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`p-4 rounded-xl border ${
                game.peakDegradation > 100
                  ? 'bg-[#ff4757]/10 border-[#ff4757]/30'
                  : 'bg-white/5 border-white/10'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-white">Game {game.gameNumber}</span>
                <span className="text-xs text-white/40">{game.mapName}</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <div className={`text-lg font-bold ${game.alerts > 0 ? 'text-[#ff4757]' : 'text-white/60'}`}>
                    {game.alerts}
                  </div>
                  <div className="text-[10px] text-white/40">Alerts</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${game.panicEvents >= 3 ? 'text-[#ffa502]' : 'text-white/60'}`}>
                    {game.panicEvents}
                  </div>
                  <div className="text-[10px] text-white/40">Panic</div>
                </div>
                <div>
                  <div className={`text-lg font-bold ${game.peakDegradation > 100 ? 'text-[#ff4757]' : 'text-white/60'}`}>
                    +{game.peakDegradation}%
                  </div>
                  <div className="text-[10px] text-white/40">Peak TT</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className={`text-3xl font-black ${metrics.totalAlerts >= 3 ? 'text-[#ff4757]' : 'text-white'}`}>
            {metrics.totalAlerts}
          </div>
          <div className="text-xs text-white/50 mt-1">Timeout Alerts</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-3xl font-black text-[#00a8e8]">
            {replayComplete.actual_timeouts}
          </div>
          <div className="text-xs text-white/50 mt-1">Timeouts Called</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className={`text-3xl font-black ${metrics.peakDegradation > 100 ? 'text-[#ff4757]' : 'text-white'}`}>
            +{metrics.peakDegradation}%
          </div>
          <div className="text-xs text-white/50 mt-1">Peak Trade Time</div>
        </div>
        <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className={`text-3xl font-black ${metrics.totalPanicEvents >= 5 ? 'text-[#ffa502]' : 'text-white'}`}>
            {metrics.totalPanicEvents}
          </div>
          <div className="text-xs text-white/50 mt-1">Panic Utilities</div>
        </div>
      </div>

      {/* Coach Insights */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00a8e8]" />
          <span className="text-xs text-[#00a8e8] uppercase tracking-wider font-bold">
            Coach Insights {selectedGame !== 'all' ? `(Game ${selectedGame})` : '(Full Series)'}
          </span>
        </div>
        <div className="space-y-2">
          <AnimatePresence mode="wait">
            {insights.map((insight, i) => (
              <motion.div
                key={`${selectedGame}-${i}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: i * 0.1 }}
                className={`p-4 rounded-lg border-l-4 ${
                  insight.type === 'critical'
                    ? 'bg-[#ff4757]/10 border-[#ff4757]'
                    : insight.type === 'warning'
                    ? 'bg-[#ffa502]/10 border-[#ffa502]'
                    : 'bg-[#00a8e8]/10 border-[#00a8e8]'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">
                    {insight.type === 'critical' ? '🚨' : insight.type === 'warning' ? '⚠️' : 'ℹ️'}
                  </span>
                  <p className="text-sm text-white/90 leading-relaxed">{insight.text}</p>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Alert Timeline */}
      {completeSeriesData.allAlerts.length > 0 && (
        <div className="space-y-3">
          <div className="text-xs text-white/50 uppercase tracking-wider">
            Alert Timeline {selectedGame === 'all' ? '(All Games)' : `(Game ${selectedGame})`}
          </div>
          <div className="relative max-h-[200px] overflow-y-auto">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-white/10" />
            <div className="space-y-3">
              {(selectedGame === 'all' ? completeSeriesData.allAlerts :
                completeSeriesData.games.find(g => g.gameNumber === selectedGame)?.alerts || []
              ).slice(0, 8).map((alert, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + i * 0.05 }}
                  className="flex items-start gap-4 pl-2"
                >
                  <div className={`relative z-10 w-5 h-5 rounded-full flex items-center justify-center ${
                    alert.confidence >= 80
                      ? 'bg-[#ff4757] shadow-[0_0_10px_rgba(255,71,87,0.5)]'
                      : 'bg-[#ffa502]'
                  }`}>
                    <span className="text-[8px] font-bold text-white">{alert.confidence}</span>
                  </div>
                  <div className="flex-1 p-3 rounded-lg bg-white/5 border border-white/10">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-white">Round {alert.round}</span>
                      <span className="text-xs text-white/40">{alert.score}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {alert.reasons.slice(0, 3).map((reason, j) => (
                        <span key={j} className="text-[10px] px-2 py-0.5 rounded bg-[#ff4757]/20 text-[#ff4757]">
                          {reason}
                        </span>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Recommendation */}
      <div className="pt-4 border-t border-white/10">
        <div className="flex items-center gap-3 p-4 rounded-lg bg-gradient-to-r from-[#00a8e8]/10 to-transparent border border-[#00a8e8]/30">
          <div className="w-10 h-10 rounded-full bg-[#00a8e8]/20 flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-[#00a8e8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Assistant Coach Recommendation</div>
            <p className="text-sm text-white/60 mt-1">
              {metrics.totalAlerts > replayComplete.actual_timeouts
                ? `${metrics.totalAlerts - replayComplete.actual_timeouts} timeout opportunities missed across ${completeSeriesData.totalGames} game${completeSeriesData.totalGames > 1 ? 's' : ''}. Early intervention has 62% recovery rate vs 23% without.`
                : `Good timeout utilization this series. Continue monitoring trade time as primary collapse indicator.`
              }
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
