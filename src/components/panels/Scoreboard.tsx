'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface ScoreboardProps {
  c9Score: number;
  oppScore: number;
  round: number;
  currentMatch: string | null;
  winProbability?: number; // Optional - shown in MomentumMeter now
  momentum: string;
  momentumTrend: 'improving' | 'declining' | 'stable';
  warningLevel: 'none' | 'caution' | 'warning' | 'critical';
  mapName?: string;
}

export function Scoreboard({
  c9Score,
  oppScore,
  round,
  currentMatch,
  momentum,
  momentumTrend,
  warningLevel,
  mapName,
}: ScoreboardProps) {
  const trendIcons = {
    improving: '↗',
    declining: '↘',
    stable: '→',
  };

  const warningConfig = {
    none: {
      bg: 'bg-[#1a2744]/80',
      border: 'border-white/10',
      glow: '',
      pulse: false,
    },
    caution: {
      bg: 'bg-gradient-to-r from-[#1a2744] via-[#ffa502]/10 to-[#1a2744]',
      border: 'border-[#ffa502]/30',
      glow: '',
      pulse: false,
    },
    warning: {
      bg: 'bg-gradient-to-r from-[#1a2744] via-[#ff4757]/15 to-[#1a2744]',
      border: 'border-[#ff4757]/40',
      glow: 'shadow-[0_0_30px_rgba(255,71,87,0.15)]',
      pulse: true,
    },
    critical: {
      bg: 'bg-gradient-to-r from-[#ff4757]/20 via-[#ff4757]/30 to-[#ff4757]/20',
      border: 'border-[#ff4757]/60',
      glow: 'shadow-[0_0_50px_rgba(255,71,87,0.3)]',
      pulse: true,
    },
  };

  const config = warningConfig[warningLevel];

  return (
    <motion.div
      className={`relative overflow-hidden rounded-2xl backdrop-blur-xl ${config.bg} border ${config.border} ${config.glow} transition-all duration-500`}
      animate={config.pulse ? { scale: [1, 1.002, 1] } : {}}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {/* Top warning bar for critical state */}
      <AnimatePresence>
        {warningLevel === 'critical' && (
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ scaleX: 0 }}
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff4757] to-transparent origin-center"
          />
        )}
      </AnimatePresence>

      {/* Pulse background for warning states */}
      {config.pulse && (
        <motion.div
          className="absolute inset-0 bg-[#ff4757]/5"
          animate={{ opacity: [0, 0.3, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Main content */}
      <div className="relative grid grid-cols-3 items-center gap-6 px-8 py-6">
        {/* C9 Side */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-[#00a8e8]/20 flex items-center justify-center">
              <span className="text-xl font-black text-[#00a8e8]">C9</span>
            </div>
            <div className="text-left">
              <h3 className="text-xl font-bold text-[#00a8e8]">Cloud9</h3>
              <p className="text-xs text-white/40">{mapName || 'VALORANT'}</p>
            </div>
          </div>
        </div>

        {/* Score Display */}
        <div className="text-center">
          <motion.div
            className="text-6xl font-black tracking-wider"
            key={`${c9Score}-${oppScore}`}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <motion.span
              className="text-[#00a8e8]"
              key={`c9-${c9Score}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {c9Score}
            </motion.span>
            <span className="text-white/30 mx-3">:</span>
            <motion.span
              className="text-[#ff4757]"
              key={`opp-${oppScore}`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              {oppScore}
            </motion.span>
          </motion.div>

          <div className="flex items-center justify-center gap-4 mt-3">
            <span className="px-3 py-1 bg-white/5 rounded-full text-xs text-white/60">
              Round {round}
            </span>
            <motion.span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                momentumTrend === 'improving'
                  ? 'bg-[#2ed573]/20 text-[#2ed573]'
                  : momentumTrend === 'declining'
                  ? 'bg-[#ff4757]/20 text-[#ff4757]'
                  : 'bg-white/10 text-white/60'
              }`}
              animate={momentumTrend === 'declining' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {momentum} {trendIcons[momentumTrend]}
            </motion.span>
          </div>
        </div>

        {/* Opponent Side */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="text-right">
              <h3 className="text-xl font-bold text-[#ff4757]">
                {currentMatch?.replace('C9 vs ', '') || 'Opponent'}
              </h3>
              <AnimatePresence mode="wait">
                <motion.p
                  key={warningLevel}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className={`text-xs ${
                    warningLevel === 'critical'
                      ? 'text-[#ff4757] font-bold'
                      : warningLevel === 'warning'
                      ? 'text-[#ffa502]'
                      : 'text-white/40'
                  }`}
                >
                  {warningLevel === 'critical' && 'TIMEOUT ZONE'}
                  {warningLevel === 'warning' && 'High Alert'}
                  {warningLevel === 'caution' && 'Watch'}
                  {warningLevel === 'none' && 'Live'}
                </motion.p>
              </AnimatePresence>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#ff4757]/20 flex items-center justify-center">
              <span className="text-xl font-black text-[#ff4757]">OP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom warning strip */}
      <AnimatePresence>
        {warningLevel !== 'none' && (
          <motion.div
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 1 }}
            exit={{ scaleX: 0, opacity: 0 }}
            className={`h-0.5 ${
              warningLevel === 'critical'
                ? 'bg-[#ff4757]'
                : warningLevel === 'warning'
                ? 'bg-[#ff6b6b]'
                : 'bg-[#ffa502]'
            }`}
            style={{ originX: 0.5 }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
