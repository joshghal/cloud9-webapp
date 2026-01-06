'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { TimeoutAlert as TimeoutAlertType } from '@/types';

interface TimeoutAlertProps {
  alert: TimeoutAlertType | null;
  onDismiss: () => void;
}

export function TimeoutAlert({ alert, onDismiss }: TimeoutAlertProps) {
  if (!alert) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="alert-card active"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-[#ff4757] animate-pulse-fast" />
            <h2 className="text-xl font-bold text-[#ff4757]">TIMEOUT RECOMMENDED</h2>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-2xl font-bold text-white">{alert.confidence}%</span>
            <button
              onClick={onDismiss}
              className="text-[#a0aec0] hover:text-white transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Score and Round */}
        <div className="flex items-center gap-6 mb-4 text-sm">
          <span className="text-[#a0aec0]">Round {alert.round}</span>
          <span className="text-white font-mono text-lg">{alert.score}</span>
          <span className="text-[#ff4757]">{alert.consecutive_losses} loss streak</span>
        </div>

        {/* Reasons */}
        <div className="mb-4">
          <h4 className="text-sm text-[#a0aec0] mb-2">SIGNALS:</h4>
          <div className="flex flex-wrap gap-2">
            {alert.reasons.map((reason, i) => (
              <span
                key={i}
                className="px-3 py-1 bg-[#ff4757]/20 text-[#ff4757] rounded-full text-sm"
              >
                {reason}
              </span>
            ))}
          </div>
        </div>

        {/* Player Warnings */}
        {alert.player_warnings.length > 0 && (
          <div className="mb-4">
            <h4 className="text-sm text-[#a0aec0] mb-2">STRUGGLING:</h4>
            <div className="flex flex-wrap gap-2">
              {alert.player_warnings.map((warning, i) => (
                <span
                  key={i}
                  className="px-3 py-1 bg-[#ffa502]/20 text-[#ffa502] rounded-full text-sm font-mono"
                >
                  {warning}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* AI Insight */}
        {alert.ai_insight?.success && (
          <div className="mt-4 pt-4 border-t border-white/10">
            <h4 className="text-sm text-[#00a8e8] mb-2 flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm-1-5h2v2H9v-2zm0-6h2v4H9V5z" />
              </svg>
              AI TACTICAL INSIGHT
            </h4>
            <p className="text-white mb-3">{alert.ai_insight.recommendation}</p>

            {alert.ai_insight.talking_points.length > 0 && (
              <div className="bg-black/20 rounded-lg p-3">
                <h5 className="text-xs text-[#a0aec0] mb-2">TALKING POINTS:</h5>
                <ul className="space-y-1">
                  {alert.ai_insight.talking_points.map((point, i) => (
                    <li key={i} className="text-sm text-[#a0aec0] flex items-start gap-2">
                      <span className="text-[#00a8e8]">•</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 mt-6">
          <button className="btn btn-danger flex-1 flex items-center justify-center gap-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            CALL TIMEOUT
          </button>
          <button
            onClick={onDismiss}
            className="btn bg-white/10 text-white hover:bg-white/20 flex-1"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
