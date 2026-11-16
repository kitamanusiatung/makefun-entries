# VOID SIEGE

Tower defense game for the browser. Pure vanilla JS, one page, no dependencies, no build step.

## How to play
Open index.html in Chrome (or any desktop browser). Click the VOID SIEGE title to start.

- Pick a tower at the bottom bar (or keys 1-4): PEW (fast), BLAST (splash), FROST (slows), RAIL (sniper).
- Click empty ground to place. Click a tower then UPGRADE to improve it, or SELL for 70% back.
- Survive 15 waves. Every 5th wave brings a boss. Leaks cost lives; at 0 lives the void wins.
- P pauses.

## Features
- 4 tower types with distinct roles, upgrades, selling, gold economy.
- 3 enemy types + bosses, wave scaling, wave-clear bonus.
- WebAudio sound effects (shoot, explosion, build, hurt, victory) and a simple background sequence.
- Particles, screen shake, damage flash, floating bounty text, animated dashed path.
- HUD (gold, wave, lives, score), start/restart, pause, win/lose states.
- `index.html?demo=1` autoplay mode used to capture mid-game screenshots.

## Files
- index.html (page, HUD, tower bar)
- js/engine.js (game: loop, pathing, towers, enemies, fx, audio)
- shots/ (screenshots: menu, mid-game, boss wave)
