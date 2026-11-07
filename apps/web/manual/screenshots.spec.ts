// Builds a small song in the real app and screenshots each part of the UI for the user manual.
// Run with `pnpm manual:screenshots`; images go to docs/manual/images/<locale>/.
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { expect, type Locator, type Page, test } from "@playwright/test";
import { en } from "../../../packages/ui/src/i18n/locales/en";
import { LOCALES } from "../../../packages/ui/src/i18n/locales";

const SAMPLE_RATE = 44_100;
const BPM = 120;
const SECONDS = 12;
/** Default zoom: 1200 project frames (48 kHz) per px. The vocal clip is moved half a bar (40 px). */
const CLIP_X = 40;
const CLIP_W = (SECONDS * 48_000) / 1200;

test("manual screenshots", async ({ page }, info) => {
  const locale = info.project.name;
  const out = fileURLToPath(new URL(`../../../docs/manual/images/${locale}/`, import.meta.url));
  mkdirSync(out, { recursive: true });
  /** UI text in the screenshot's language (buttons are found by their visible names). */
  const t = (key: string) =>
    lookup(LOCALES.find((l) => l.code === locale)?.messages, key) ?? lookup(en, key)!;
  const shot = async (name: string, target?: Locator | Locator[], margin = 12) => {
    await expect(page.getByTestId("save-state")).toHaveText(t("footer.saved"));
    await screenshot(page, out + name, target, margin);
  };

  await page.goto("./");
  await page.waitForFunction(() => globalThis.crossOriginIsolated === true);
  await expect(page.getByTestId("save-state")).toHaveText(t("footer.saved"));

  // Getting started: the empty project.
  await shot("first-launch.png");

  // Name the project and import three stems.
  await page.locator(".project-button").click();
  await page.getByLabel(t("project.nameLabel")).fill("My Song");
  await page.getByLabel(t("project.nameLabel")).press("Enter");
  await page.getByTestId("import").setInputFiles([
    { name: "Vocal.wav", mimeType: "audio/wav", buffer: wav(vocal()) },
    { name: "Bass.wav", mimeType: "audio/wav", buffer: wav(bass()) },
    { name: "Drums.wav", mimeType: "audio/wav", buffer: wav(drums()) },
  ]);
  await expect(page.locator("[data-testid^=track-header-]")).toHaveCount(3);
  await expect(page.getByTestId("busy")).toHaveCount(0);

  const lanes = page.locator("canvas[data-testid^=lane-]:not([data-testid^=lane-automation])");
  const headers = page.locator("[data-testid^=track-header-]");

  // Move the vocal one bar later, select it and put the playhead in the middle.
  const vocalLane = lanes.first();
  const box = (await vocalLane.boundingBox())!;
  await page.mouse.move(box.x + 60, box.y + 50);
  await page.mouse.down();
  await page.mouse.move(box.x + 100, box.y + 50, { steps: 5 });
  await page.mouse.up();
  await page.getByTestId("ruler").click({ position: { x: 260, y: 15 } });
  await page.mouse.click(box.x + 200, box.y + 50);

  // Interface tour, with numbered callouts.
  await annotate(page, [
    [page.locator(".project-button"), 1],
    [page.locator(".transport-controls"), 2],
    [page.getByTestId("position"), 3],
    [page.locator(".tempo-group"), 4],
    [page.locator(".view-group"), 5],
    [page.locator(".arrange .corner"), 6],
    [page.getByTestId("ruler"), 7],
    [headers.first(), 8],
    [vocalLane, 9],
    [page.locator(".status-bar"), 10],
  ]);
  await shot("interface.png");
  await clearAnnotations(page);
  await shot("arrange.png");

  // Clip handles: the parts of a clip you can drag.
  const c = { x: box.x + CLIP_X, y: box.y + 2, w: CLIP_W, h: box.height - 4 };
  await annotatePoints(page, [
    [c.x + c.w / 2, c.y + c.h / 2, 1],
    [c.x, c.y + c.h * 0.65, 2],
    [c.x + c.w, c.y + c.h * 0.65, 3],
    [c.x + 6, c.y + 4, 4],
    [c.x + c.w - 6, c.y + 4, 5],
  ]);
  await shot("clip.png", page.locator(".track-group").first(), 14);
  await clearAnnotations(page);

  // Project menu.
  await page.locator(".project-button").click();
  await shot("project-menu.png", [page.locator(".project-button"), page.locator(".project-menu .menu")], 16);
  await page.keyboard.press("Escape");
  await page.mouse.click(700, 600);

  // Recording: arm the vocal track, open the track menu and the recording options.
  await headers
    .first()
    .getByRole("button", { name: t("track.arm") })
    .click();
  await expect(page.getByTestId(/^input-meter-/).first()).toBeVisible();
  await headers
    .first()
    .getByRole("button", { name: t("track.options") })
    .click();
  await shot("track-menu.png", page.locator(".track-menu"), 16);
  await page.mouse.click(700, 600);
  await page.getByRole("button", { name: t("recordOptions.label") }).click();
  await shot("record-options.png", page.locator(".record-options .popover"), 16);
  await page.mouse.click(700, 600);
  await shot("armed-track.png", headers.first(), 8);
  await headers
    .first()
    .getByRole("button", { name: t("track.arm") })
    .click();

  // Automation: a volume lane with a fade-in shape on the vocal.
  await headers
    .first()
    .getByRole("button", { name: t("track.options") })
    .click();
  await page.getByLabel(t("track.showAutomation")).selectOption({ label: t("automation.volume") });
  const lane = page.locator("[data-testid^=lane-automation-]").first();
  await expect(lane).toBeVisible();
  const laneBox = (await lane.boundingBox())!;
  // Pull the volume down under bars 3–4, then back up.
  for (const [x, y] of [
    [140, 14],
    [180, 38],
    [300, 38],
    [340, 14],
  ] as const) {
    await page.mouse.click(laneBox.x + x, laneBox.y + y);
  }
  await shot("automation.png", page.locator(".track-group").first(), 0);

  // Mixer: a bus with a reverb, a send from the vocal, EQ and compressor on the vocal.
  await page.getByRole("button", { name: t("transport.mixer"), exact: true }).click();
  const mixer = page.getByTestId("mixer");
  await mixer.getByRole("button", { name: t("mixer.addBus") }).click();
  const bus = t("names.bus").replace("{n}", "1");
  await mixer.getByLabel(t("mixer.addSendOn").replace("{track}", "Vocal")).selectOption({ label: bus });
  await mixer.getByLabel(t("mixer.addEffectOn").replace("{track}", "Vocal")).selectOption("compressor");
  const editor = page.locator(".device-editor");
  await expect(editor).toBeVisible();
  await shot("compressor.png", editor, 4);
  await editor.getByRole("button", { name: t("device.close") }).click();
  await mixer.getByLabel(t("mixer.addEffectOn").replace("{track}", "Vocal")).selectOption("eq");
  await expect(page.getByTestId("eq-curve")).toBeVisible();
  // Shape the curve: drag band 3 up and band 6 down.
  await dragEqBand(page, 2, -40);
  await dragEqBand(page, 5, 30);
  await shot("eq.png", editor, 4);
  await editor.getByRole("button", { name: t("device.close") }).click();
  await mixer.getByLabel(t("mixer.addEffectOn").replace("{track}", bus)).selectOption("reverb");
  await editor.getByRole("button", { name: t("device.close") }).click();
  await shot("mixer.png");
  await mixer.getByRole("button", { name: t("mixer.close") }).click();

  // Tune: open the vocal, select two notes and raise them.
  const clipBox = (await vocalLane.boundingBox())!;
  await page.mouse.dblclick(clipBox.x + 200, clipBox.y + 50);
  const tune = page.getByTestId("tune-editor");
  await expect(tune).toBeVisible();
  await expect(page.getByTestId("busy")).toHaveCount(0);
  const canvas = page.getByTestId("tune-canvas");
  await expect(canvas).toBeVisible();
  // A taller pane, so the whole side panel fits.
  const resizer = (await page.locator(".tune-resizer").boundingBox())!;
  await page.mouse.move(resizer.x + 300, resizer.y + resizer.height / 2);
  await page.mouse.down();
  await page.mouse.move(resizer.x + 300, resizer.y - 260, { steps: 6 });
  await page.mouse.up();
  await shot("tune.png");
  await shot("tune-panel.png", page.locator(".tune-panel"), 0);
  // Select every note and auto-correct: notes snap to the scale, drift is flattened.
  const cb = (await canvas.boundingBox())!;
  await page.mouse.move(cb.x + cb.width / 2, cb.y + cb.height / 2);
  await page.keyboard.press("ControlOrMeta+a");
  await tune.getByRole("button", { name: t("tune.correct") }).click();
  await expect(page.getByTestId("busy")).toHaveCount(0);
  await shot("tune-corrected.png", tune, 0);
  await page.keyboard.press("ControlOrMeta+z");
  await tune.getByRole("button", { name: t("tune.close") }).click();

  // Settings and About.
  await page.getByRole("button", { name: t("transport.settings") }).click();
  await shot("settings.png", page.getByRole("dialog", { name: t("settings.title") }), 0);
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: t("transport.about") }).click();
  const about = page.getByRole("dialog", { name: t("about.title") });
  await expect(about.getByTestId("update-status")).not.toHaveText(t("about.checking"));
  await shot("about.png", about, 0);
});

function lookup(catalog: unknown, key: string): string | undefined {
  let node = catalog;
  for (const part of key.split(".")) node = (node as Record<string, unknown> | undefined)?.[part];
  return typeof node === "string" ? node : undefined;
}

/** A screenshot of the page, or of the `targets` (their union) plus `margin` px around them. */
async function screenshot(
  page: Page,
  path: string,
  targets: Locator | Locator[] | undefined,
  margin: number,
) {
  await page.mouse.move(0, 799); // No hover highlights.
  await page.waitForTimeout(150);
  if (!targets) return page.screenshot({ path });
  const boxes = await Promise.all([targets].flat().map(async (l) => (await l.boundingBox())!));
  const left = Math.min(...boxes.map((b) => b.x));
  const top = Math.min(...boxes.map((b) => b.y));
  const b = {
    x: left,
    y: top,
    width: Math.max(...boxes.map((b) => b.x + b.width)) - left,
    height: Math.max(...boxes.map((b) => b.y + b.height)) - top,
  };
  const vp = page.viewportSize()!;
  const x = Math.max(0, b.x - margin);
  const y = Math.max(0, b.y - margin);
  return page.screenshot({
    path,
    clip: {
      x,
      y,
      width: Math.min(vp.width - x, b.width + margin * 2),
      height: Math.min(vp.height - y, b.height + margin * 2),
    },
  });
}

/** Numbered badges over the top-left corner of each element. */
async function annotate(page: Page, items: [Locator, number][]) {
  const spots = [];
  for (const [locator, n] of items) {
    const b = (await locator.boundingBox())!;
    spots.push({ x: b.x, y: b.y, w: b.width, h: b.height, n });
  }
  await page.evaluate((list) => {
    for (const s of list) {
      const outline = document.createElement("div");
      outline.className = "manual-annotation";
      Object.assign(outline.style, {
        position: "fixed",
        left: `${s.x}px`,
        top: `${s.y}px`,
        width: `${s.w}px`,
        height: `${s.h}px`,
        border: "2px solid #ff375f",
        borderRadius: "4px",
        boxSizing: "border-box",
        pointerEvents: "none",
        zIndex: "9998",
      });
      const badge = document.createElement("div");
      badge.className = "manual-annotation";
      badge.textContent = String(s.n);
      Object.assign(badge.style, {
        position: "fixed",
        left: `${Math.max(2, s.x - 10)}px`,
        top: `${Math.max(2, s.y - 10)}px`,
        width: "22px",
        height: "22px",
        borderRadius: "11px",
        background: "#ff375f",
        color: "white",
        font: "700 12px/22px system-ui, sans-serif",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: "9999",
        boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
      });
      document.body.append(outline, badge);
    }
  }, spots);
}

/** Numbered badges centered on page points. */
async function annotatePoints(page: Page, points: [number, number, number][]) {
  await page.evaluate((list) => {
    for (const [x, y, n] of list) {
      const badge = document.createElement("div");
      badge.className = "manual-annotation";
      badge.textContent = String(n);
      Object.assign(badge.style, {
        position: "fixed",
        left: `${x - 11}px`,
        top: `${y - 11}px`,
        width: "22px",
        height: "22px",
        borderRadius: "11px",
        background: "#ff375f",
        color: "white",
        font: "700 12px/22px system-ui, sans-serif",
        textAlign: "center",
        pointerEvents: "none",
        zIndex: "9999",
        boxShadow: "0 1px 4px rgba(0,0,0,0.5)",
      });
      document.body.append(badge);
    }
  }, points);
}

async function clearAnnotations(page: Page) {
  await page.evaluate(() => document.querySelectorAll(".manual-annotation").forEach((e) => e.remove()));
}

/** Drags EQ band `index` (0-based) vertically by `dy` px on the curve. */
async function dragEqBand(page: Page, index: number, dy: number) {
  const canvas = page.getByTestId("eq-curve");
  const b = (await canvas.boundingBox())!;
  // Default band frequencies, as positions on the 20 Hz–20 kHz log axis.
  const freqs = [30, 100, 250, 800, 2500, 6000, 12000, 18000];
  const x = b.x + (Math.log(freqs[index]! / 20) / Math.log(1000)) * b.width;
  const y = b.y + b.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x, y + dy, { steps: 6 });
  await page.mouse.up();
}

// Audio ------------------------------------------------------------------------------------

const midiHz = (m: number) => 440 * 2 ** ((m - 69) / 12);

/** A sung-sounding line: notes with a scoop into pitch, slight drift and late vibrato. */
function vocal(): Float32Array {
  const out = new Float32Array(SECONDS * SAMPLE_RATE);
  const beat = 60 / BPM;
  // [start beat, length in beats, MIDI note, cents off]
  const notes: [number, number, number, number][] = [
    [0, 1.5, 64, 18],
    [2, 1, 67, -22],
    [3, 1, 69, 12],
    [4, 3, 67, -8],
    [8, 1.5, 64, 25],
    [10, 1, 62, -15],
    [11, 1, 60, 10],
    [12, 3, 62, -20],
    [16, 2, 64, 15],
    [18, 2, 67, -10],
  ];
  for (const [start, length, note, cents] of notes) {
    const t0 = start * beat;
    const dur = length * beat * 0.92;
    let phase = 0;
    for (let i = 0; i < dur * SAMPLE_RATE; i++) {
      const t = i / SAMPLE_RATE;
      const scoop = -60 * Math.exp(-t / 0.05); // Starts 60 cents flat.
      const drift = cents * Math.sin((Math.PI * t) / dur);
      const vibrato = t > 0.35 ? 30 * Math.sin(2 * Math.PI * 5.5 * t) * Math.min(1, (t - 0.35) * 3) : 0;
      const hz = midiHz(note) * 2 ** ((scoop + drift + vibrato) / 1200);
      phase += (2 * Math.PI * hz) / SAMPLE_RATE;
      const env = Math.min(1, t / 0.03) * Math.min(1, (dur - t) / 0.06);
      const k = Math.round((t0 + t) * SAMPLE_RATE);
      if (k < out.length)
        out[k] = 0.35 * env * (Math.sin(phase) + 0.4 * Math.sin(2 * phase) + 0.2 * Math.sin(3 * phase));
    }
  }
  return out;
}

function bass(): Float32Array {
  const out = new Float32Array(SECONDS * SAMPLE_RATE);
  const bar = (4 * 60) / BPM;
  const roots = [40, 43, 38, 36, 40, 43];
  roots.forEach((note, b) => {
    for (let i = 0; i < bar * 0.95 * SAMPLE_RATE; i++) {
      const t = i / SAMPLE_RATE;
      const k = Math.round((b * bar + t) * SAMPLE_RATE);
      const p = 2 * Math.PI * midiHz(note) * t;
      if (k < out.length) out[k] = 0.4 * Math.exp(-t * 0.6) * (Math.sin(p) + 0.3 * Math.sin(2 * p));
    }
  });
  return out;
}

function drums(): Float32Array {
  const out = new Float32Array(SECONDS * SAMPLE_RATE);
  const eighth = 30 / BPM;
  let seed = 1;
  const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  for (let s = 0; s * eighth < SECONDS; s++) {
    const start = Math.round(s * eighth * SAMPLE_RATE);
    const kick = s % 4 === 0;
    const snare = s % 4 === 2;
    for (let i = 0; i < 0.25 * SAMPLE_RATE && start + i < out.length; i++) {
      const t = i / SAMPLE_RATE;
      let v = 0.15 * noise() * Math.exp(-t * 60); // Hi-hat.
      if (kick) v += 0.8 * Math.sin(2 * Math.PI * (50 + 100 * Math.exp(-t * 30)) * t) * Math.exp(-t * 8);
      if (snare) v += 0.4 * noise() * Math.exp(-t * 18);
      out[start + i]! += v;
    }
  }
  return out;
}

/** 16-bit mono WAV. */
function wav(samples: Float32Array): Buffer {
  const data = Buffer.alloc(samples.length * 2);
  samples.forEach((s, i) => data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, s)) * 32_000), i * 2));
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(SAMPLE_RATE, 24);
  header.writeUInt32LE(SAMPLE_RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);
  return Buffer.concat([header, data]);
}
