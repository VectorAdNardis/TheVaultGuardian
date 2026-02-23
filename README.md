# The Vault Guardian

A fast-paced, arcade-style web game that teaches password security through gameplay. Defend your vault against waves of cyber threats using real-world security tools as weapons.

Built as a kiosk-friendly experience for tradeshow screens, mapping each defensive power-up to real password management and security capabilities.

## Play It

**[Play The Vault Guardian](https://vectoradnardis.github.io/TheVaultGuardian/)**

Or run it locally: double-click `index.html` in any modern browser. No build tools, no server, no install.

## Why Password Management Matters

Every 39 seconds, a cyberattack targets someone online. Over 80% of data breaches involve weak, reused, or stolen passwords. The threats in this game represent real attack vectors that organizations face daily:

- **Bad Passwords** — "123456" and "password" are still the most common credentials. Weak passwords are the easiest entry point for attackers.
- **Phishing Attacks** — Deceptive emails and fake login pages trick users into handing over credentials. Even trained employees fall for sophisticated phishing.
- **Shadow IT** — Unauthorized apps and services create blind spots in your security. If IT doesn't know about it, IT can't protect it.
- **Third-Party Risks** — Vendors and integrations with access to your systems expand the attack surface beyond your direct control.
- **Hackers** — Determined attackers exploit every weakness. Without layered defenses, it's only a matter of time.

A password manager eliminates the root cause of most breaches: human password behavior. It generates unique, complex passwords for every account, stores them securely, and autofills them — so users never reuse, forget, or write down passwords again.

Combined with MFA, SSO, and SaaS monitoring, organizations can build a defense-in-depth strategy that mirrors exactly what this game teaches through play.

## How to Play

- **Aim**: Move mouse or touch to aim from the vault outward
- **Shoot**: Click, tap, or press Space to fire
- **Keyboard aim**: WASD or arrow keys to rotate aim direction
- **Power-ups**: Shoot the floating chip pickups to collect weapons
- **Activate**: Press 1–5 or click the weapon bar to equip
- **Goal**: Survive 5 waves (2.5 minutes) and protect the vault's integrity

## Weapons & Power-Ups

Each weapon maps to a real security capability. Stronger weapons deal more damage per hit:

| Key | Weapon | Effect | Damage | Real-World Defense |
|-----|--------|--------|--------|--------------------|
| 1 | **Strong Password** | Hold-to-fire twin beams | 2x | Unique, complex passwords as first line of defense |
| 2 | **SSO** | Persistent laser beam | 3x | One secure login for all apps, reducing attack surface |
| 3 | **Multi-Factor Auth** | Shotgun cone burst (7 beams) | 4x | Blocks 99.9% of automated attacks, even with stolen passwords |
| 4 | **Password Manager** | Expanding ring shockwave | 5x | Eliminates password reuse, the #1 cause of breaches |
| 5 | **SaaS Monitoring** | Slows all enemies 35% | — | Reveals Shadow IT and enforces security policies |

Without a power-up, you fire a single beam at 1x damage.

## Enemies

Threats escalate across 5 waves, introducing tougher enemies as the game progresses:

| Threat | HP | Damage | Speed | First Appears |
|--------|----|--------|-------|---------------|
| Bad Password | 1 | 6 | Fast | Wave 1: Recon |
| Phishing | 2 | 9 | Fast | Wave 2: Infiltration |
| Shadow IT | 3 | 8 | Medium | Wave 3: Escalation |
| Third Party | 4 | 12 | Slow | Wave 4: Assault |
| Hacker | 5 | 15 | Slow | Wave 5: Full Breach |

## Scoring & Ranks

- **+1 point** per threat neutralized
- **+1 per second** remaining at victory

| Score | Rank |
|-------|------|
| 0–49 | Novice |
| 50–99 | Analyst |
| 100–149 | Guardian |
| 150–219 | Sentinel |
| 220+ | Zero-Knowledge Master |

## Leaderboard

- Top 10 scores stored in `localStorage`
- "Today" and "All-Time" tabs
- Players enter 3-letter initials (auto-saves as "GST" after 5s idle)
- Kill breakdown by enemy type shown alongside scores
- Data persists across browser sessions on the same machine

## Configuration

Edit **`config/game-config.json`** to tune difficulty, spawn rates, brand colors, and rank thresholds. Key parameters:

- `durationSeconds` — Total game length (default: 150)
- `waves[].spawnInterval` — Seconds between spawns per wave
- `waves[].speedMultiplier` — Enemy speed scaling per wave
- `pickupSpawnInterval` — Base seconds between pickup spawns
- `rankThresholds[]` — Score thresholds for each rank
- `brandColors` — Accent colors for the UI

## Demo Mode

Add `?demo=1` to the URL for a quick walkthrough:

```
index.html?demo=1
```

Shortens waves to 5 seconds, increases pickups, and logs events to console.

## Booth Staff Controls

- **Clear leaderboard**: Long-press (3 seconds) the invisible zone in the bottom-left corner
- **Sound**: Click "Sound: Off" button to toggle audio
- **Skip to end**: Shift+W (win) or Shift+L (lose) for testing

## File Structure

```
TheVaultGuardian/
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

- **60fps target** using `requestAnimationFrame` with delta-time capping
- **No external dependencies** — pure HTML/CSS/JS with Canvas 2D
- **No network calls** — fully offline, no tracking, no PII
- **Scales** from 1920x1080 to 4K; uses `devicePixelRatio` (capped at 2x)
- **Audio**: WebAudio API synthesized tones — no external sound files
- **Kiosk safety**: 20s idle auto-resets to attract mode; 15s summary auto-resets

## Credits

Created by [David Contreras](https://davidcontreras.xyz)
