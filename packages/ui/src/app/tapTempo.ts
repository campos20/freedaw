/** Tap tempo: the BPM of a run of taps. */
import type { ProjectStore } from "../state/store";

/** A pause longer than this starts a new run of taps. */
export const TAP_RESET_MS = 2000;
/** Only the most recent taps count, so the tempo follows a player who speeds up or slows down. */
const MAX_TAPS = 8;
const MIN_BPM = 20;
const MAX_BPM = 300;

/** Adds a tap at `now` (ms) to `taps`, starting over after a long pause; returns the new run. */
export function addTap(taps: readonly number[], now: number): number[] {
  const last = taps.at(-1);
  if (last === undefined || now - last > TAP_RESET_MS || now <= last) return [now];
  return [...taps, now].slice(-MAX_TAPS);
}

/** The run's tempo, rounded to 0.1 BPM and kept within 20–300; undefined before the second tap. */
export function tapBpm(taps: readonly number[]): number | undefined {
  if (taps.length < 2) return undefined;
  const interval = (taps.at(-1)! - taps[0]!) / (taps.length - 1);
  const bpm = Math.round(600_000 / interval) / 10;
  return Math.min(MAX_BPM, Math.max(MIN_BPM, bpm));
}

const LABEL = "Tap tempo";

/** Sets the project tempo from taps; a run of taps is one undo step. */
export class TapTempo {
  private taps: number[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly store: ProjectStore;

  constructor(store: ProjectStore) {
    this.store = store;
  }

  tap(now = performance.now()) {
    this.taps = addTap(this.taps, now);
    const bpm = tapBpm(this.taps);
    if (bpm === undefined) return;
    const s = this.store.getState();
    if (s.gesture?.label !== LABEL) s.beginGesture(LABEL);
    this.store.getState().updateGesture((p) => void (p.tempo = bpm));
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.commit(), TAP_RESET_MS);
  }

  /** Ends the run: the tempo becomes one undoable edit. */
  commit() {
    clearTimeout(this.timer);
    this.taps = [];
    const s = this.store.getState();
    if (s.gesture?.label === LABEL) s.commitGesture();
  }
}
