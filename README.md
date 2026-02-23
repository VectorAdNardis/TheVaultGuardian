# The Vault Guardian — Shadow Attack Simulator

A fast, kiosk-friendly web game for tradeshow screens that educates about Shadow IT and Shadow AI risks while mapping defenses to LastPass Business Max capabilities.

## Quick Start

1. **Double-click `index.html`** in any modern browser (Chrome, Firefox, Edge, Safari).
2. That's it. No build tools, no server, no install.

> For best results use Chrome or Edge fullscreen (F11) on a 1920×1080 or 4K display.

## How to Play

- **Aim**: Move mouse / touch to aim from the vault core outward.
- **Shoot**: Click, tap, or press Space to fire.
- **Keyboard aim**: WASD or arrow keys to rotate aim direction.
- **Power-ups**: Shoot the floating "chip" pickups to activate defensive tools.
- **Goal**: Survive 5 waves and protect the vault's integrity.

## Power-ups (Mapped to LastPass Capabilities)

| Power-Up | Effect | Duration |
|---|---|---|
| **Strong Password** | Twin beams (split shot) | 10s |
| **MFA** | Persistent laser line | 8s |
| **SSO** | Shotgun cone burst | 8s |
| **Password Manager** | Expanding ring shockwave | 7s |
| **IT Admin Dashboard** | Slows all enemies 35% | 10s |

## Scoring & Ranks

- +10 per threat neutralized
- +5 bonus while a power-up is active
- +1 per second remaining on victory

| Score | Rank |
|---|---|
| 0–149 | Novice |
| 150–299 | Analyst |
| 300–449 | Guardian |
| 450–649 | Sentinel |
| 650+ | Zero-Knowledge Master |

## Configuration

Edit **`config/game-config.json`** to tweak:

### Difficulty
- `durationSeconds` — Total game length (default: 75)
- `waves[].spawnInterval` — Seconds between enemy spawns per wave (lower = harder)
- `waves[].speedMultiplier` — Enemy speed multiplier per wave
- `baseEnemySpeed` — Base movement speed in px/s at 1920 width

### Pickup Rates
- `pickupSpawnInterval` — Base seconds between pickup spawns (default: 9)
- `pickupSpawnVariance` — Random +/- variance on spawn timing
- `powerups[].rarity` — Relative weight (higher = more common)
- `maxActivePowerups` — Max simultaneous weapon power-ups

### Brand & Visuals
- `brandColors` — `red`, `dark`, `accent`, `bg` (CSS color strings)
- `colorBlindMode` — Enable high-contrast palette + shape patterns
- `reducedMotion` — Disable animations

### Rank Thresholds
- `rankThresholds[]` — Array of `{ min, rank }` objects

## Demo Mode

Add `?demo=1` to the URL:

```
index.html?demo=1
```

This will:
- Shorten waves to 5 seconds each
- Increase pickup spawn rate
- Slightly reduce enemy speed
- Log events to the browser console

## Booth Staff Controls

- **Clear leaderboard**: Long-press (3 seconds) the invisible zone in the bottom-left corner of the screen.
- **Sound**: Click "Sound: Off" button to toggle audio (off by default).
- **Accessibility**: Use "Hi-Contrast" and "Reduce Motion" buttons in the bottom-right.

## Leaderboard

- Top 10 scores stored in `localStorage`
- "Today" and "All-Time" tabs
- Players enter 3-letter initials (auto-saves as "GST" after 5s idle)
- Data persists across browser sessions on the same machine

## File Structure

```
Defend The Vault/
├── index.html                  # Entry point
├── README.md                   # This file
├── config/
│   └── game-config.json        # All tunable parameters
├── css/
│   └── styles.css              # HUD + overlay styling
└── js/
    ├── main.js                 # Game loop, audio, orchestration
    ├── engine/
    │   ├── renderer.js         # Canvas 2D drawing
    │   └── input.js            # Mouse, touch, keyboard
    ├── game/
    │   ├── state.js            # State machine (ATTRACT/PLAYING/PAUSED/SUMMARY)
    │   ├── entities.js         # Vault, threats, pickups, projectiles, effects
    │   ├── scoring.js          # Points, kills, ranks
    │   ├── collisions.js       # Circle/line collision detection
    │   └── spawner.js          # Wave progression + pickup spawns
    └── ui/
        ├── hud.js              # In-game HUD updates
        ├── leaderboard.js      # localStorage leaderboard
        └── screens.js          # Attract, tutorial, summary, initials
```

## Technical Notes

- **60fps target** using `requestAnimationFrame` with delta-time capping.
- **No external dependencies** — pure HTML/CSS/JS with Canvas 2D.
- **No network calls** — fully offline, no tracking, no PII.
- **Scales** from 1920×1080 to 4K; uses `devicePixelRatio` (capped at 2×).
- **Audio**: WebAudio API synthesized tones — no external sound files.
- **Kiosk safety**: 20s idle auto-resets to attract mode; 15s summary auto-resets.

## Browser Support

- Chrome 80+ (recommended)
- Firefox 78+
- Safari 14+
- Edge 80+
