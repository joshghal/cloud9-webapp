'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Scoreboard } from '@/components/panels/Scoreboard';
import { TiltGraph } from '@/components/charts/TiltGraph';
import { PanicUtilityTracker } from '@/components/charts/PanicUtilityTracker';
import { FullScreenTimeoutAlert } from '@/components/alerts/FullScreenTimeoutAlert';
import { MapCanvas } from '@/components/map/MapCanvas';
import { MomentumMeter } from '@/components/panels/MomentumMeter';
import { PlayerTiltCards } from '@/components/panels/PlayerTiltCards';
import { CollapseCascade } from '@/components/panels/CollapseCascade';
import { GameReviewSummary } from '@/components/panels/GameReviewSummary';
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
    killFeed,
    tradeTimeHistory,
    winProbabilityHistory,
    panicUtilityEvents,
    seriesData,
    roundDeaths,
    playerPositions,
    mapBounds,
    ghostTeammates,
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
  const [showCalibration, setShowCalibration] = useState(false);

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

  // Filter ghost teammates to only show current round
  const currentRound = roundData?.round || 0;
  const currentRoundGhosts = useMemo(() => {
    return ghostTeammates.filter(g => g.round === currentRound);
  }, [ghostTeammates, currentRound]);

  // Calculate trade time increase percentage
  const tradeTimeIncrease = useMemo(() => {
    const tilt = roundData?.tilt;
    if (!tilt?.trade_time_current || !tilt?.trade_time_baseline || tilt.trade_time_baseline === 0) {
      return 0;
    }
    return Math.round((tilt.trade_time_current / tilt.trade_time_baseline - 1) * 100);
  }, [roundData?.tilt]);

  // Get previous probability for momentum shift animation
  const previousProbability = useMemo(() => {
    if (winProbabilityHistory.length < 2) return 50;
    return winProbabilityHistory[winProbabilityHistory.length - 2]?.probability || 50;
  }, [winProbabilityHistory]);

  // Get player warnings from active alert or generate from round data
  const currentPlayerWarnings = useMemo(() => {
    if (activeAlert?.player_warnings && activeAlert.player_warnings.length > 0) {
      return activeAlert.player_warnings;
    }
    const warnings: string[] = [];
    if (roundData?.damage_efficiency?.worst_player && roundData.damage_efficiency.duels_lost !== undefined) {
      warnings.push(`${roundData.damage_efficiency.worst_player}: ${roundData.damage_efficiency.duels_lost} duels lost`);
    }
    return warnings;
  }, [activeAlert, roundData]);

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

              <div className="mb-4">
                <label className="flex items-center gap-2 text-sm text-[#a0aec0]">
                  <input
                    type="checkbox"
                    checked={showCalibration}
                    onChange={(e) => setShowCalibration(e.target.checked)}
                    className="rounded"
                  />
                  Show Calibration Points
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
                {!isRunning ? (
                  <p className="text-[#a0aec0]">Select a match to start</p>
                ) : killFeed.length === 0 ? (
                  <p className="text-[#a0aec0]">Waiting for kills...</p>
                ) : (
                  killFeed.slice(-15).reverse().map((kill, i) => (
                    <div
                      key={`${kill.round}-${kill.killer}-${kill.victim}-${i}`}
                      className="flex items-center gap-2 py-1 border-b border-white/5 last:border-0"
                    >
                      <span className="text-[10px] text-white/30 w-6">R{kill.round}</span>
                      <span className="text-white/80 truncate">{kill.killer}</span>
                      <span className="text-[#ff4757]">→</span>
                      <span className="text-white/60 truncate">{kill.victim}</span>
                    </div>
                  ))
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
              mapName={roundData?.map?.name || ''}
            />

            {/* Dramatic Momentum Display - THE BIG NUMBER */}
            <MomentumMeter
              winProbability={roundData?.win_probability || 50}
              previousProbability={previousProbability}
              momentum={roundData?.momentum || 'Even'}
              momentumTrend={roundData?.momentum_trend || 'stable'}
              tradeTimeIncrease={tradeTimeIncrease}
              consecutiveLosses={roundData?.consecutive_losses || 0}
              round={roundData?.round || 0}
            />

            {/* TiltGraph - THE HERO / MONEY SHOT - Full Width */}
            <TiltGraph
              tradeTimeHistory={tradeTimeHistory}
              currentTilt={roundData?.tilt || null}
            />

            {/* Player Tilt Cards - Show struggling players */}
            {currentPlayerWarnings.length > 0 && (
              <PlayerTiltCards
                warnings={currentPlayerWarnings}
                panicUtilityCount={panicUtilityEvents.filter(e => e.round === currentRound).length}
                tradeTimeIncrease={tradeTimeIncrease}
              />
            )}

            {/* Collapse Cascade - Component handles its own visibility */}
            <CollapseCascade
              currentRound={currentRound}
              consecutiveLosses={roundData?.consecutive_losses || 0}
              tradeTimeIncrease={tradeTimeIncrease}
              winProbability={roundData?.win_probability || 50}
              tiltDiagnosis={roundData?.tilt?.diagnosis}
              untradeableCount={currentRoundGhosts.length}
              panicUtilityCount={panicUtilityEvents.filter(e => e.round === currentRound).length}
            />

            {/* Visualization Grid */}
            <div className="grid grid-cols-2 gap-6">
              {/* Map Visualization - Deaths */}
              <div className="card">
                <h3 className="card-header flex items-center gap-2">
                  Round Deaths
                  {currentRoundGhosts.length > 0 && (
                    <span className="text-[10px] bg-[#ffa502]/20 text-[#ffa502] px-1.5 py-0.5 rounded">
                      {currentRoundGhosts.length} untradeable
                    </span>
                  )}
                </h3>
                <MapCanvas
                  mapName={roundData?.map?.name || 'Unknown'}
                  deaths={roundDeaths}
                  ghostTeammates={currentRoundGhosts}
                  bounds={roundData?.map?.bounds || mapBounds || undefined}
                  showReferencePoints={showCalibration}
                />
              </div>

              {/* Proximity Web - Player Positions */}
              <div className="card">
                <h3 className="card-header flex items-center gap-2">
                  Proximity Web
                  <span
                    className="text-[10px] text-[#a0aec0] cursor-help"
                    title="Shows player distances. Green = close, Red = far. Note: Does not account for walls/obstacles."
                  >
                    [?]
                  </span>
                </h3>
                <MapCanvas
                  mapName={roundData?.map?.name || 'Unknown'}
                  deaths={[]}
                  playerPositions={Object.entries(playerPositions).map(([name, data]) => ({
                    name,
                    x: data.pos[0],
                    y: data.pos[1],
                    team: data.team,
                  }))}
                  showTradeWeb={true}
                  tradeableThreshold={roundData?.map?.diagonal ? roundData.map.diagonal * 0.15 : 2500}
                  bounds={roundData?.map?.bounds || mapBounds || undefined}
                  showReferencePoints={showCalibration}
                />
              </div>

            </div>

            {/* Panic Utility Tracker - Full Width */}
            <PanicUtilityTracker
              events={panicUtilityEvents}
              currentRound={roundData?.round || 0}
            />

            {/* Post-Game Analysis - Comprehensive Series Review */}
            {replayComplete && (
              <GameReviewSummary
                replayComplete={replayComplete}
                alerts={alerts}
                panicUtilityEvents={panicUtilityEvents}
                tradeTimeHistory={tradeTimeHistory}
                seriesData={seriesData}
              />
            )}
          </div>
        </div>
      </main>

      {/* Full-screen Timeout Alert - Takes over screen when triggered */}
      <FullScreenTimeoutAlert
        alert={activeAlert}
        onDismiss={() => setActiveAlert(null)}
        winProbability={roundData?.win_probability || 50}
        tradeTimeIncrease={tradeTimeIncrease}
      />
    </div>
  );
}
