'use client';

import { useEffect, useState, useMemo } from 'react';
import { useSocket } from '@/hooks/useSocket';
import { Sidebar, NavSection } from '@/components/navigation';
import { Scoreboard } from '@/components/panels/Scoreboard';
import { TiltGraph } from '@/components/charts/TiltGraph';
import { PanicUtilityTracker } from '@/components/charts/PanicUtilityTracker';
import { FullScreenTimeoutAlert } from '@/components/alerts/FullScreenTimeoutAlert';
import { MapCanvas } from '@/components/map/MapCanvas';
import { PlayerTiltCards } from '@/components/panels/PlayerTiltCards';
import { CollapseCascade } from '@/components/panels/CollapseCascade';
import CoachQuery, { LiveMatchContext } from '@/components/panels/CoachQuery';
import PostMatchAnalytics from '@/components/analytics/PostMatchAnalytics';
import { RoundAutopsy, GhostTimeline, TurningPoints, PlayerDNA } from '@/components/analytics';
import { GrowthTrajectory, TeamStackRank, OpponentMatrix } from '@/components/evaluation';
import { EnemyPlaybook, BattlePlan, ScenarioSimulator } from '@/components/strategy';
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
  const [activeSection, setActiveSection] = useState<NavSection>('live');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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

  // Auto-navigate to post-match when replay completes
  useEffect(() => {
    if (replayComplete && !isRunning) {
      setActiveSection('post-match/autopsy');
    }
  }, [replayComplete, isRunning]);

  const handleStart = () => {
    if (selectedMatch) {
      startReplay(selectedMatch, speed, aiEnabled);
      setActiveSection('live');
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

  // Get player warnings from active alert or generate from round data
  const currentPlayerWarnings = useMemo(() => {
    if (activeAlert?.player_warnings && activeAlert.player_warnings.length > 0) {
      return activeAlert.player_warnings;
    }
    const warnings: string[] = [];
    if (roundData?.damage_efficiency?.worst_player && roundData?.damage_efficiency.duels_lost !== undefined) {
      warnings.push(`${roundData?.damage_efficiency.worst_player}: ${roundData?.damage_efficiency.duels_lost} duels lost`);
    }
    return warnings;
  }, [activeAlert, roundData]);

  // Build live context for Coach AI with enemy analysis
  const liveMatchContext: LiveMatchContext | null = useMemo(() => {
    if (!isRunning || !roundData) return null;

    // Build player lists from positions first
    const c9PlayersSet = new Set<string>();
    const oppPlayersSet = new Set<string>();
    Object.entries(playerPositions).forEach(([name, data]) => {
      if (data?.team === 'c9') c9PlayersSet.add(name);
      else oppPlayersSet.add(name);
    });

    // Also build from kill events (more reliable team info)
    killFeed.forEach(kill => {
      if (kill.killer_team === 'c9') c9PlayersSet.add(kill.killer);
      else if (kill.killer_team === 'opp') oppPlayersSet.add(kill.killer);
      if (kill.victim_team === 'c9') c9PlayersSet.add(kill.victim);
      else if (kill.victim_team === 'opp') oppPlayersSet.add(kill.victim);
    });

    const c9Players = Array.from(c9PlayersSet);
    const oppPlayers = Array.from(oppPlayersSet);

    const c9KillsByPlayer: Record<string, number> = {};
    const oppKillsByPlayer: Record<string, number> = {};
    const c9DeathsByPlayer: Record<string, number> = {};
    const oppDeathsByPlayer: Record<string, number> = {};

    killFeed.forEach(kill => {
      // Use team info from kill event if available, fallback to position lookup
      const killerIsC9 = kill.killer_team === 'c9' || (kill.killer_team === undefined && c9Players.includes(kill.killer));
      const victimIsC9 = kill.victim_team === 'c9' || (kill.victim_team === undefined && c9Players.includes(kill.victim));

      if (killerIsC9) {
        c9KillsByPlayer[kill.killer] = (c9KillsByPlayer[kill.killer] || 0) + 1;
      } else {
        oppKillsByPlayer[kill.killer] = (oppKillsByPlayer[kill.killer] || 0) + 1;
      }

      if (victimIsC9) {
        c9DeathsByPlayer[kill.victim] = (c9DeathsByPlayer[kill.victim] || 0) + 1;
      } else {
        oppDeathsByPlayer[kill.victim] = (oppDeathsByPlayer[kill.victim] || 0) + 1;
      }
    });

    let topFragger: { name: string; kills: number } | undefined;
    let maxKills = 0;
    Object.entries(oppKillsByPlayer).forEach(([name, kills]) => {
      if (kills > maxKills) {
        maxKills = kills;
        topFragger = { name, kills };
      }
    });

    const oppName = currentMatch?.replace(/^Cloud9\s*(?:vs?\.?\s*)?/i, '').trim() || 'Opponent';

    const annotatedKillFeed = killFeed.slice(-20).map(kill => ({
      ...kill,
      killerTeam: kill.killer_team || (c9Players.includes(kill.killer) ? 'c9' as const : 'opp' as const)
    }));

    return {
      currentMatch,
      round: roundData?.round || 0,
      c9Score: roundData?.c9_score || 0,
      oppScore: roundData?.opp_score || 0,
      winProbability: roundData?.win_probability || 50,
      momentum: roundData?.momentum || 'Even',
      consecutiveLosses: roundData?.consecutive_losses || 0,
      killFeed: annotatedKillFeed,
      recentDeaths: roundDeaths.map(d => ({
        player: d.player,
        position: `(${Math.round(d.x)}, ${Math.round(d.y)})`,
        wasTraded: false
      })),
      playerStats: Object.fromEntries(
        Object.entries(c9KillsByPlayer).map(([name, kills]) => [
          name,
          { kills, deaths: c9DeathsByPlayer[name] || 0, assists: 0 }
        ])
      ),
      mapName: roundData?.map?.name || 'Unknown',
      tiltMetrics: roundData?.tilt ? {
        trade_time_current: roundData?.tilt.trade_time_current || 0,
        trade_time_baseline: roundData?.tilt.trade_time_baseline || 1,
        diagnosis: roundData?.tilt.diagnosis
      } : undefined,
      enemyTeam: {
        name: oppName,
        players: oppPlayers,
        topFragger,
        killsByPlayer: oppKillsByPlayer,
        deathsByPlayer: oppDeathsByPlayer,
        roundsWon: roundData?.opp_score || 0,
        recentRoundResults: [],
      },
    };
  }, [isRunning, roundData, currentMatch, killFeed, roundDeaths, playerPositions]);

  // Render the main content based on active section
  const renderContent = () => {
    // Post-Match Analytics sections
    if (activeSection.startsWith('post-match')) {
      if (!selectedMatch) {
        return (
          <div className="flex items-center justify-center h-full text-white/40">
            <div className="text-center">
              <div className="text-4xl mb-2">📊</div>
              <p>Select a match from the sidebar to view post-match analysis</p>
            </div>
          </div>
        );
      }

      switch (activeSection) {
        case 'post-match':
        case 'post-match/autopsy':
          return <RoundAutopsy matchFile={selectedMatch} />;
        case 'post-match/ghosts':
          return <GhostTimeline matchFile={selectedMatch} />;
        case 'post-match/turning-points':
          return <TurningPoints matchFile={selectedMatch} />;
        case 'post-match/player-dna':
          return <PlayerDNA matchFile={selectedMatch} />;
        default:
          return <RoundAutopsy matchFile={selectedMatch} />;
      }
    }

    // Players sections
    if (activeSection.startsWith('players')) {
      switch (activeSection) {
        case 'players':
        case 'players/growth':
          return <GrowthTrajectory />;
        case 'players/stack-rank':
          return <TeamStackRank />;
        default:
          return <GrowthTrajectory />;
      }
    }

    // Strategy sections
    if (activeSection.startsWith('strategy')) {
      switch (activeSection) {
        case 'strategy':
        case 'strategy/playbook':
          return <EnemyPlaybook />;
        case 'strategy/battle-plan':
          return <BattlePlan />;
        case 'strategy/scenarios':
          return <ScenarioSimulator />;
        case 'strategy/opponent-matrix':
          return <OpponentMatrix />;
        default:
          return <EnemyPlaybook />;
      }
    }

    // Live Analysis (default)
    return (
      <div className="space-y-6">
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

        {/* Tilt Graph - Primary momentum/tilt visualization */}
        <TiltGraph
          tradeTimeHistory={tradeTimeHistory}
          currentTilt={roundData?.tilt || null}
        />

        {/* Player Tilt Cards */}
        {currentPlayerWarnings.length > 0 && (
          <PlayerTiltCards
            warnings={currentPlayerWarnings}
            panicUtilityCount={panicUtilityEvents.filter(e => e.round === currentRound).length}
            tradeTimeIncrease={tradeTimeIncrease}
          />
        )}

        {/* Collapse Cascade */}
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
              showReferencePoints={showCalibration}
            />
          </div>

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
                x: data?.pos[0],
                y: data?.pos[1],
                team: data?.team,
              }))}
              showTradeWeb={true}
              tradeableThreshold={roundData?.map?.diagonal ? roundData?.map.diagonal * 0.15 : 2500}
              showReferencePoints={showCalibration}
            />
          </div>
        </div>

        {/* Panic Utility Tracker */}
        <PanicUtilityTracker
          events={panicUtilityEvents}
          currentRound={roundData?.round || 0}
        />

        {/* Coach AI */}
        <div className="h-[600px]">
          <CoachQuery
            liveContext={liveMatchContext}
            isLive={isRunning}
          />
        </div>

        {/* Post-Match Analysis Prompt */}
        {replayComplete && (
          <div className="p-4 rounded-lg bg-gradient-to-r from-[#00a8e8]/20 to-transparent border border-[#00a8e8]/30">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Replay Complete</h3>
                <p className="text-sm text-white/50">
                  {replayComplete.final_score} • {replayComplete.total_rounds} rounds
                </p>
              </div>
              <button
                onClick={() => setActiveSection('post-match/autopsy')}
                className="px-4 py-2 rounded-lg bg-[#00a8e8] text-white font-medium hover:bg-[#00a8e8]/80 transition-colors"
              >
                View Full Analysis
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex h-screen bg-[var(--c9-dark)]">
      {/* Sidebar Navigation */}
      <Sidebar
        activeSection={activeSection}
        onNavigate={setActiveSection}
        isReplayRunning={isRunning}
        isReplayComplete={!!replayComplete}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-3 border-b border-white/10 bg-black/40">
          <div className="flex items-center gap-4">
            <div className={`status-dot ${isConnected ? (isRunning ? 'running' : 'connected') : ''}`} />
            <span className="text-sm text-[#a0aec0]">
              {isRunning ? 'Live' : isConnected ? 'Connected' : 'Disconnected'}
            </span>
            {currentMatch && (
              <>
                <span className="text-white/30">•</span>
                <span className="text-sm text-white/70">{currentMatch}</span>
              </>
            )}
          </div>

          {/* Quick Controls */}
          <div className="flex items-center gap-3">
            {isRunning && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">Speed:</span>
                <input
                  type="range"
                  min="1"
                  max="100"
                  value={speed}
                  onChange={(e) => {
                    const newSpeed = Number(e.target.value);
                    setSpeed(newSpeed);
                    changeSpeed(newSpeed);
                  }}
                  className="w-20"
                />
                <span className="text-xs text-white/70 w-8">{speed}x</span>
              </div>
            )}

            {isRunning ? (
              <button onClick={stopReplay} className="btn btn-danger text-sm py-1.5">
                Stop
              </button>
            ) : selectedMatch && (
              <button
                onClick={handleStart}
                disabled={!isConnected}
                className="btn btn-primary text-sm py-1.5"
              >
                Start Replay
              </button>
            )}
          </div>
        </header>

        {/* Content Grid */}
        <div className="flex-1 flex overflow-hidden">
          {/* Match Selection Panel (collapsible) */}
          <aside className="w-64 border-r border-white/10 flex flex-col overflow-hidden bg-black/20">
            <div className="p-3 border-b border-white/10">
              <h2 className="text-sm font-medium text-white/70">Available Matches</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {matches.map((match) => (
                <button
                  key={match.filename}
                  onClick={() => setSelectedMatch(match.filename)}
                  disabled={isRunning}
                  className={`w-full p-3 rounded-lg text-left transition-all ${
                    selectedMatch === match.filename
                      ? 'bg-[#00a8e8]/20 border border-[#00a8e8]/50'
                      : 'bg-white/5 border border-transparent hover:bg-white/10'
                  } ${isRunning ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <h3 className="text-sm font-medium text-white truncate">{match.name}</h3>
                  <p className="text-xs text-white/50 truncate">{match.tournament}</p>
                  <p className="text-xs text-white/40">{match.date}</p>
                </button>
              ))}
            </div>

            {/* Live Activity Feed */}
            {isRunning && (
              <div className="border-t border-white/10 p-3 max-h-48 overflow-y-auto">
                <h3 className="text-xs text-white/50 uppercase tracking-wider mb-2">Live Activity</h3>
                <div className="space-y-1 text-xs">
                  {killFeed.slice(-10).reverse().map((kill, i) => (
                    <div
                      key={`${kill.round}-${kill.killer}-${kill.victim}-${i}`}
                      className="flex items-center gap-1 text-white/60"
                    >
                      <span className="text-[10px] text-white/30">R{kill.round}</span>
                      <span className="truncate">{kill.killer}</span>
                      <span className="text-[#ff4757]">→</span>
                      <span className="truncate">{kill.victim}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </aside>

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto p-6">
            {error && (
              <div className="mb-6 p-4 bg-[#ff4757]/20 border border-[#ff4757]/50 rounded-lg text-[#ff4757]">
                {error}
              </div>
            )}

            {renderContent()}
          </main>
        </div>
      </div>

      {/* Full-screen Timeout Alert */}
      <FullScreenTimeoutAlert
        alert={activeAlert}
        onDismiss={() => setActiveAlert(null)}
        winProbability={roundData?.win_probability || 50}
        tradeTimeIncrease={tradeTimeIncrease}
      />
    </div>
  );
}
