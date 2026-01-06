'use client';

import { motion } from 'framer-motion';

interface ScoreboardProps {
  c9Score: number;
  oppScore: number;
  round: number;
  currentMatch: string | null;
  winProbability: number;
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
  winProbability,
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

  const trendColors = {
    improving: 'text-[#2ed573]',
    declining: 'text-[#ff4757]',
    stable: 'text-[#a0aec0]',
  };

  const warningColors = {
    none: 'bg-[#1a2744]',
    caution: 'bg-[#ffa502]/10 border-[#ffa502]/30',
    warning: 'bg-[#ff4757]/10 border-[#ff4757]/30',
    critical: 'bg-[#ff4757]/20 border-[#ff4757]/50 animate-alert-glow',
  };

  return (
    <div className={`scoreboard ${warningColors[warningLevel]} border transition-all duration-300`}>
      {/* C9 Side */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-[#00a8e8]">Cloud9</h3>
        <p className="text-sm text-[#a0aec0]">{mapName || 'VALORANT'}</p>
      </div>

      {/* Score Display */}
      <div className="text-center">
        <motion.div
          className="score-display"
          key={`${c9Score}-${oppScore}`}
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        >
          <span className="text-[#00a8e8]">{c9Score}</span>
          <span className="text-[#a0aec0] mx-2">-</span>
          <span className="text-[#ff4757]">{oppScore}</span>
        </motion.div>

        <div className="flex items-center justify-center gap-4 mt-2">
          <span className="text-sm text-[#a0aec0]">Round {round}</span>
          <span className="text-sm text-[#a0aec0]">|</span>
          <span className={`text-sm font-medium ${trendColors[momentumTrend]}`}>
            {momentum} {trendIcons[momentumTrend]}
          </span>
        </div>

        {/* Win Probability Bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-[#a0aec0] mb-1">
            <span>C9</span>
            <span>{winProbability}%</span>
            <span>OPP</span>
          </div>
          <div className="h-2 bg-[#ff4757]/30 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#00a8e8] rounded-full"
              initial={{ width: '50%' }}
              animate={{ width: `${winProbability}%` }}
              transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            />
          </div>
        </div>
      </div>

      {/* Opponent Side */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-[#ff4757]">
          {currentMatch?.replace('C9 vs ', '') || 'Opponent'}
        </h3>
        <p className="text-sm text-[#a0aec0]">
          {warningLevel === 'critical' && '⚠️ TIMEOUT ZONE'}
          {warningLevel === 'warning' && '⚡ High Alert'}
          {warningLevel === 'caution' && '👀 Watch'}
          {warningLevel === 'none' && 'Live'}
        </p>
      </div>
    </div>
  );
}
