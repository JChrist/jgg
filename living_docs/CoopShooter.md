# CoopShooter

**Status:** Living document. Updated at the end of every task.
**Started:** 2026-08-02
**Owner:** jchrist
**Planning doc:** n/a
**Companion docs:** `living_docs/CoopShooterArchitecture.md` (final task 5.1)

---

## 1. Phase / Task tracker

| Phase | Task | Title | Size | Status | Notes |
|------:|----:|-------|:----:|--------|-------|
| 1 | 1.1 | Scaffold Vite + Phaser 3 project, blank scene boots, GitHub repo created | S | 🟢 done | Repo `JChrist/jgg` (private) created with `gh repo create`; plain JavaScript, no TypeScript |
| 1 | 1.2 | Player control: move (WASD), shoot (Space), one gun with ammo/reload | M | 🟢 done | Shot travels in the facing direction (last movement direction) — no mouse, no aiming keys; see §5 control decision |
| 1 | 1.3 | Basic enemy: chases player, contact damage, dies to bullets | M | ⚪ not started | |
| 1 | 1.4 | Procedural arena: walls/obstacles + safe spawn points | M | ⚪ not started | Generation must never produce unreachable pickups or blocked spawns |
| 1 | 1.5 | HUD (health, ammo) + game over / restart flow | S | ⚪ not started | |
| 2 | 2.1 | Second player input (arrows + other keys); input behind a controller interface | M | ⚪ not started | The upgrade hook: local keyboard is one implementation of `PlayerController`, so a future network player is a second implementation |
| 2 | 2.2 | Split screen: two cameras + per-player HUD | M | ⚪ not started | Must hold 60 fps on a typical laptop |
| 2 | 2.3 | Co-op rules: shared level, spawns, death/revive handling | S | ⚪ not started | |
| 3 | 3.1 | Two more enemy types (rusher, shooter) | M | ⚪ not started | |
| 3 | 3.2 | Wave spawning with pacing | M | ⚪ not started | |
| 4 | 4.1 | Endless progression: enemy count/health/speed scale per level | M | ⚪ not started | The difficulty-scaling requirement from the original request |
| 4 | 4.2 | Score + wave counter | S | ⚪ not started | |
| 5 | 5.1 | Architecture companion doc `living_docs/CoopShooterArchitecture.md` | S | ⚪ not started | As-built: cameras, controller interface, generation, game loop |

**Legend:** ⚪ not started · 🟡 working · 🟢 done · 🔴 blocked / needs decision
**Size:** XS · S · M · L · XL (never days or weeks).

One task = one row = one reviewable step. Mark a row 🟡 working before you start it and 🟢 done when it's complete.

Task naming convention: `Task <phase>.<sub> — <short imperative title>`. If you open a commit for a task, mirror that title.

---

## 2. Goal

A web-based 2D co-op shooter where each player controls a character with a gun, clearing auto-generated levels of increasing difficulty. V1 is the narrow MVP: one player first, then local split-screen co-op for two players on one machine, a small set of enemy types, and endless scaling difficulty. Solo play is fully supported. It runs in a desktop browser with a keyboard. Nothing here may block a later "online co-op" upgrade: player input lives behind an interface, and split-screen rendering stays separate from game logic.

"Done" for V1: two players, or one player, can launch the game in a browser, fight through a generated arena with waves of enemies that get harder each level, see their health/ammo and score, die, and restart.

---

## 3. Architecture / approach

The committed approach, from the stage-3 decision:

- **Phaser 3** game framework (scenes, cameras, input, physics), **plain JavaScript** (no TypeScript), **Vite** dev server and bundler.
- **Split screen** = one Phaser camera per player, each rendering its own viewport. Solo = one camera, full screen.
- **Upgrade hook (framing decision):** all player input goes through a `PlayerController` interface. Local keyboard is one implementation. A future online player (V1.1, deferred) would be a second implementation, e.g. network-driven. Cameras/renderers must not be entangled with input code so the split-screen view can later be replaced with remote views.
- **Procedural arena generation** in a dedicated module; must guarantee safe spawn points and no unreachable regions (SLO: a player must never spawn inside a wall or be unable to reach the level content).
- **Difficulty scaling** (task 4.1): per-level tuning of enemy count, health, speed.
- **Performance SLO:** steady 60 fps with two viewports on a typical laptop. A dev-only FPS counter/debug overlay is the observability story.
- **No backend:** no network, no accounts, no PII. Rollback is plain git reverts, no migrations.

Invariants to preserve as the design evolves:
1. Game logic never talks to input devices directly — only through `PlayerController`.
2. Generation guarantees reachability and safe spawns.
3. HUD/UI is per-player in co-op.

---

## 4. Future work / out-of-scope

| Item | Status | Why |
|------|--------|-----|
| Online co-op (network players) | V1.1 backlog | Explicitly enabled by the `PlayerController` interface and renderer separation; networking itself is a large scope on its own |
| More guns / weapon pickups | V1.1 backlog | Narrow MVP has one gun; weapon variety was cut from the thorough scope |
| Sound and music | V1.1 backlog | Cut from narrow MVP; polish layer |
| Effects polish (particles, screen shake) | V1.1 backlog | Cut from narrow MVP; effects come with sound |
| Gamepad support | V1.1 backlog | Keyboard only in V1 |
| Persistent high scores | Out of scope | No backend, no storage in V1; score is session-only |
| Mobile / touch | Out of scope | Keyboard-first design; no touch input planned |

---

## 5. Decision log

### 2026-08-02 — Facing-based shooting, keyboard only

**Decision:** No mouse aiming anywhere. The gun fires in the player's facing direction, which is the last nonzero movement direction (8-directional). P1 controls: WASD move, Space shoot, R reload. The same scheme will apply to player 2 in phase 2 with a separate key set.

**Why:** A split screen has two players but only one mouse — mouse aiming cannot work for both. Keyboard-only controls keep solo and co-op identical, so phase 2 needs no control redesign. Facing-based shooting chosen over 8-direction aiming keys and rotate-aim (Q/E) for simplicity; the user chose "movement and shoot, shot goes in front".

**Alternatives considered:**
- 8-direction aim keys (arrows) — precise, but leaves player 2 with a crowded key layout.
- Auto-aim at nearest enemy — simple, but shooting direction is dictated by enemies; facing-based keeps control with the player.
- Rotate-aim (Q/E) — slow aiming under pressure.

### 2026-08-02 — Local-first, upgradeable-to-online framing

**Decision:** Build couch co-op (one machine, split screen) now, but design player input behind a `PlayerController` interface and keep rendering decoupled, so an online layer can be added later without a rewrite.

**Why:** The user's stated requirement: focus on local co-op, do not block later "upgrades" to online play. The interface is cheap now (one extra abstraction) and expensive to retrofit later.

**Alternatives considered:**
- Pure local, no abstraction — least structure, but retrofit cost later.
- Online-first with rooms/host authority — much larger scope (networking, sync, anti-cheat, hosting), rejected.

### 2026-08-02 — Narrow MVP scope

**Decision:** V1 = narrow MVP: one gun, one arena pattern, 3 enemy types, keyboard input, basic HUD, game over/restart, then co-op split screen, then scaling difficulty. Weapon variety, sound, particles, gamepad, and persistence are deferred (see §4).

**Why:** Build the smallest end-to-end game that proves the feel, then grow it. The thorough and strategic scopes were considered and rejected as premature for a first build.

### 2026-08-02 — Phaser 3 + plain JavaScript + Vite

**Decision:** Use the Phaser 3 game framework with plain JavaScript, bundling via Vite.

**Why:** Avoids hand-rolling (and untested) engine code — scenes, cameras, input, and physics come proven from the framework. Plain JavaScript chosen over TypeScript by user preference. Vite is the standard dev server/bundler for Phaser.

**Alternatives considered:**
- Vanilla JS + Canvas 2D — zero dependencies and full control, but every engine concern (loop, camera, input, collision) hand-written and untested; rejected.
- PixiJS + own logic — WebGL rendering, but a second rendering path and more complexity than the narrow MVP needs; rejected.

### 2026-08-02 — Vertical slice, solo first

**Decision:** Build an end-to-end solo slice first (player, one enemy, generated arena, HUD, game over), then layer co-op split screen, then enemy variety, then difficulty scaling.

**Why:** A thin vertical line demos value from the first phase; co-op and generation build on a proven solo core. Risk-first (two cameras with placeholder gameplay first) and co-op-first slicing were considered; co-op-first widens the first review too much for a narrow MVP.

### 2026-08-02 — Repository on GitHub via gh CLI

**Decision:** Create the repository under the user's GitHub account JChrist using `gh repo create` (ssh protocol) at scaffold time (task 1.1); commit boundaries belong to the user per task.

**Why:** User's explicit instruction to use gh cli for GitHub interactions.

### 2026-08-02 — Security/privacy scope

**Decision:** No network, no accounts, no PII anywhere in V1; nothing to secure beyond ordinary code hygiene.

**Why:** Single-machine browser game, no backend. Flagged and confirmed with the user during exploration.

---

## 6. Open questions

_None._

---

## 7. Lessons learned

- The Vite scaffold's `--overwrite` flag deletes the target directory contents, which silently removed the untracked `living_docs/` folder. The doc had to be restored from session memory. Next time: create the git repo and commit the living doc before scaffolding anything into the project directory.
