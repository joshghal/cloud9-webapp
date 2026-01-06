'use client';

import { useEffect, useState } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Scoreboard } from '@/components/panels/Scoreboard';
import { TiltGraph } from '@/components/charts/TiltGraph';
import { TimeoutAlert } from '@/components/alerts/TimeoutAlert';
import type { TimeoutAlert as TimeoutAlertType } from '@/types';

export default function Home() {
  const {
    isConnected,
    isRunning,
    error,
    matches,
    currentMatch,
    roundData,
    alerts,
    tradeTimeHistory,
    replayComplete,
    startReplay,
    stopReplay,
    changeSpeed,
    fetchMatches,
  } = useSocket();

  const [selectedMatch, setSelectedMatch] = useState<string | null>(null);
  const [speed, setSpeed] = useState(10);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [activeAlert, setActiveAlert] = useState<TimeoutAlertType | null>(null);

  // Fetch matches on mount
  useEffect(() => {
    fetchMatches();
  }, [fetchMatches]);

  // Show latest alert
  useEffect(() => {
    if (alerts.length > 0) {
      setActiveAlert(alerts[alerts.length - 1]);
    }
  }, [alerts]);

  const handleStart = () => {
    if (selectedMatch) {
      startReplay(selectedMatch, speed, aiEnabled);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--c9-dark)]">
      {/* Header */}
      <header className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">
              <span className="text-[#00a8e8]">Intervention</span> Engine
            </h1>
            <span className="text-sm text-[#a0aec0]">Cloud9 VALORANT</span>
          </div>

          <div className="flex items-center gap-3">
            <div className={`status-dot ${isConnected ? (isRunning ? 'running' : 'connected') : ''}`} />
            <span className="text-sm text-[#a0aec0]">
              {isRunning ? 'Live' : isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-6">
        {error && (
          <div className="mb-6 p-4 bg-[#ff4757]/20 border border-[#ff4757]/50 rounded-lg text-[#ff4757]">
            {error}
          </div>
        )}

        <div className="grid grid-cols-12 gap-6">
          {/* Sidebar - Match Selection */}
          <aside className="col-span-3 space-y-6">
            <div className="card">
              <h2 className="card-header">Select Match</h2>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {matches.map((match) => (
                  <button
                    key={match.filename}
                    onClick={() => setSelectedMatch(match.filename)}
                    disabled={isRunning}
                    className={`w-full p-3 rounded-lg text-left transition-all ${
                      selectedMatch === match.filename
                        ? 'bg-[#00a8e8]/20 border-2 border-[#00a8e8]'
                        : 'bg-white/5 border-2 border-transparent hover:bg-white/10'
                    } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <h3 className="font-medium text-white">{match.name}</h3>
                    <p className="text-xs text-[#a0aec0]">{match.tournament}</p>
                    <p className="text-xs text-[#a0aec0]">{match.date}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Controls */}
            <div className="card">
              <h2 className="card-header">Controls</h2>

              <div className="mb-4">
                <label className="text-sm text-[#a0aec0] block mb-2">
                  Replay Speed: {speed}x
                </label>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => {
                    const newSpeed = Number(e.target.value);
                    setSpeed(newSpeed);
                    if (isRunning) changeSpeed(newSpeed);
                  }}
                  className="w-full"
                />
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-[#a0aec0]">
                  <input
                    type="checkbox"
                    checked={aiEnabled}
                    onChange={(e) => setAiEnabled(e.target.checked)}
                    className="rounded"
                  />
                  AI Tactical Insights
                </label>
              </div>

              {isRunning ? (
                <button onClick={stopReplay} className="btn btn-danger w-full">
                  Stop Replay
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  disabled={!selectedMatch || !isConnected}
                  className="btn btn-primary w-full"
                >
                  Start Replay
                </button>
              )}
            </div>

            {/* Kill Feed */}
            <div className="card">
              <h2 className="card-header">Live Activity</h2>
              <div className="space-y-1 max-h-[200px] overflow-y-auto text-sm">
                {!isRunning && (
                  <p className="text-[#a0aec0]">Select a match to start</p>
                )}
              </div>
            </div>
          </aside>

          {/* Main Area */}
          <div className="col-span-9 space-y-6">
            {/* Scoreboard */}
            <Scoreboard
              c9Score={roundData?.c9_score || 0}
              oppScore={roundData?.opp_score || 0}
              round={roundData?.round || 0}
              currentMatch={currentMatch}
              winProbability={roundData?.win_probability || 50}
              momentum={roundData?.momentum || 'Even'}
              momentumTrend={roundData?.momentum_trend || 'stable'}
              warningLevel={roundData?.warning_level || 'none'}
              mapName={roundData?.map}
            />

            {/* Alert Area */}
            <TimeoutAlert
              alert={activeAlert}
              onDismiss={() => setActiveAlert(null)}
            />

            {/* Visualization Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Tilt Graph - THE MONEY SHOT */}
              <div className="col-span-2">
                <TiltGraph
                  tradeTimeHistory={tradeTimeHistory}
                  currentTilt={roundData?.tilt || null}
                />
              </div>

              {/* Map Visualization - TODO Week 1 Day 1-2 */}
              <div className="card">
                <h3 className="card-header">Map View</h3>
                <div className="map-container bg-[#060d17] flex items-center justify-center">
                  <div className="text-center text-[#a0aec0]">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                    </svg>
                    <p className="text-sm">Map visualization</p>
                    <p className="text-xs">Coming in Week 1</p>
                  </div>
                </div>
              </div>

              {/* Trade Web - TODO Week 1 Day 3-4 */}
              <div className="card">
                <h3 className="card-header">Trade Web</h3>
                <div className="map-container bg-[#060d17] flex items-center justify-center">
                  <div className="text-center text-[#a0aec0]">
                    <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-sm">Trade web visualization</p>
                    <p className="text-xs">Coming in Week 1</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Replay Complete Summary */}
            {replayComplete && (
              <div className="card">
                <h3 className="card-header">Match Summary</h3>
                <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-3xl font-bold text-white">{replayComplete.final_score}</p>
                    <p className="text-sm text-[#a0aec0]">Final Score</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-white">{replayComplete.total_rounds}</p>
                    <p className="text-sm text-[#a0aec0]">Rounds</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#ff4757]">{replayComplete.alerts_generated}</p>
                    <p className="text-sm text-[#a0aec0]">Alerts</p>
                  </div>
                  <div>
                    <p className="text-3xl font-bold text-[#00a8e8]">{replayComplete.actual_timeouts}</p>
                    <p className="text-sm text-[#a0aec0]">Timeouts Called</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
