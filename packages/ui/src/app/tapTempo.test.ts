import { describe, expect, it, vi } from "vitest";
import { newProject } from "../model/edits";
import { createProjectStore } from "../state/store";
import { addTap, TAP_RESET_MS, TapTempo, tapBpm } from "./tapTempo";

const tap = (times: number[]) => times.reduce<number[]>((taps, t) => addTap(taps, t), []);

describe("tap tempo", () => {
  it("needs two taps", () => {
    expect(tapBpm(tap([1000]))).toBeUndefined();
    expect(tapBpm(tap([1000, 1500]))).toBe(120);
  });

  it("averages the intervals", () => {
    expect(tapBpm(tap([0, 480, 1010, 1500]))).toBe(120);
    expect(tapBpm(tap([0, 600, 1200, 1800]))).toBe(100);
  });

  it("starts over after a long pause", () => {
    const taps = tap([0, 500, 1000, 4000]);
    expect(taps).toEqual([4000]);
    expect(tapBpm(addTap(taps, 4750))).toBe(80);
  });

  it("follows the most recent taps", () => {
    const slow = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000]; // 60 BPM
    const fast = [7500, 8000, 8500, 9000, 9500, 10000, 10500]; // 120 BPM
    expect(tapBpm(tap([...slow, ...fast]))).toBe(120);
  });

  it("stays within the tempo range", () => {
    expect(tapBpm(tap([0, 100]))).toBe(300);
    expect(tapBpm(tap([0, 1900, 3800]))).toBe(31.6);
  });
});

describe("TapTempo", () => {
  it("sets the tempo as one undo step per run of taps", () => {
    vi.useFakeTimers();
    const store = createProjectStore(newProject("p", "Test", "now"));
    const tapper = new TapTempo(store);
    const before = store.getState().project.tempo;
    for (const t of [0, 400, 800, 1200]) tapper.tap(t);
    expect(store.getState().project.tempo).toBe(150);
    vi.advanceTimersByTime(TAP_RESET_MS);
    expect(store.getState().gesture).toBeUndefined();
    expect(store.getState().past).toHaveLength(1);
    store.getState().undo();
    expect(store.getState().project.tempo).toBe(before);
    vi.useRealTimers();
  });

  it("starts a new run when the project changes between taps", () => {
    vi.useFakeTimers();
    const store = createProjectStore(newProject("a", "A", "now"));
    const tapper = new TapTempo(store);
    tapper.tap(0);
    tapper.tap(400); // 150 BPM in project A
    expect(store.getState().project.tempo).toBe(150);

    // Open project B mid-run: its first tap must not pair with A's taps.
    store.getState().load(newProject("b", "B", "now"));
    tapper.tap(900);
    expect(store.getState().project.tempo).toBe(120);
    tapper.tap(1900); // 60 BPM from B's taps only
    expect(store.getState().project.tempo).toBe(60);

    // An undo between taps ends the run as well.
    vi.advanceTimersByTime(TAP_RESET_MS);
    tapper.tap(4000);
    tapper.tap(4500);
    store.getState().undo(); // cancels the run and undoes B's 60 BPM run: back to 120
    tapper.tap(4800); // continuing the old run would give 150
    expect(store.getState().project.tempo).toBe(120);
    vi.useRealTimers();
  });
});
