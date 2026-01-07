'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface SignalEvent {
  round: number;
  type: 'trade_time' | 'loss_streak' | 'tilt' | 'untradeable' | 'panic_utility' | 'probability_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
}

interface CollapseCascadeProps {
  currentRound: number;
  consecutiveLosses: number;
  tradeTimeIncrease: number;
  winProbability: number;
  tiltDiagnosis?: string;
  untradeableCount?: number;
  panicUtilityCount?: number;
}

export function CollapseCascade({
  currentRound,
  consecutiveLosses,
  tradeTimeIncrease,
  winProbability,
  tiltDiagnosis,
  untradeableCount = 0,
  panicUtilityCount = 0,
}: CollapseCascadeProps) {
  // Build cascade events based on current data
  const cascadeEvents = useMemo(() => {
    const events: SignalEvent[] = [];

    // Add events based on thresholds
    if (consecutiveLosses >= 2) {
      events.push({
        round: currentRound - consecutiveLosses + 1,
        type: 'loss_streak',
        severity: consecutiveLosses >= 4 ? 'critical' : consecutiveLosses >= 3 ? 'high' : 'medium',
        description: `${consecutiveLosses} consecutive losses`,
      });
    }

    if (tradeTimeIncrease > 50) {
      events.push({
        round: currentRound,
        type: 'trade_time',
        severity: tradeTimeIncrease > 150 ? 'critical' : tradeTimeIncrease > 100 ? 'high' : 'medium',
        description: `Trade time +${tradeTimeIncrease}%`,
      });
    }

    if (tiltDiagnosis === 'tilt') {
      events.push({
        round: currentRound,
        type: 'tilt',
        severity: 'critical',
        description: 'TILT DETECTED',
      });
    }

    if (winProbability < 40) {
      events.push({
        round: currentRound,
        type: 'probability_drop',
        severity: winProbability < 25 ? 'critical' : 'high',
        description: `Win probability ${winProbability}%`,
      });
    }

    if (untradeableCount >= 2) {
      events.push({
        round: currentRound,
        type: 'untradeable',
        severity: untradeableCount >= 3 ? 'high' : 'medium',
        description: `${untradeableCount} untradeable deaths`,
      });
    }

    if (panicUtilityCount >= 3) {
      events.push({
        round: currentRound,
        type: 'panic_utility',
        severity: panicUtilityCount >= 5 ? 'high' : 'medium',
        description: `${panicUtilityCount} panic utilities`,
      });
    }

    // Sort by severity (most severe first)
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return events.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
  }, [currentRound, consecutiveLosses, tradeTimeIncrease, winProbability, tiltDiagnosis, untradeableCount, panicUtilityCount]);

  // Count critical signals
  const criticalCount = cascadeEvents.filter(e => e.severity === 'critical' || e.severity === 'high').length;
  const isCollapsing = criticalCount >= 2;

  if (cascadeEvents.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`glass-card p-5 relative overflow-hidden ${isCollapsing ? 'border-[#ff4757]/50' : ''}`}
    >
      {/* Collapse warning background pulse */}
      {isCollapsing && (
        <motion.div
          className="absolute inset-0 bg-[#ff4757]/5"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <div className="flex items-center gap-3">
          <h3 className="text-sm text-white/50 uppercase tracking-wider font-medium">
            Signal Cascade
          </h3>
          {isCollapsing && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-0.5 bg-[#ff4757]/20 text-[#ff4757] text-[10px] font-bold rounded-full"
            >
              COMPOUND COLLAPSE
            </motion.span>
          )}
        </div>
        <span className="text-xs text-white/30">{cascadeEvents.length} signals active</span>
      </div>

      {/* Timeline visualization */}
      <div className="relative">
        {/* Connecting line */}
        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-white/10 via-[#ff4757]/50 to-[#ff4757]" />

        {/* Events */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {cascadeEvents.map((event, i) => (
              <CascadeEvent key={`${event.type}-${i}`} event={event} index={i} />
            ))}
          </AnimatePresence>
        </div>

        {/* Cascade result */}
        {isCollapsing && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-4 ml-8 p-3 rounded-lg bg-gradient-to-r from-[#ff4757]/20 to-transparent border-l-2 border-[#ff4757]"
          >
            <div className="text-sm font-bold text-[#ff4757]">INTERVENTION RECOMMENDED</div>
            <div className="text-xs text-white/60 mt-1">
              Multiple signals indicate team collapse in progress
            </div>
          </motion.div>
        )}
      </div>

      {/* Bottom glow for collapse state */}
      {isCollapsing && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-[#ff4757]"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}

function CascadeEvent({ event, index }: { event: SignalEvent; index: number }) {
  const severityConfig = {
    critical: {
      dotColor: 'bg-[#ff4757]',
      dotGlow: 'shadow-[0_0_10px_rgba(255,71,87,0.6)]',
      textColor: 'text-[#ff4757]',
      bgColor: 'bg-[#ff4757]/10',
      borderColor: 'border-[#ff4757]/30',
      pulse: true,
    },
    high: {
      dotColor: 'bg-[#ff6b6b]',
      dotGlow: 'shadow-[0_0_8px_rgba(255,107,107,0.4)]',
      textColor: 'text-[#ffa502]',
      bgColor: 'bg-[#ffa502]/10',
      borderColor: 'border-[#ffa502]/30',
      pulse: true,
    },
    medium: {
      dotColor: 'bg-[#ffa502]',
      dotGlow: '',
      textColor: 'text-[#ffa502]/80',
      bgColor: 'bg-white/5',
      borderColor: 'border-white/10',
      pulse: false,
    },
    low: {
      dotColor: 'bg-white/40',
      dotGlow: '',
      textColor: 'text-white/50',
      bgColor: 'bg-white/5',
      borderColor: 'border-white/10',
      pulse: false,
    },
  };

  const config = severityConfig[event.severity];

  const typeIcons: Record<string, string> = {
    trade_time: '⏱',
    loss_streak: '📉',
    tilt: '🔥',
    probability_drop: '⚠️',
    untradeable: '💀',
    panic_utility: '⚡',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ delay: index * 0.1 }}
      className="relative flex items-start gap-4 pl-2"
    >
      {/* Timeline dot */}
      <motion.div
        className={`relative z-10 w-3 h-3 rounded-full ${config.dotColor} ${config.dotGlow}`}
        animate={config.pulse ? { scale: [1, 1.3, 1] } : {}}
        transition={{ duration: 1, repeat: Infinity }}
      >
        {/* Pulse ring */}
        {config.pulse && (
          <motion.div
            className={`absolute inset-0 rounded-full ${config.dotColor}`}
            animate={{ scale: [1, 2], opacity: [0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </motion.div>

      {/* Event card */}
      <div className={`flex-1 p-2 rounded-lg ${config.bgColor} border ${config.borderColor}`}>
        <div className="flex items-center gap-2">
          <span className="text-base">{typeIcons[event.type] || '•'}</span>
          <span className={`text-sm font-medium ${config.textColor}`}>
            {event.description}
          </span>
        </div>
        {event.severity === 'critical' && (
          <div className="mt-1 text-[10px] text-white/40">
            Critical signal - immediate attention required
          </div>
        )}
      </div>
    </motion.div>
  );
}
