'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useMemo, useEffect, useState } from 'react';

interface MomentumMeterProps {
  winProbability: number;
  previousProbability?: number;
  momentum: string;
  momentumTrend: 'improving' | 'declining' | 'stable';
  tradeTimeIncrease?: number;
  consecutiveLosses?: number;
  round: number;
}

export function MomentumMeter({
  winProbability,
  previousProbability = 50,
  momentum,
  momentumTrend,
  tradeTimeIncrease = 0,
  consecutiveLosses = 0,
  round,
}: MomentumMeterProps) {
  const [showShift, setShowShift] = useState(false);
  const probabilityChange = winProbability - previousProbability;

  // Show shift animation when probability changes significantly
  useEffect(() => {
    if (Math.abs(probabilityChange) >= 5) {
      setShowShift(true);
      const timer = setTimeout(() => setShowShift(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [winProbability, probabilityChange]);

  // Determine danger level
  const dangerLevel = useMemo(() => {
    if (winProbability < 25) return 'critical';
    if (winProbability < 40) return 'danger';
    if (winProbability < 50) return 'caution';
    return 'safe';
  }, [winProbability]);

  // Calculate collapse signals
  const collapseSignals = useMemo(() => {
    const signals: string[] = [];
    if (winProbability < 40) signals.push('Low win probability');
    if (tradeTimeIncrease > 100) signals.push(`Trade time +${tradeTimeIncrease}%`);
    if (consecutiveLosses >= 3) signals.push(`${consecutiveLosses} loss streak`);
    if (momentumTrend === 'declining') signals.push('Momentum fading');
    return signals;
  }, [winProbability, tradeTimeIncrease, consecutiveLosses, momentumTrend]);

  const isCollapsing = collapseSignals.length >= 2;

  // Colors based on danger level
  const colors = useMemo(() => {
    switch (dangerLevel) {
      case 'critical':
        return {
          main: '#ff4757',
          glow: 'rgba(255,71,87,0.5)',
          gradient: 'from-[#ff4757] to-[#ff6b6b]',
          bg: 'rgba(255,71,87,0.1)',
        };
      case 'danger':
        return {
          main: '#ff6b6b',
          glow: 'rgba(255,107,107,0.4)',
          gradient: 'from-[#ff6b6b] to-[#ffa502]',
          bg: 'rgba(255,107,107,0.1)',
        };
      case 'caution':
        return {
          main: '#ffa502',
          glow: 'rgba(255,165,2,0.3)',
          gradient: 'from-[#ffa502] to-[#ffbe4d]',
          bg: 'rgba(255,165,2,0.1)',
        };
      default:
        return {
          main: '#00a8e8',
          glow: 'rgba(0,168,232,0.3)',
          gradient: 'from-[#00a8e8] to-[#00d4ff]',
          bg: 'rgba(0,168,232,0.1)',
        };
    }
  }, [dangerLevel]);

  return (
    <div className={`glass-card p-6 relative overflow-hidden ${isCollapsing ? 'animate-alert-glow' : ''}`}>
      {/* Background pulse for danger */}
      {dangerLevel !== 'safe' && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{ backgroundColor: colors.bg }}
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-4 relative">
        <h3 className="text-sm text-white/50 uppercase tracking-wider font-medium">Live Momentum</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">Round {round}</span>
          {isCollapsing && (
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="px-2 py-0.5 bg-[#ff4757]/20 text-[#ff4757] text-[10px] font-bold rounded-full"
            >
              COLLAPSE WARNING
            </motion.span>
          )}
        </div>
      </div>

      {/* Main probability display */}
      <div className="flex items-center gap-6 relative">
        {/* Big number with glow */}
        <div className="relative">
          {/* Glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full blur-2xl"
            style={{ backgroundColor: colors.glow }}
            animate={dangerLevel !== 'safe' ? { scale: [1, 1.3, 1], opacity: [0.5, 0.8, 0.5] } : {}}
            transition={{ duration: 2, repeat: Infinity }}
          />

          <motion.div
            className={`relative text-7xl font-black bg-gradient-to-br ${colors.gradient} bg-clip-text text-transparent`}
            key={winProbability}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            {winProbability}
            <span className="text-4xl">%</span>
          </motion.div>
        </div>

        {/* Momentum shift indicator */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {showShift && probabilityChange !== 0 && (
              <motion.div
                initial={{ x: probabilityChange > 0 ? -20 : 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: probabilityChange > 0 ? 20 : -20, opacity: 0 }}
                className={`text-3xl font-bold ${
                  probabilityChange > 0 ? 'text-[#2ed573]' : 'text-[#ff4757]'
                }`}
              >
                {probabilityChange > 0 ? '+' : ''}{probabilityChange.toFixed(0)}%
              </motion.div>
            )}
          </AnimatePresence>

          {/* Momentum direction */}
          <div className="flex items-center gap-2 mt-2">
            <motion.div
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                momentumTrend === 'improving'
                  ? 'bg-[#2ed573]/20 text-[#2ed573]'
                  : momentumTrend === 'declining'
                  ? 'bg-[#ff4757]/20 text-[#ff4757]'
                  : 'bg-white/10 text-white/60'
              }`}
              animate={momentumTrend === 'declining' ? { scale: [1, 1.05, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {momentumTrend === 'improving' && (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                  </svg>
                  RISING
                </>
              )}
              {momentumTrend === 'declining' && (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                  FALLING
                </>
              )}
              {momentumTrend === 'stable' && (
                <>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
                  </svg>
                  STABLE
                </>
              )}
            </motion.div>

            <span className="text-sm text-white/40">{momentum}</span>
          </div>
        </div>

        {/* Win probability gauge */}
        <div className="w-32 h-32 relative">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Background arc */}
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <motion.circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke={colors.main}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={`${(winProbability / 100) * 283} 283`}
              initial={{ strokeDasharray: '0 283' }}
              animate={{ strokeDasharray: `${(winProbability / 100) * 283} 283` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              style={{
                filter: `drop-shadow(0 0 8px ${colors.main})`,
              }}
            />
          </svg>
          {/* Center label */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs text-white/40 text-center">
              WIN<br/>PROB
            </span>
          </div>
        </div>
      </div>

      {/* Collapse signals */}
      {collapseSignals.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-4 border-t border-white/10"
        >
          <div className="text-[10px] text-white/40 uppercase tracking-wider mb-2">Active Signals</div>
          <div className="flex flex-wrap gap-2">
            {collapseSignals.map((signal, i) => (
              <motion.span
                key={signal}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`px-2 py-1 rounded text-xs font-medium ${
                  i === 0 && dangerLevel === 'critical'
                    ? 'bg-[#ff4757]/30 text-[#ff4757] border border-[#ff4757]/40'
                    : 'bg-white/5 text-white/60'
                }`}
              >
                {signal}
              </motion.span>
            ))}
          </div>
        </motion.div>
      )}

      {/* Danger zone indicator */}
      {winProbability < 40 && (
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1"
          style={{ backgroundColor: colors.main }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1, repeat: Infinity }}
        />
      )}
    </div>
  );
}
