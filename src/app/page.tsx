'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Scoreboard } from '@/components/panels/Scoreboard';
import { TiltGraph } from '@/components/charts/TiltGraph';
import { TimeoutAlert } from '@/components/alerts/TimeoutAlert';
import { MapCanvas } from '@/components/map/MapCanvas';
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
    roundDeaths,
    playerPositions,
    mapBounds,
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

              {/* Map Visualization - Deaths */}
              <div className="card">
                <h3 className="card-header">Round Deaths</h3>
                <MapCanvas
                  mapName={roundData?.map || 'Unknown'}
                  deaths={roundDeaths}
                  bounds={mapBounds || undefined}
                />
              </div>

              {/* Trade Web - Player Positions */}
              <div className="card">
                <h3 className="card-header">Trade Web</h3>
                <MapCanvas
                  mapName={roundData?.map || 'Unknown'}
                  deaths={[]}
                  playerPositions={Object.entries(playerPositions).map(([name, pos]) => ({
                    name,
                    x: pos[0],
                    y: pos[1],
                    team: 'c9' as const, // TODO: Track team from backend
                  }))}
                  showTradeWeb={true}
                  tradeableThreshold={2000}
                  bounds={mapBounds || undefined}
                />
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
