/** Typed view of the raw C ABI exported by `crates/engine-wasm`. Pointers are byte offsets. */
export interface EngineExports {
  memory: WebAssembly.Memory;
  freedaw_create(sampleRate: number): number;
  freedaw_destroy(handle: number): void;
  freedaw_command_args(handle: number): number;
  freedaw_command(handle: number, op: number): number;
  freedaw_input(handle: number, channel: number): number;
  freedaw_process(handle: number, frames: number, inChannels: number): number;
  freedaw_capture_info(handle: number): number;
  freedaw_capture_data(handle: number): number;
  freedaw_poll_capture(handle: number): number;
  freedaw_output(handle: number, channel: number): number;
  freedaw_event_args(handle: number): number;
  freedaw_poll_event(handle: number): number;
  freedaw_source_create(channels: number, frames: number): number;
  freedaw_source_channel(pending: number, channel: number): number;
  freedaw_source_commit(handle: number, pending: number, source: number): number;
  freedaw_source_discard(pending: number): void;
  freedaw_collect_garbage(handle: number): number;
  freedaw_device_create(handle: number, device: number, kind: number): number;
  freedaw_automation_points(handle: number, points: number): number;
  freedaw_automation_commit(
    handle: number,
    points: number,
    lane: number,
    track: number,
    kind: number,
    index: number,
    device: number,
  ): number;
}

/** Instantiates the engine module. It has no imports, so this works synchronously. */
export function instantiateEngine(module: WebAssembly.Module): EngineExports {
  return new WebAssembly.Instance(module, {}).exports as unknown as EngineExports;
}
