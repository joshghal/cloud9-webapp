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
│   │   │   └── TiltGraph.tsx # THE MONEY SHOT - trade time visualization
│   │   ├── panels/
│   │   │   └── Scoreboard.tsx
│   │   ├── alerts/
│   │   │   └── TimeoutAlert.tsx
│   │   └── map/              # TODO: Map visualization
│   ├── hooks/
│   │   └── useSocket.ts      # Socket.IO connection to Python backend
│   └── types/
│       └── index.ts          # TypeScript types matching Python backend
└── public/
    └── maps/                 # TODO: VALORANT map images
```

---

## Features

### Implemented
- [x] Socket.IO connection to Python backend
- [x] Scoreboard with live score, momentum, win probability
- [x] Tilt Graph (animated Chart.js) - trade time visualization
- [x] Timeout Alert cards with AI insights
- [x] Cloud9 brand theme (dark mode)
- [x] Framer Motion animations

### Week 1 TODO
- [ ] Map Visualization - Deaths as dots on 2D maps
- [ ] Trade Web - Lines between players showing trade coverage
- [ ] Map images for Lotus, Haven, Ascent, etc.

### Week 2 TODO
- [ ] Kill Feed Animation - Sequential death replay
- [ ] Win Probability Dial - Animated gauge
- [ ] Ghost Teammates - "Should be" positions

### Week 3 TODO
- [ ] Alert Full-Screen Mode
- [ ] Post-Match Analysis View
- [ ] Recording Mode for demo video

---

## Environment Variables

Create `.env.local`:
```
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

---

## Dependencies

- **Next.js 15** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Chart.js + react-chartjs-2** - Tilt graph
- **Framer Motion** - Animations
- **Socket.IO Client** - Real-time connection to Python backend

---

## Connection to Backend

The frontend connects to the Python Flask backend via Socket.IO:

**Events received:**
- `round_update` - Live round data (score, tilt, momentum)
- `timeout_alert` - Timeout recommendations
- `kill_event` - Kill feed updates
- `replay_complete` - Match summary with spatial data

**Events sent:**
- `start_replay` - Start match replay
- `stop_replay` - Stop replay
- `change_speed` - Change replay speed

---

## Development

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run lint     # Run ESLint
```
