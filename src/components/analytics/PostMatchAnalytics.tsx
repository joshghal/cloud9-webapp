'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RoundAutopsy from './RoundAutopsy';
import GhostTimeline from './GhostTimeline';
import TurningPoints from './TurningPoints';
import PlayerDNA from './PlayerDNA';

type AnalyticsTab = 'autopsy' | 'ghosts' | 'turning-points' | 'player-dna';

interface TabConfig {
  id: AnalyticsTab;
  label: string;
  icon: string;
  description: string;
}

const TABS: TabConfig[] = [
  { id: 'autopsy', label: 'Round Autopsy', icon: '🔬', description: 'Per-round mistake analysis' },
  { id: 'ghosts', label: 'Ghost Timeline', icon: '👻', description: 'Positioning recommendations' },
  { id: 'turning-points', label: 'Turning Points', icon: '🎯', description: 'Critical momentum shifts' },
  { id: 'player-dna', label: 'Player DNA', icon: '🧬', description: 'Individual performance' },
];

interface PostMatchAnalyticsProps {
  matchFile: string;
  matchName?: string;
  finalScore?: string;
  totalRounds?: number;
  initialTab?: AnalyticsTab;
  onClose?: () => void;
}

export default function PostMatchAnalytics({
  matchFile,
  matchName,
  finalScore,
  totalRounds,
  initialTab = 'autopsy',
  onClose,
}: PostMatchAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>(initialTab);
  const [selectedRound, setSelectedRound] = useState<number | null>(null);
  const [selectedPlayer, setSelectedPlayer] = useState<string>('OXY');

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-gradient-to-r from-[#00a8e8]/10 to-transparent">
        <div className="flex items-center gap-3">
          <span className="text-xl">📊</span>
          <div>
            <h2 className="text-lg font-bold text-white">Post-Match Analysis</h2>
            <div className="flex items-center gap-2 text-xs text-white/50">
              {matchName && <span>{matchName}</span>}
              {finalScore && (
                <>
                  <span>•</span>
                  <span className="font-medium text-white/70">{finalScore}</span>
                </>
              )}
              {totalRounds && (
                <>
                  <span>•</span>
                  <span>{totalRounds} rounds</span>
                </>
              )}
            </div>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 px-4 py-2 border-b border-white/10 overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-all
              ${activeTab === tab.id
                ? 'bg-[#00a8e8]/20 text-[#00a8e8]'
                : 'text-white/60 hover:text-white hover:bg-white/5'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {activeTab === 'autopsy' && (
              <RoundAutopsy
                matchFile={matchFile}
                onRoundSelect={setSelectedRound}
              />
            )}
            {activeTab === 'ghosts' && (
              <GhostTimeline
                matchFile={matchFile}
              />
            )}
            {activeTab === 'turning-points' && (
              <TurningPoints
                matchFile={matchFile}
              />
            )}
            {activeTab === 'player-dna' && (
              <PlayerDNA
                matchFile={matchFile}
                playerName={selectedPlayer}
                onPlayerChange={setSelectedPlayer}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Quick Stats Footer */}
      <div className="px-4 py-2 border-t border-white/10 bg-white/5">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span className="text-white/40">Quick Actions:</span>
            <button
              onClick={() => setActiveTab('autopsy')}
              className="text-white/60 hover:text-[#00a8e8] transition-colors"
            >
              View Mistakes
            </button>
            <button
              onClick={() => setActiveTab('turning-points')}
              className="text-white/60 hover:text-[#00a8e8] transition-colors"
            >
              Find Collapses
            </button>
          </div>
          <div className="text-white/30">
            {selectedRound && `Viewing Round ${selectedRound}`}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
