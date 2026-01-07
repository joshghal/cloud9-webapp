'use client';

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PanicUtilityEvent {
  player: string;
  ability: string;
  round: number;
  timeToDeath: number;
}

interface PanicUtilityTrackerProps {
  events: PanicUtilityEvent[];
  currentRound: number;
}

// Format ability names for display
function formatAbilityName(ability: string): string {
  return ability
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

export function PanicUtilityTracker({ events, currentRound }: PanicUtilityTrackerProps) {
  // Get stats by player
  const playerStats = useMemo(() => {
    const stats: Record<string, { count: number; abilities: Record<string, number> }> = {};

    events.forEach(event => {
      if (!stats[event.player]) {
        stats[event.player] = { count: 0, abilities: {} };
      }
      stats[event.player].count++;
      stats[event.player].abilities[event.ability] =
        (stats[event.player].abilities[event.ability] || 0) + 1;
    });

    return Object.entries(stats)
      .map(([player, data]) => ({
        player,
        count: data.count,
        topAbility: Object.entries(data.abilities)
          .sort((a, b) => b[1] - a[1])[0]?.[0] || null
      }))
      .sort((a, b) => b.count - a.count);
  }, [events]);

  // Get most wasted ability across all players
  const topWastedAbility = useMemo(() => {
    const abilities: Record<string, number> = {};
    events.forEach(event => {
      abilities[event.ability] = (abilities[event.ability] || 0) + 1;
    });

    const sorted = Object.entries(abilities).sort((a, b) => b[1] - a[1]);
    return sorted[0] || null;
  }, [events]);

  // Determine alert level
  const alertLevel = useMemo(() => {
    if (events.length === 0) return 'none';
    if (events.length >= 10) return 'critical';
    if (events.length >= 5) return 'warning';
    if (events.length >= 2) return 'caution';
    return 'low';
  }, [events]);

  const alertColors = {
    none: 'bg-[#1a2744]',
    low: 'bg-[#1a2744]',
    caution: 'bg-[#ffa502]/10 border-[#ffa502]/30',
    warning: 'bg-[#ff4757]/10 border-[#ff4757]/30',
    critical: 'bg-[#ff4757]/20 border-[#ff4757]/50',
  };

  return (
    <div className={`card border transition-all duration-300 ${alertColors[alertLevel]}`}>
      <h3 className="card-header flex items-center justify-between">
        <span className="flex items-center gap-2">
          Panic Utility
          <span
            className="text-[10px] text-[#a0aec0] cursor-help"
            title="Tracks abilities used within 2 seconds before death - a sign of tilting or forcing plays"
          >
            [?]
          </span>
        </span>
        {alertLevel !== 'none' && alertLevel !== 'low' && (
          <span className={`text-xs font-medium ${
            alertLevel === 'critical' ? 'text-[#ff4757] animate-pulse' :
            alertLevel === 'warning' ? 'text-[#ff4757]' : 'text-[#ffa502]'
          }`}>
            {alertLevel === 'critical' ? 'TILT DETECTED' :
             alertLevel === 'warning' ? 'HIGH ALERT' : 'WATCH'}
          </span>
        )}
      </h3>

      <div className="space-y-4">
        {/* Total Count */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <motion.span
              key={events.length}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`text-3xl font-bold ${
                events.length >= 10 ? 'text-[#ff4757]' :
                events.length >= 5 ? 'text-[#ffa502]' : 'text-white'
              }`}
            >
              {events.length}
            </motion.span>
            <span className="text-sm text-[#a0aec0]">wasted abilities</span>
          </div>

          {topWastedAbility && (
            <div className="text-right">
              <div className="text-xs text-[#a0aec0]">Top wasted</div>
              <div className="text-sm font-medium text-[#ffa502]">
                {formatAbilityName(topWastedAbility[0])} ({topWastedAbility[1]}x)
              </div>
            </div>
          )}
        </div>

        {/* Timeline Log - Detailed Event History */}
        {events.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-xs text-[#a0aec0] font-medium uppercase tracking-wider">Timeline Log</div>
              <div className="text-[10px] text-white/30">Ability → Death</div>
            </div>
            <div className="max-h-[180px] overflow-y-auto space-y-1.5 pr-1">
              <AnimatePresence mode="popLayout">
                {[...events].reverse().slice(0, 15).map((event, i) => (
                  <motion.div
                    key={`${event.round}-${event.player}-${event.ability}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: i * 0.05 }}
                    className={`flex items-center gap-2 p-2 rounded-lg border ${
                      event.timeToDeath < 1000
                        ? 'bg-[#ff4757]/20 border-[#ff4757]/40'
                        : event.timeToDeath < 1500
                        ? 'bg-[#ffa502]/10 border-[#ffa502]/30'
                        : 'bg-white/5 border-white/10'
                    }`}
                  >
                    {/* Round indicator */}
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
                      <span className="text-[10px] text-white/60">R{event.round}</span>
                    </div>

                    {/* Event details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-sm">
                        <span className="font-medium text-white truncate">{event.player}</span>
                        <span className="text-white/40">→</span>
                        <span className="text-[#ffa502] truncate">{formatAbilityName(event.ability)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-white/50">
                        <span>Used ability then died</span>
                      </div>
                    </div>

                    {/* Time to death - THE KEY INFO */}
                    <div className="flex-shrink-0 text-right">
                      <motion.div
                        className={`text-lg font-bold font-mono ${
                          event.timeToDeath < 1000
                            ? 'text-[#ff4757]'
                            : event.timeToDeath < 1500
                            ? 'text-[#ffa502]'
                            : 'text-white/70'
                        }`}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                      >
                        {(event.timeToDeath / 1000).toFixed(1)}s
                      </motion.div>
                      <div className="text-[9px] text-white/40 uppercase">to death</div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* Player Breakdown */}
        {playerStats.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs text-[#a0aec0] font-medium">By Player</div>
            {playerStats.slice(0, 5).map(({ player, count, topAbility }) => (
              <div key={player} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white">{player}</span>
                  {topAbility && (
                    <span className="text-[10px] text-[#a0aec0]">
                      ({formatAbilityName(topAbility)})
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${
                        count >= 5 ? 'bg-[#ff4757]' :
                        count >= 3 ? 'bg-[#ffa502]' : 'bg-[#00a8e8]'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (count / 10) * 100)}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                  <span className={`text-sm font-medium min-w-[2ch] text-right ${
                    count >= 5 ? 'text-[#ff4757]' :
                    count >= 3 ? 'text-[#ffa502]' : 'text-white'
                  }`}>
                    {count}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {events.length === 0 && (
          <div className="text-center py-4 text-[#a0aec0]">
            <div className="text-2xl mb-1">-</div>
            <div className="text-xs">No panic utility detected</div>
            <div className="text-[10px] mt-1 opacity-70">
              Tracks abilities used right before death
            </div>
          </div>
        )}

        {/* Insight */}
        {events.length >= 5 && (
          <div className="pt-2 border-t border-white/10 text-xs text-[#a0aec0]">
            <span className="text-[#ff4757] font-medium">Insight:</span>{' '}
            {playerStats[0]?.count >= 5
              ? `${playerStats[0].player} is forcing plays - consider timeout to reset mentality`
              : 'Multiple players showing tilt signs - team may need reset'
            }
          </div>
        )}
      </div>
    </div>
  );
}
