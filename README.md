# FreeDAW

[![Sponsor](https://img.shields.io/badge/sponsor-%E2%9D%A4-ea4aaa?logo=githubsponsors&logoColor=white)](https://github.com/sponsors/campos20)

[![CI](https://img.shields.io/github/actions/workflow/status/campos20/freedaw/ci.yml?branch=main&label=CI)](https://github.com/campos20/freedaw/actions/workflows/ci.yml)
[![Pages](https://img.shields.io/github/actions/workflow/status/campos20/freedaw/pages.yml?branch=main&label=pages)](https://campos20.github.io/freedaw/)
[![Release](https://img.shields.io/github/v/release/campos20/freedaw?include_prereleases&sort=semver&label=release)](https://github.com/campos20/freedaw/releases/latest)
[![License](https://img.shields.io/badge/license-GPL--3.0--or--later-blue)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)](https://campos20.github.io/freedaw/)
[![Rust](https://img.shields.io/badge/Rust-1.88%2B-000000?logo=rust&logoColor=white)](https://www.rust-lang.org/)
[![Tauri](https://img.shields.io/badge/Tauri-v2-24C8DB?logo=tauri&logoColor=white)](https://v2.tauri.app/)

A free DAW with graphical, note-level pitch and timing editing ("Tune"), in the spirit of existing
pitch-alignment software. It is built from one codebase in two editions:

- **Web edition**: runs in the browser (Chromium first). Web Audio, AudioWorklet + WASM engine.
- **Desktop edition**: Tauri v2 app for Windows, macOS and Linux. Native drivers (ASIO, WASAPI,
  CoreAudio, ALSA/JACK); VST3 and CLAP plugin hosting later on.

All DSP lives in Rust crates that compile to both WebAssembly and native code. See
[AGENTS.md](AGENTS.md) for the architecture, conventions and roadmap.

**Status:** M5 in progress: mixer, built-in effects and automation, on top of Tune (M4),
recording (M3, pending hardware checks), the arrange view and projects.

## Using it

- **Import audio:** drop files on the timeline (onto a track, or below the tracks for new ones) or
  use **Import…**. WAV, FLAC, MP3, OGG Vorbis and M4A/AAC are supported.
- **Edit clips:** drag to move (also across tracks), drag the edges to trim, drag the small handles
  at the top corners for fades, Alt-drag vertically for clip gain. Edits snap to the visible grid;
  hold ⌘/Ctrl while dragging to bypass.
- **Record:** arm a track (●), choose its input in the track's ⋯ menu, then press Record (R).
  The ▾ next to Record sets the count-in and punch (record only inside the loop region). Takes
  become clips, compensated for the round-trip latency.
- **Tune:** double-click an audio clip to open it in the Tune editor (bottom pane). FreeDAW
  detects its notes, key and tempo. Drag notes up or down to change pitch (snaps to semitones;
  hold Alt for free pitch), sideways to move them, and drag their edges to stretch. Double-click
  splits a note. Box-select or Shift-click to select several. The side panel holds the scale,
  auto-correct (pitch center, drift, vibrato), timing quantize to the project tempo, per-selection
  drift and vibrato, reset, and an A/B switch to compare with the original. Arrow keys move the
  selection by a semitone (Shift: an octave). Edits are undoable and saved with the project; only
  the edited regions are re-rendered.
- **Mix:** **Mixer** (X) opens a channel strip per track plus the master: fader, pan, meters,
  mute/solo, output routing, sends and an insert chain. Built-in effects: EQ (8 bands),
  compressor, gate, limiter, delay, reverb, chorus, saturation and utility. Click an effect to
  edit it (the EQ has a draggable curve); **+ Bus** adds a bus to send or route tracks to.
- **Automation:** in a track's ⋯ menu, **Show automation** opens a lane for volume, pan, a send
  or an effect parameter (or use the **A** button next to a parameter). Click to add points,
  drag them, double-click or Alt-click to delete.
- **Devices and latency:** ⚙ opens the audio settings. Calibrate with a cable from an output to
  an input: FreeDAW plays its metronome, records it back and measures the delay. On desktop,
  `cargo run --release -p engine-native --example soak -- --buffer 128 --minutes 10 --input default`
  checks for dropouts.
- **Projects** save automatically. The project name menu (top left) creates, renames, opens,
  deletes, exports and imports projects (`.freedaw` files carry the project and its audio; `.tessera`
  files from before the rename still import).

| Shortcut                         | Action                                                       |
| -------------------------------- | ------------------------------------------------------------ |
| Space                            | Play / pause                                                 |
| Home / Enter, End                | Go to start / end                                            |
| S                                | Split selected clips (or the selected track) at the playhead |
| ⌘/Ctrl D                         | Duplicate selected clips                                     |
| Delete / Backspace               | Delete selected clips, or the selected track                 |
| ⌘/Ctrl Z, ⇧⌘/Ctrl Z              | Undo, redo                                                   |
| ⌘/Ctrl A, Esc                    | Select all clips, clear selection                            |
| L, C, N                          | Loop, metronome, snap                                        |
| X                                | Show / hide the mixer                                        |
| + / −, ⌘/Ctrl-scroll or pinch    | Zoom                                                         |
| Shift-scroll or horizontal swipe | Scroll the timeline                                          |

## Prerequisites

- Rust via [rustup](https://rustup.rs). `rust-toolchain.toml` pins stable plus the
  `wasm32-unknown-unknown` target, `rustfmt` and `clippy`.
- Node.js 22+ and pnpm (the version is pinned in `package.json` → `packageManager`).
- Desktop edition: the [Tauri v2 system prerequisites](https://v2.tauri.app/start/prerequisites/)
  for your OS. On Linux you also need `libasound2-dev`.

```sh
pnpm install
```

## Commands

| Command                  | What it does                                                                  |
| ------------------------ | ----------------------------------------------------------------------------- |
| `pnpm dev:web`           | Builds `engine.wasm`, then starts the web edition at http://localhost:5173    |
| `pnpm dev:desktop`       | Runs the desktop edition (Tauri dev, hot reload)                              |
| `cargo test --workspace` | Rust tests (engine-core includes an `assert_no_alloc` test of the audio path) |
| `pnpm test`              | Builds `engine.wasm`, runs Vitest (including tests against the real module)   |
| `pnpm e2e`               | Playwright (Chromium) against the production web build                        |
| `pnpm e2e:pages`         | Same, served as on GitHub Pages (sub-path, no COOP/COEP headers)              |
| `pnpm lint`              | ESLint + Prettier check                                                       |
| `pnpm typecheck`         | `tsc` in every package                                                        |
| `pnpm gen:schema`        | Regenerates `packages/schema/src/generated` from the Rust protocol types      |
| `pnpm build:web`         | Production web build in `apps/web/dist`                                       |
| `pnpm build:desktop`     | Desktop installers via `tauri build`                                          |

Optional desktop audio hosts are Cargo features of `engine-native`, forwarded by the desktop app:

- `asio` (Windows): needs the ASIO SDK (`CPAL_ASIO_DIR`) and LLVM/clang at build time.
- `jack` (Linux): JACK, including PipeWire through its JACK layer.

For example: `pnpm --filter @freedaw/desktop tauri dev --features asio`.

## Layout

```
crates/engine-core     platform-agnostic engine: mixer, built-in effects, automation, protocol; no I/O
crates/engine-wasm     raw C-ABI WASM build of engine-core, run inside the AudioWorklet
crates/engine-native   cpal input/output, device settings, take recorder, file import (desktop)
crates/media           decoding (WAV, FLAC, MP3, OGG Vorbis, AAC/M4A), resampling, waveform peaks
crates/worker-wasm     raw C-ABI WASM for the web worker: decoding, project loading, archives
crates/tune            Tune DSP: pitch analysis, notes, key/tempo, PSOLA rendering, render plans
crates/project         project model, schema versions and migrations, .freedaw archives
crates/plugin-host     VST3/CLAP hosting (M7)
apps/web               Vite app using WebPlatform
apps/desktop           Tauri v2 app using TauriPlatform (Rust backend in src-tauri/)
packages/platform      AudioPlatform interface + WebPlatform + TauriPlatform
packages/ui            shared React UI (arrange view, store, engine sync); talks only to AudioPlatform
packages/schema        TS types generated from Rust (never hand-edit src/generated)
```

## Web hosting

The web edition uses `SharedArrayBuffer`, so every response must be served with these headers:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

The Vite dev and preview servers already send them. The status panel shows
`crossOriginIsolated: true` when they are in effect.

### GitHub Pages

`.github/workflows/pages.yml` deploys the web edition on every push to `main` (or manually from the
Actions tab) to `https://<owner>.github.io/<repo>/`. One-time setup: **Settings → Pages → Source:
GitHub Actions**.

GitHub Pages can't send custom headers. Instead, `apps/web/public/coi-sw.js` is a service worker
that adds them: on the first visit the page installs it and reloads once. Build with
`BASE_PATH=/<repo>/` for sub-path hosting; `pnpm e2e:pages` tests this setup locally.

## Sponsor

[![Sponsor via GitHub Sponsors](https://img.shields.io/badge/GitHub%20Sponsors-%E2%9D%A4-ea4aaa?logo=githubsponsors&logoColor=white&style=for-the-badge)](https://github.com/sponsors/campos20)

FreeDAW is free and GPL-licensed, and it stays that way. If it earns a place in your studio,
sponsorship helps in one concrete way right now: **code-signing certificates**. They are what turn
the desktop builds into signed installers that macOS and Windows open without security warnings.

You can also sponsor from the **Sponsor** button at the top of the
[repository page](https://github.com/campos20/freedaw).

Not in a position to sponsor? Reporting a bug from a real session is worth a lot too.

## License

FreeDAW is free software, licensed under the **GNU General Public License v3.0 or later**. See
[LICENSE](LICENSE).

GPLv3 is required for the desktop edition's ASIO support: Steinberg's ASIO SDK is available under
GPLv3 or a proprietary agreement. The VST3 SDK is MIT-licensed since v3.8.

See also the [Privacy Policy](https://campos20.github.io/freedaw/privacy-policy.html) and the
[Terms of Use](https://campos20.github.io/freedaw/terms-of-use.html) (sources in [docs/](docs/)).
