'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type NavSection =
  | 'live'
  | 'post-match'
  | 'post-match/autopsy'
  | 'post-match/ghosts'
  | 'post-match/turning-points'
  | 'post-match/player-dna'
  | 'players'
  | 'players/growth'
  | 'players/stack-rank'
  | 'strategy'
  | 'strategy/playbook'
  | 'strategy/battle-plan'
  | 'strategy/scenarios'
  | 'strategy/opponent-matrix';

interface NavItem {
  id: NavSection;
  label: string;
  icon: string;
  children?: NavItem[];
  badge?: string;
  disabled?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'live',
    label: 'Live Analysis',
    icon: '📡',
  },
  {
    id: 'post-match',
    label: 'Post-Match',
    icon: '📊',
    children: [
      { id: 'post-match/autopsy', label: 'Round Autopsy', icon: '🔬' },
      { id: 'post-match/ghosts', label: 'Ghost Timeline', icon: '👻' },
      { id: 'post-match/turning-points', label: 'Turning Points', icon: '🎯' },
      { id: 'post-match/player-dna', label: 'Player DNA', icon: '🧬' },
    ],
  },
  {
    id: 'players',
    label: 'Players',
    icon: '👥',
    children: [
      { id: 'players/growth', label: 'Growth Trajectory', icon: '📈' },
      { id: 'players/stack-rank', label: 'Team Stack Rank', icon: '🏆' },
    ],
  },
  {
    id: 'strategy',
    label: 'Strategy',
    icon: '⚔️',
    children: [
      { id: 'strategy/playbook', label: 'Enemy Playbook', icon: '📋' },
      { id: 'strategy/battle-plan', label: 'Battle Plan', icon: '🗺️' },
      { id: 'strategy/scenarios', label: 'Scenario Simulator', icon: '🔮' },
      { id: 'strategy/opponent-matrix', label: 'Opponent Matrix', icon: '⚔️' },
    ],
  },
];

interface SidebarProps {
  activeSection: NavSection;
  onNavigate: (section: NavSection) => void;
  isReplayRunning?: boolean;
  isReplayComplete?: boolean;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

export default function Sidebar({
  activeSection,
  onNavigate,
  isReplayRunning = false,
  isReplayComplete = false,
  collapsed = false,
  onToggleCollapse,
}: SidebarProps) {
  const [expandedSections, setExpandedSections] = useState<string[]>(['post-match', 'players', 'strategy']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionId)
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isActive = (itemId: NavSection) => {
    return activeSection === itemId || activeSection.startsWith(itemId + '/');
  };

  const getItemState = (item: NavItem) => {
    // Live is only enabled when replay is running
    if (item.id === 'live') {
      return { disabled: false, badge: isReplayRunning ? 'LIVE' : undefined };
    }
    // Post-match is enabled when replay is complete
    if (item.id.startsWith('post-match')) {
      return { disabled: !isReplayComplete, badge: isReplayComplete ? 'NEW' : undefined };
    }
    // Other sections always available
    return { disabled: false };
  };

  const renderNavItem = (item: NavItem, depth = 0) => {
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedSections.includes(item.id);
    const itemState = getItemState(item);
    const active = isActive(item.id);

    return (
      <div key={item.id}>
        <button
          onClick={() => {
            if (hasChildren) {
              toggleSection(item.id);
            } else if (!itemState.disabled) {
              onNavigate(item.id);
            }
          }}
          disabled={itemState.disabled}
          className={`
            w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-all
            ${depth > 0 ? 'ml-4 text-sm' : ''}
            ${active ? 'bg-[#00a8e8]/20 text-[#00a8e8]' : 'text-white/70 hover:text-white hover:bg-white/5'}
            ${itemState.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
          `}
        >
          {!collapsed && <span className="text-base">{item.icon}</span>}
          {collapsed && depth === 0 && <span className="text-lg mx-auto">{item.icon}</span>}

          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>

              {itemState.badge && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                  itemState.badge === 'LIVE'
                    ? 'bg-green-500/20 text-green-400 animate-pulse'
                    : 'bg-[#00a8e8]/20 text-[#00a8e8]'
                }`}>
                  {itemState.badge}
                </span>
              )}

              {hasChildren && (
                <motion.span
                  animate={{ rotate: isExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="text-white/30"
                >
                  ▼
                </motion.span>
              )}
            </>
          )}
        </button>

        {/* Children */}
        {hasChildren && !collapsed && (
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="py-1 space-y-0.5">
                  {item.children!.map(child => renderNavItem(child, depth + 1))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    );
  };

  return (
    <div className={`
      flex flex-col h-full bg-black/60 backdrop-blur-md border-r border-white/10 transition-all duration-300
      ${collapsed ? 'w-16' : 'w-56'}
    `}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        {!collapsed ? (
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold">
                <span className="text-[#00a8e8]">Intervention</span>
              </h1>
              <p className="text-xs text-white/40">Cloud9 VALORANT</p>
            </div>
            <button
              onClick={onToggleCollapse}
              className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
            >
              ◀
            </button>
          </div>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          >
            ▶
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-2 space-y-1">
        {NAV_ITEMS.map(item => renderNavItem(item))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-white/10">
        {!collapsed && (
          <div className="flex items-center gap-2 text-xs text-white/40">
            <div className={`w-2 h-2 rounded-full ${
              isReplayRunning ? 'bg-green-500 animate-pulse' : 'bg-white/30'
            }`} />
            <span>{isReplayRunning ? 'Replay Active' : 'Idle'}</span>
          </div>
        )}
      </div>
    </div>
  );
}
