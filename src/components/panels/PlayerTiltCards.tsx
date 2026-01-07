'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';

interface PlayerWarning {
  player: string;
  issue: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

interface PlayerTiltCardsProps {
  warnings: string[]; // Format: "PLAYER: issue" or just "PLAYER"
  panicUtilityCount?: number;
  tradeTimeIncrease?: number;
}

export function PlayerTiltCards({
  warnings,
  panicUtilityCount = 0,
  tradeTimeIncrease = 0,
}: PlayerTiltCardsProps) {
  // Parse warnings into structured data
  const playerWarnings = useMemo((): PlayerWarning[] => {
    return warnings.map((warning) => {
      const parts = warning.split(':');
      const player = parts[0]?.trim() || warning;
      const issue = parts[1]?.trim() || 'Struggling';

      // Determine severity based on issue text
      let severity: PlayerWarning['severity'] = 'medium';
      if (issue.toLowerCase().includes('k/d 0.') || issue.toLowerCase().includes('0-')) {
        severity = 'critical';
      } else if (issue.toLowerCase().includes('death') || issue.toLowerCase().includes('isolated')) {
        severity = 'high';
      } else if (issue.toLowerCase().includes('assist')) {
        severity = 'low';
      }

      return { player, issue, severity };
    });
  }, [warnings]);

  if (playerWarnings.length === 0) return null;

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm text-white/50 uppercase tracking-wider font-medium">
          Players Under Pressure
        </h3>
        {panicUtilityCount > 3 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="px-2 py-0.5 bg-[#ffa502]/20 text-[#ffa502] text-[10px] font-bold rounded-full"
          >
            {panicUtilityCount} PANIC UTILS
          </motion.span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <AnimatePresence mode="popLayout">
          {playerWarnings.map((warning, i) => (
            <PlayerCard key={warning.player} warning={warning} index={i} />
          ))}
        </AnimatePresence>
      </div>

      {/* Team status summary */}
      {playerWarnings.length >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-white/10"
        >
          <div className="flex items-center gap-2 text-sm">
            <motion.div
              className="w-2 h-2 rounded-full bg-[#ff4757]"
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-white/60">
              {playerWarnings.length} player{playerWarnings.length > 1 ? 's' : ''} struggling - team cohesion at risk
            </span>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PlayerCard({ warning, index }: { warning: PlayerWarning; index: number }) {
  const severityConfig = {
    critical: {
      bg: 'bg-gradient-to-br from-[#ff4757]/30 to-[#ff4757]/10',
      border: 'border-[#ff4757]/50',
      text: 'text-[#ff4757]',
      glow: 'shadow-[0_0_20px_rgba(255,71,87,0.3)]',
      icon: 'TILT',
      pulse: true,
    },
    high: {
      bg: 'bg-gradient-to-br from-[#ff6b6b]/20 to-[#ffa502]/10',
      border: 'border-[#ffa502]/40',
      text: 'text-[#ffa502]',
      glow: 'shadow-[0_0_15px_rgba(255,165,2,0.2)]',
      icon: 'HEAT',
      pulse: true,
    },
    medium: {
      bg: 'bg-gradient-to-br from-[#ffa502]/15 to-transparent',
      border: 'border-[#ffa502]/30',
      text: 'text-[#ffa502]',
      glow: '',
      icon: 'WATCH',
      pulse: false,
    },
    low: {
      bg: 'bg-white/5',
      border: 'border-white/10',
      text: 'text-white/60',
      glow: '',
      icon: '',
      pulse: false,
    },
  };

  const config = severityConfig[warning.severity];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -20 }}
      transition={{ delay: index * 0.1, type: 'spring', stiffness: 300 }}
      className={`relative p-4 rounded-xl border ${config.bg} ${config.border} ${config.glow} overflow-hidden`}
    >
      {/* Background pulse for critical/high */}
      {config.pulse && (
        <motion.div
          className={`absolute inset-0 ${warning.severity === 'critical' ? 'bg-[#ff4757]/10' : 'bg-[#ffa502]/10'}`}
          animate={{ opacity: [0, 0.5, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
        />
      )}

      {/* Heat indicator bar */}
      <div className="absolute top-0 left-0 right-0 h-1">
        <motion.div
          className={`h-full ${warning.severity === 'critical' ? 'bg-[#ff4757]' : warning.severity === 'high' ? 'bg-[#ffa502]' : 'bg-transparent'}`}
          animate={config.pulse ? { opacity: [0.5, 1, 0.5] } : {}}
          transition={{ duration: 1, repeat: Infinity }}
        />
      </div>

      {/* Status badge */}
      {config.icon && (
        <div className={`absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-black ${
          warning.severity === 'critical'
            ? 'bg-[#ff4757] text-white'
            : 'bg-[#ffa502]/30 text-[#ffa502]'
        }`}>
          {config.icon}
        </div>
      )}

      {/* Player name */}
      <div className="relative">
        <motion.h4
          className={`text-xl font-bold ${config.text}`}
          animate={warning.severity === 'critical' ? { scale: [1, 1.02, 1] } : {}}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          {warning.player}
        </motion.h4>
        <p className="text-xs text-white/50 mt-1 line-clamp-2">
          {warning.issue}
        </p>
      </div>

      {/* Fire effect for critical */}
      {warning.severity === 'critical' && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-[#ff4757]/30 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </motion.div>
  );
}
