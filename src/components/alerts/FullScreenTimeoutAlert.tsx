'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import type { TimeoutAlert as TimeoutAlertType } from '@/types';

interface FullScreenTimeoutAlertProps {
  alert: TimeoutAlertType | null;
  onDismiss: () => void;
  winProbability?: number;
  tradeTimeIncrease?: number;
}

export function FullScreenTimeoutAlert({
  alert,
  onDismiss,
  winProbability = 50,
  tradeTimeIncrease = 0
}: FullScreenTimeoutAlertProps) {
  const [showTalkingPoints, setShowTalkingPoints] = useState(false);
  const [visiblePoints, setVisiblePoints] = useState<number[]>([]);

  // Animate talking points appearing one by one
  useEffect(() => {
    if (!alert?.ai_insight?.talking_points) return;

    setShowTalkingPoints(false);
    setVisiblePoints([]);

    const timer1 = setTimeout(() => setShowTalkingPoints(true), 800);

    const points = alert.ai_insight.talking_points;
    points.forEach((_, i) => {
      setTimeout(() => {
        setVisiblePoints(prev => [...prev, i]);
      }, 1200 + (i * 400));
    });

    return () => clearTimeout(timer1);
  }, [alert]);

  if (!alert) return null;

  const confidence = alert.confidence;
  const isHighConfidence = confidence >= 80;
  const isMediumConfidence = confidence >= 60;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backdropFilter: 'blur(8px)' }}
      >
        {/* Pulsing background overlay */}
        <motion.div
          className="absolute inset-0 bg-black/80"
          animate={{
            backgroundColor: ['rgba(0,0,0,0.8)', 'rgba(255,71,87,0.15)', 'rgba(0,0,0,0.8)'],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Dramatic edge glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-[3px] border-[#ff4757] animate-alert-border" />
          <motion.div
            className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff4757] to-transparent"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
          <motion.div
            className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#ff4757] to-transparent"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, delay: 0.75 }}
          />
        </div>

        {/* Main content container */}
        <motion.div
          initial={{ scale: 0.9, y: 30 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 30 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className="relative w-full max-w-5xl mx-4 grid grid-cols-12 gap-6"
        >
          {/* Left side - Big confidence number and signals */}
          <div className="col-span-5 space-y-6">
            {/* Giant confidence display */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="relative inline-block"
              >
                {/* Glow ring */}
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${isHighConfidence ? 'rgba(255,71,87,0.4)' : 'rgba(255,165,2,0.3)'} 0%, transparent 70%)`,
                    transform: 'scale(2)',
                  }}
                  animate={{
                    scale: [2, 2.3, 2],
                    opacity: [0.5, 0.8, 0.5]
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                />

                <div className={`relative w-40 h-40 rounded-full flex items-center justify-center ${
                  isHighConfidence
                    ? 'bg-gradient-to-br from-[#ff4757] to-[#ff6b6b]'
                    : 'bg-gradient-to-br from-[#ffa502] to-[#ffbe4d]'
                } shadow-2xl`}>
                  <div className="text-center">
                    <motion.span
                      className="text-6xl font-black text-white"
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      {confidence}
                    </motion.span>
                    <span className="text-2xl font-bold text-white/80">%</span>
                  </div>
                </div>
              </motion.div>

              <motion.h1
                className="mt-6 text-3xl font-black text-[#ff4757] tracking-wider"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                TIMEOUT RECOMMENDED
              </motion.h1>

              <motion.p
                className="text-lg text-white/60 mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                Round {alert.round} • {alert.score}
              </motion.p>
            </div>

            {/* Win Probability Shift */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="glass-card p-4"
            >
              <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Win Probability</div>
              <div className="flex items-center gap-4">
                <div className={`text-4xl font-black ${winProbability < 40 ? 'text-[#ff4757]' : winProbability < 60 ? 'text-[#ffa502]' : 'text-[#2ed573]'}`}>
                  {winProbability}%
                </div>
                {winProbability < 40 && (
                  <motion.span
                    className="px-3 py-1 bg-[#ff4757]/20 text-[#ff4757] rounded-full text-sm font-bold"
                    animate={{ opacity: [1, 0.5, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    DANGER ZONE
                  </motion.span>
                )}
              </div>

              {/* Probability bar */}
              <div className="mt-3 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${winProbability}%` }}
                  transition={{ duration: 1, delay: 0.8 }}
                  className={`h-full rounded-full ${
                    winProbability < 40 ? 'bg-[#ff4757]' : winProbability < 60 ? 'bg-[#ffa502]' : 'bg-[#2ed573]'
                  }`}
                />
              </div>
            </motion.div>

            {/* Trade Time Spike */}
            {tradeTimeIncrease > 100 && (
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="glass-card p-4"
              >
                <div className="text-xs text-white/50 uppercase tracking-wider mb-2">Trade Time</div>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#ff4757]">+{tradeTimeIncrease}%</span>
                  <span className="text-white/40">from baseline</span>
                </div>
                <p className="text-sm text-white/60 mt-1">Team is fragmenting</p>
              </motion.div>
            )}

            {/* Signals Grid */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              className="glass-card p-4"
            >
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Active Signals</div>
              <div className="flex flex-wrap gap-2">
                {alert.reasons.map((reason, i) => (
                  <motion.span
                    key={i}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.9 + (i * 0.1) }}
                    className="px-3 py-1.5 bg-[#ff4757]/20 border border-[#ff4757]/40 text-[#ff4757] rounded-lg text-sm font-medium"
                  >
                    {reason}
                  </motion.span>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Right side - AI Insight and Talking Points */}
          <div className="col-span-7 space-y-6">
            {/* Player Warnings */}
            {alert.player_warnings.length > 0 && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
                className="glass-card p-5"
              >
                <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Players Under Pressure</div>
                <div className="grid grid-cols-3 gap-3">
                  {alert.player_warnings.map((warning, i) => {
                    const parts = warning.split(':');
                    const playerName = parts[0]?.trim() || warning;
                    const issue = parts[1]?.trim() || '';

                    return (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.7 + (i * 0.1) }}
                        className="relative p-3 rounded-lg bg-gradient-to-br from-[#ffa502]/20 to-[#ff4757]/20 border border-[#ffa502]/30"
                      >
                        {/* Heat indicator */}
                        <motion.div
                          className="absolute inset-0 rounded-lg bg-[#ff4757]/10"
                          animate={{ opacity: [0, 0.3, 0] }}
                          transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                        />
                        <div className="relative">
                          <div className="font-bold text-white text-lg">{playerName}</div>
                          {issue && <div className="text-xs text-[#ffa502] mt-0.5">{issue}</div>}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* AI Tactical Insight */}
            {alert.ai_insight?.success && (
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="glass-card p-5 relative overflow-hidden"
              >
                {/* AI accent line */}
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#00a8e8] via-[#00d4ff] to-[#00a8e8]" />

                <div className="flex items-center gap-2 mb-3">
                  <motion.div
                    className="w-2 h-2 rounded-full bg-[#00a8e8]"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                  <span className="text-xs text-[#00a8e8] uppercase tracking-wider font-bold">AI Tactical Insight</span>
                </div>

                <p className="text-white text-lg leading-relaxed mb-4">
                  {alert.ai_insight.recommendation}
                </p>

                {/* Talking Points - Animated */}
                {showTalkingPoints && alert.ai_insight.talking_points.length > 0 && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-white/10">
                    <div className="text-xs text-white/50 uppercase tracking-wider">
                      Timeout Talking Points
                    </div>
                    <div className="space-y-2">
                      {alert.ai_insight.talking_points.map((point, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: 20 }}
                          animate={visiblePoints.includes(i) ? { opacity: 1, x: 0 } : { opacity: 0, x: 20 }}
                          transition={{ type: 'spring', stiffness: 200 }}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            visiblePoints.includes(i) ? 'bg-white/5' : ''
                          }`}
                        >
                          <motion.div
                            className="w-6 h-6 rounded-full bg-[#00a8e8]/20 flex items-center justify-center text-[#00a8e8] font-bold text-sm flex-shrink-0"
                            animate={visiblePoints.includes(i) ? { scale: [1, 1.2, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {i + 1}
                          </motion.div>
                          <span className="text-white/90">{point}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Historical Recovery Rate */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 }}
              className="glass-card p-5"
            >
              <div className="text-xs text-white/50 uppercase tracking-wider mb-3">Historical Recovery</div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 rounded-lg bg-[#2ed573]/10 border border-[#2ed573]/30">
                  <div className="text-3xl font-black text-[#2ed573]">62%</div>
                  <div className="text-xs text-white/50 mt-1">WITH timeout</div>
                </div>
                <div className="text-center p-3 rounded-lg bg-[#ff4757]/10 border border-[#ff4757]/30">
                  <div className="text-3xl font-black text-[#ff4757]">23%</div>
                  <div className="text-xs text-white/50 mt-1">WITHOUT timeout</div>
                </div>
              </div>
            </motion.div>

            {/* Action Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="flex gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-4 bg-gradient-to-r from-[#ff4757] to-[#ff6b6b] text-white font-bold text-lg rounded-xl shadow-lg shadow-[#ff4757]/30 flex items-center justify-center gap-3"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                CALL TIMEOUT
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={onDismiss}
                className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-bold text-lg rounded-xl border border-white/20"
              >
                Dismiss
              </motion.button>
            </motion.div>
          </div>
        </motion.div>

        {/* Close button in corner */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onDismiss}
          className="absolute top-6 right-6 p-2 text-white/50 hover:text-white transition-colors"
        >
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </motion.button>
      </motion.div>
    </AnimatePresence>
  );
}
