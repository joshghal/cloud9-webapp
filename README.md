# Intervention Engine - Next.js Frontend

Visual frontend for the Cloud9 VALORANT tactical timeout recommendation system.

**Cloud9 x JetBrains DataJam 2026** | Powered by **GRID Data**

---

## Quick Start

```bash
# Start the Python backend first (in cloud9/ root)
cd /Users/joshuagalilea/Documents/joga/cloud9
source venv/bin/activate
python webapp/app.py

# Then start the Next.js frontend (in another terminal)
cd /Users/joshuagalilea/Documents/joga/cloud9/webapp-next
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the app.

---

## Architecture

```
webapp-next/
├── src/
│   ├── app/
│   │   ├── page.tsx          # Main dashboard page
│   │   └── globals.css       # Cloud9 theme + animations
│   ├── components/
│   │   ├── charts/
│   │   │   ├── TiltGraph.tsx           # Trade time analysis (THE MONEY SHOT)
│   │   │   ├── WinProbabilityTracker.tsx  # Win probability + momentum
│   │   │   └── PanicUtilityTracker.tsx    # Panic utility detection
│   │   ├── panels/
│   │   │   └── Scoreboard.tsx          # Score + momentum + win probability
│   │   ├── alerts/
│   │   │   └── TimeoutAlert.tsx        # AI-powered timeout alerts
│   │   └── map/
│   │       └── MapCanvas.tsx           # Deaths + Trade Web + Ghost Teammates
│   ├── hooks/
│   │   └── useSocket.ts      # Socket.IO connection + all state management
│   ├── config/
│   │   └── maps.ts           # Per-map calibration configs
│   └── types/
│       └── index.ts          # TypeScript types matching Python backend
└── public/
    └── maps/                 # VALORANT map images (Lotus, Haven, Ascent, etc.)
```

---

## Features

### Completed
- [x] **TiltGraph** - Animated Chart.js trade time visualization with baseline/tilt zone
- [x] **Trade Web** - Player connections on map (green=tradeable, red=isolated)
- [x] **Win Probability Tracker** - Live probability with trend chart and momentum
- [x] **Panic Utility Detector** - Tracks abilities used within 2s of death
- [x] **Ghost Teammates** - Shows where teammates SHOULD be (auto-clears 3s)
- [x] **MapCanvas** - Deaths, positions, trade web, ghost teammates
- [x] **Scoreboard** - Score, momentum, win probability bar
- [x] **TimeoutAlert** - AI-powered alerts with talking points
- [x] **Map Calibration** - Per-map coordinate calibration system
- [x] **React 18 Strict Mode** - Duplicate socket connection prevention

### Remaining
- [ ] Record demo video
- [ ] Map calibration refinement (Haven)

---

## Key Components

### TiltGraph (`src/components/charts/TiltGraph.tsx`)
Animated Chart.js line graph showing trade time analysis:
- Trade time per round (time between C9 death and revenge kill)
- Baseline comparison (historical average)
- Tilt zone highlighting (150% of baseline)
- Diagnosis: LOCKED IN / NEUTRAL / TACTICAL / TILT DETECTED

### WinProbabilityTracker (`src/components/charts/WinProbabilityTracker.tsx`)
Live win probability with context:
- Current probability with change indicator
- Mini trend chart (last 10 rounds)
- Momentum indicator (improving/declining/stable)
- Status labels: STRONG / AHEAD / EVEN / BEHIND / DANGER
- "TIMEOUT ZONE" warning below 40%

### PanicUtilityTracker (`src/components/charts/PanicUtilityTracker.tsx`)
Tracks abilities used right before death:
- Total wasted abilities count
- Per-player breakdown with most wasted ability
- Recent panic event alerts
- Alert levels: WATCH → HIGH ALERT → TILT DETECTED
- Insight generation: "OXY is forcing plays - consider timeout"

### MapCanvas (`src/components/map/MapCanvas.tsx`)
2D map visualization:
- Death markers with pulse animation
- Player position markers (C9 blue, enemy red)
- Trade Web lines (green=close, red dashed=far)
- Ghost Teammates (orange dashed marker showing optimal position)
- Reference points for calibration (toggle-able)

### useSocket (`src/hooks/useSocket.ts`)
Central socket connection and state management:
- All socket event handlers
- State: roundData, alerts, deaths, playerPositions, ghostTeammates, panicUtilityEvents, winProbabilityHistory, tradeTimeHistory
- React 18 strict mode protection (prevents duplicate connections)

---

## Socket.IO Events

### Received from Backend
```typescript
'round_update'     -> { round, c9_score, opp_score, tilt, momentum, map, win_probability }
'death_event'      -> { x, y, player, team, killer, round, timestamp }
'position_update'  -> { positions: { name: { pos, team } }, map_bounds }
'ability_used'     -> { player, team, ability, round, timestamp }
'timeout_alert'    -> { confidence, reasons, ai_insight, player_warnings }
'round_start'      -> { round, map_bounds }
'game_changed'     -> { map, game_number }
'replay_complete'  -> { final_score, total_rounds, alerts_generated }
```

### Sent to Backend
```typescript
'start_replay'  -> { filename, speed, ai_enabled }
'stop_replay'   -> {}
'change_speed'  -> { speed }
'pause_replay'  -> {}
'resume_replay' -> {}
```

---

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Map Calibration

Each map has calibration config in `src/config/maps.ts`:

```typescript
interface MapConfig {
  displayName: string;
  image: string;
  rotation?: number;    // Degrees
  flipX?: boolean;
  flipY?: boolean;
  zoom?: number;
  scaleX?: number;      // Horizontal stretch
  scaleY?: number;      // Vertical stretch
}

interface Calibration {
  offsetX: number;      // -1 to 1
  offsetY: number;      // -1 to 1
  scale: number;        // 0.5 to 2
}
```

---

## Dependencies

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS 4** - Styling
- **Chart.js + react-chartjs-2** - Tilt graph
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time connection to Python backend

---

## Development

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run lint     # Run ESLint
```

---

## Technical Notes

### Ghost Teammate Logic
1. On C9 death, clear all ghosts first
2. Find nearest C9 teammate
3. If distance > 2000 units, create ghost at optimal position
4. Ghost position = death + (direction to teammate) × 1600 units
5. Auto-clear after 3 seconds via setTimeout

### Panic Utility Detection
1. Track all C9 ability usage via `ability_used` event
2. On C9 death, check abilities used within 2 seconds
3. Record as panic utility event
4. Display per-player breakdown and insights
