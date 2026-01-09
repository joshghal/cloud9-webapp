'use client';

import { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// API configuration
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Live match context passed from parent
export interface LiveMatchContext {
  currentMatch: string | null;
  round: number;
  c9Score: number;
  oppScore: number;
  winProbability: number;
  momentum: string;
  consecutiveLosses: number;
  killFeed: Array<{ round: number; killer: string; victim: string; killerTeam?: 'c9' | 'opp' }>;
  recentDeaths: Array<{ player: string; position: string; wasTraded: boolean }>;
  playerStats: Record<string, { kills: number; deaths: number; assists: number }>;
  mapName: string;
  tiltMetrics?: {
    trade_time_current: number;
    trade_time_baseline: number;
    diagnosis?: string;
  };
  // Enemy analysis data
  enemyTeam?: {
    name: string;
    players: string[];
    topFragger?: { name: string; kills: number };
    killsByPlayer: Record<string, number>;
    deathsByPlayer: Record<string, number>;
    roundsWon: number;
    recentRoundResults: Array<{ round: number; winner: 'c9' | 'opp' }>;
  };
  // Site/position patterns
  siteActivity?: {
    aSite: { c9Kills: number; oppKills: number };
    bSite: { c9Kills: number; oppKills: number };
    mid: { c9Kills: number; oppKills: number };
  };
}

interface Source {
  id: string;
  type: string;
  relevance: number;
  preview: string;
  metadata: Record<string, unknown>;
}

interface QueryResponse {
  success: boolean;
  answer: string;
  sources: Source[];
  query: string;
  duration_ms: number;
  error?: string;
}

interface WhatIfResponse {
  success: boolean;
  scenario: string;
  predicted_outcome: string;
  confidence: number;
  supporting_evidence: Array<{
    id: string;
    content: string;
    relevance: number;
  }>;
  recommendation: string;
  error?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  duration_ms?: number;
  isWhatIf?: boolean;
  confidence?: number;
}

const EXAMPLE_QUERIES = [
  "Compare OXY and Xeppaa K/D ratios",
  "Who is the best performing C9 player?",
  "When did C9 experience tilt or loss streaks?",
  "What happens after C9 calls a timeout?",
];

const LIVE_EXAMPLE_QUERIES = [
  "Who's their top fragger and how do we counter?",
  "What's the enemy team's pattern?",
  "Who's struggling on our team?",
  "Should we call a timeout now?",
  "What tactical adjustment should we make?",
  "Which enemy player should we target?",
];

const WHAT_IF_EXAMPLES = [
  { label: "Timeout at round 8", type: "timeout", params: { round: 8, context: "During a loss streak" } },
  { label: "OXY performs like vs 2GAME", type: "player", params: { player: "OXY", reference: "2GAME eSports" } },
  { label: "Better trade positioning", type: "custom", params: { scenario: "What if C9 had better trade positioning when star player died first?" } },
];

// Markdown components with compact styling
const MarkdownComponents = {
  h1: ({ children }: { children?: React.ReactNode }) => (
    <h1 className="text-base font-bold text-white mt-3 mb-1 first:mt-0">{children}</h1>
  ),
  h2: ({ children }: { children?: React.ReactNode }) => (
    <h2 className="text-sm font-bold text-white mt-3 mb-1 first:mt-0">{children}</h2>
  ),
  h3: ({ children }: { children?: React.ReactNode }) => (
    <h3 className="text-sm font-semibold text-cyan-400 mt-2 mb-1">{children}</h3>
  ),
  h4: ({ children }: { children?: React.ReactNode }) => (
    <h4 className="text-sm font-semibold text-cyan-300 mt-2 mb-0.5">{children}</h4>
  ),
  p: ({ children }: { children?: React.ReactNode }) => (
    <p className="text-sm text-white/85 mb-2 leading-relaxed">{children}</p>
  ),
  ul: ({ children }: { children?: React.ReactNode }) => (
    <ul className="list-disc list-outside text-sm text-white/85 mb-2 space-y-0.5 ml-4">{children}</ul>
  ),
  ol: ({ children }: { children?: React.ReactNode }) => (
    <ol className="list-decimal list-outside text-sm text-white/85 mb-2 space-y-0.5 ml-4">{children}</ol>
  ),
  li: ({ children }: { children?: React.ReactNode }) => (
    <li className="text-white/85 leading-relaxed">{children}</li>
  ),
  strong: ({ children }: { children?: React.ReactNode }) => (
    <strong className="font-bold text-white">{children}</strong>
  ),
  em: ({ children }: { children?: React.ReactNode }) => (
    <em className="italic text-white/70">{children}</em>
  ),
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-cyan-500/50 pl-2 py-0.5 my-2 text-white/70 italic bg-white/5 rounded-r">{children}</blockquote>
  ),
  code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
    const isInline = !className;
    return isInline ? (
      <code className="bg-white/10 px-1 py-0.5 rounded text-cyan-300 text-xs font-mono">{children}</code>
    ) : (
      <code className="block bg-black/30 p-2 rounded text-xs font-mono text-white/80 overflow-x-auto my-2">{children}</code>
    );
  },
  pre: ({ children }: { children?: React.ReactNode }) => (
    <pre className="bg-black/30 p-2 rounded overflow-x-auto my-2">{children}</pre>
  ),
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="overflow-x-auto my-2 rounded border border-white/10">
      <table className="w-full text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => (
    <thead className="bg-white/10">{children}</thead>
  ),
  tbody: ({ children }: { children?: React.ReactNode }) => (
    <tbody>{children}</tbody>
  ),
  tr: ({ children }: { children?: React.ReactNode }) => (
    <tr className="border-b border-white/5 hover:bg-white/5 transition-colors">{children}</tr>
  ),
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="px-2 py-1.5 text-left font-semibold text-cyan-400">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="px-2 py-1.5 text-white/85">{children}</td>
  ),
  hr: () => <hr className="border-white/10 my-2" />,
  a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
    <a href={href} className="text-cyan-400 hover:text-cyan-300 underline" target="_blank" rel="noopener noreferrer">{children}</a>
  ),
};

interface CoachQueryProps {
  liveContext?: LiveMatchContext | null;
  isLive?: boolean;
}

export default function CoachQuery({ liveContext, isLive = false }: CoachQueryProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [ragStatus, setRagStatus] = useState<{ available: boolean; total_chunks: number } | null>(null);
  const [activeTab, setActiveTab] = useState<'query' | 'whatif'>('query');
  const [useLiveContext, setUseLiveContext] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Check RAG status on mount
  useEffect(() => {
    fetch(`${API_BASE}/api/rag/status`)
      .then(res => res.json())
      .then(data => setRagStatus(data))
      .catch(() => setRagStatus({ available: false, total_chunks: 0 }));
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Build live context summary for the AI
  const buildLiveContextPayload = () => {
    if (!liveContext || !useLiveContext || !isLive) return null;

    // Build enemy team data from live context
    const enemyTeamPayload = liveContext.enemyTeam ? {
      name: liveContext.enemyTeam.name,
      players: liveContext.enemyTeam.players,
      top_fragger: liveContext.enemyTeam.topFragger,
      kills_by_player: liveContext.enemyTeam.killsByPlayer,
      deaths_by_player: liveContext.enemyTeam.deathsByPlayer,
      rounds_won: liveContext.enemyTeam.roundsWon,
    } : undefined;

    return {
      match: liveContext.currentMatch,
      round: liveContext.round,
      score: { c9: liveContext.c9Score, opponent: liveContext.oppScore },
      win_probability: liveContext.winProbability,
      momentum: liveContext.momentum,
      consecutive_losses: liveContext.consecutiveLosses,
      map: liveContext.mapName,
      recent_kills: liveContext.killFeed.slice(-10),
      player_stats: liveContext.playerStats,
      tilt: liveContext.tiltMetrics,
      // Include enemy team analysis
      enemy_team: enemyTeamPayload,
      // Explicitly mark C9 players for the AI
      c9_players: Object.keys(liveContext.playerStats || {}),
    };
  };

  const handleQuery = async (query: string) => {
    if (!query.trim() || isLoading) return;

    const hasLiveContext = isLive && useLiveContext && liveContext;

    // Add user message with context indicator
    setMessages(prev => [...prev, {
      role: 'user',
      content: hasLiveContext ? `[Live R${liveContext.round}] ${query}` : query
    }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/rag/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          live_context: buildLiveContextPayload(),
        }),
      });

      const data: QueryResponse = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.success ? data?.answer : `Error: ${data?.error}`,
        sources: data?.sources,
        duration_ms: data?.duration_ms,
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to connect to knowledge base: ${error}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleWhatIf = async (type: string, params: Record<string, unknown>) => {
    if (isLoading) return;

    const scenarioText = type === 'timeout'
      ? `What if timeout at round ${params.round}?`
      : type === 'player'
      ? `What if ${params.player} performed like vs ${params.reference}?`
      : params.scenario as string;

    // Add user message
    setMessages(prev => [...prev, { role: 'user', content: `[What-If] ${scenarioText}` }]);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/rag/what-if`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, ...params }),
      });

      const data: WhatIfResponse = await response.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data?.success ? data?.predicted_outcome : `Error: ${data?.error}`,
        isWhatIf: true,
        confidence: data?.confidence,
        sources: data?.supporting_evidence?.map(e => ({
          id: e.id,
          type: 'evidence',
          relevance: e.relevance,
          preview: e.content,
          metadata: {},
        })),
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Failed to analyze scenario: ${error}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          <div className="text-lg">🧠</div>
          <div>
            <h2 className="text-sm font-semibold text-white">Coach AI</h2>
            <p className="text-xs text-white/50">
              {ragStatus?.available
                ? `${ragStatus.total_chunks} insights`
                : 'Connecting...'}
              {isLive && liveContext && (
                <span className="ml-1 text-green-400">• Live R{liveContext.round}</span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Live Context Toggle */}
          {isLive && (
            <button
              onClick={() => setUseLiveContext(!useLiveContext)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                useLiveContext
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-white/5 text-white/40'
              }`}
              title={useLiveContext ? 'AI sees live match data' : 'AI uses only historical data'}
            >
              {useLiveContext ? '🔴 Live' : '📚 History'}
            </button>
          )}

          {/* Tab Switcher */}
          <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
            <button
              onClick={() => setActiveTab('query')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTab === 'query'
                  ? 'bg-cyan-500/20 text-cyan-400'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Query
            </button>
            <button
              onClick={() => setActiveTab('whatif')}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                activeTab === 'whatif'
                  ? 'bg-purple-500/20 text-purple-400'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              What-If
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-white/40 py-4">
            <p className="text-sm mb-3">
              {isLive && useLiveContext
                ? `Ask about the current match (R${liveContext?.round || 0})`
                : 'Ask questions about C9 match data'}
            </p>

            {activeTab === 'query' ? (
              <div className="space-y-1.5">
                {/* Live context queries */}
                {isLive && useLiveContext && (
                  <>
                    <p className="text-xs text-green-400/60">Live analysis:</p>
                    {LIVE_EXAMPLE_QUERIES.map((q, i) => (
                      <button
                        key={`live-${i}`}
                        onClick={() => handleQuery(q)}
                        className="block w-full text-left px-2 py-1.5 text-xs bg-green-500/10 hover:bg-green-500/20 rounded text-green-300/60 hover:text-green-300/80 transition-colors"
                      >
                        🔴 &quot;{q}&quot;
                      </button>
                    ))}
                    <div className="border-t border-white/10 my-2" />
                  </>
                )}
                <p className="text-xs text-white/30">Historical queries:</p>
                {EXAMPLE_QUERIES.map((q, i) => (
                  <button
                    key={i}
                    onClick={() => handleQuery(q)}
                    className="block w-full text-left px-2 py-1.5 text-xs bg-white/5 hover:bg-white/10 rounded text-white/60 hover:text-white/80 transition-colors"
                  >
                    &quot;{q}&quot;
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <p className="text-xs text-white/30">What-If Scenarios:</p>
                {WHAT_IF_EXAMPLES.map((ex, i) => (
                  <button
                    key={i}
                    onClick={() => handleWhatIf(ex.type, ex.params)}
                    className="block w-full text-left px-2 py-1.5 text-xs bg-purple-500/10 hover:bg-purple-500/20 rounded text-purple-300/60 hover:text-purple-300/80 transition-colors"
                  >
                    🔮 {ex.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`${
                msg.role === 'user'
                  ? 'ml-8'
                  : ''
              }`}
            >
              <div
                className={`rounded-lg p-3 ${
                  msg.role === 'user'
                    ? 'bg-cyan-500/20 text-cyan-100'
                    : msg.isWhatIf
                    ? 'bg-purple-500/10 border border-purple-500/20'
                    : 'bg-white/5'
                }`}
              >
                {msg.isWhatIf && msg.confidence !== undefined && (
                  <div className="flex items-center gap-2 mb-2 pb-1 border-b border-white/10">
                    <span className="text-xs text-purple-400">Confidence:</span>
                    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-linear-to-r from-purple-500 to-cyan-500"
                        style={{ width: `${msg.confidence * 100}%` }}
                      />
                    </div>
                    <span className="text-xs text-white/50">{Math.round(msg.confidence * 100)}%</span>
                  </div>
                )}

                {msg.role === 'user' ? (
                  <div className="text-sm font-medium">{msg.content}</div>
                ) : (
                  <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={MarkdownComponents}
                    >
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                )}

                {msg.sources && msg.sources.length > 0 && (
                  <div className="mt-3 pt-2 border-t border-white/10">
                    <p className="text-xs text-white/40 mb-2">
                      📚 Sources ({msg.sources.length})
                      {msg.duration_ms && ` • ⚡ ${msg.duration_ms}ms`}
                    </p>
                    <div className="space-y-1">
                      {msg.sources.slice(0, 3).map((src, j) => (
                        <div key={j} className="text-xs text-white/40 bg-white/5 rounded px-2 py-1">
                          <span className="text-cyan-500/80 font-medium">[{src.type}]</span> {src.preview.slice(0, 100)}...
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex items-center gap-2 text-white/50 text-sm">
            <div className="animate-spin w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full" />
            Analyzing match data?...
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-white/10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (activeTab === 'query') {
              handleQuery(input);
            } else {
              handleWhatIf('custom', { scenario: input });
            }
          }}
          className="flex gap-2"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={activeTab === 'query'
              ? "Ask about player stats, matches, patterns..."
              : "Describe a what-if scenario..."
            }
            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-cyan-500/50"
            disabled={isLoading || !ragStatus?.available}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim() || !ragStatus?.available}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'query'
                ? 'bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30'
                : 'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {activeTab === 'query' ? 'Ask' : 'Analyze'}
          </button>
        </form>
      </div>
    </div>
  );
}
