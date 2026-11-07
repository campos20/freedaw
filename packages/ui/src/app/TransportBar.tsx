import { useLayoutEffect, useRef } from "react";
import { formatBarsBeats, formatTime, type Meter } from "../arrange/timeScale";
import { usePlayhead } from "../hooks/usePlayhead";
import { useT } from "../i18n";
import { useProject, useRecording, useSession, useTransport } from "../state/hooks";
import { RecordOptions } from "./RecordOptions";
import { LoopIcon, MagnetIcon, MetronomeIcon, PlayIcon, RecordIcon, RewindIcon, StopIcon } from "./icons";
import { ProjectMenu } from "./ProjectMenu";
import "./TransportBar.css";

export interface TransportBarProps {
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  snap: boolean;
  onToggleSnap: () => void;
  onZoom: (factor: number) => void;
  mixer: boolean;
  onToggleMixer: () => void;
}

export function TransportBar({
  snap,
  onToggleSnap,
  onZoom,
  onOpenSettings,
  onOpenAbout,
  mixer,
  onToggleMixer,
}: TransportBarProps) {
  const session = useSession();
  const t = useT();
  const edit = useProject((s) => s.edit);
  const tempo = useProject((s) => s.project.tempo);
  const timeSignature = useProject((s) => s.project.timeSignature);
  const sampleRate = useProject((s) => s.project.sampleRate);
  const loop = useProject((s) => s.project.loop.enabled);
  const metronome = useProject((s) => s.project.metronome);
  const playing = useTransport((s) => s.playing);
  const recording = useRecording((s) => s.active);
  const countingIn = useTransport((s) => s.countingIn);
  const meter: Meter = { sampleRate, tempo, timeSignature };

  // The position display updates every animation frame without re-rendering React.
  const barsBeats = useRef<HTMLSpanElement>(null);
  const time = useRef<HTMLSpanElement>(null);
  const display = useRef<HTMLDivElement>(null);
  const meterRef = useRef(meter);
  useLayoutEffect(() => {
    meterRef.current = meter;
  });
  usePlayhead((frame) => {
    if (barsBeats.current) barsBeats.current.textContent = formatBarsBeats(frame, meterRef.current);
    if (time.current) time.current.textContent = formatTime(frame, meterRef.current.sampleRate);
    display.current?.setAttribute("data-frames", String(Math.round(frame)));
  });

  return (
    <header className="transport-bar">
      <div className="brand">
        <span className="logo" aria-hidden>
          ▦
        </span>
        <span className="app-name">FreeDAW</span>
        <ProjectMenu />
      </div>

      <div className="transport-controls" role="group" aria-label={t("transport.group")}>
        <button
          className="icon-button"
          onClick={() => session.seek(0)}
          aria-label={t("transport.returnToStart")}
          title={t("transport.returnToStartTitle")}
        >
          <RewindIcon />
        </button>
        <button
          className={playing ? "icon-button play on" : "icon-button play"}
          onClick={() => (recording ? void session.stopRecording() : session.togglePlay())}
          aria-label={playing ? t("transport.pause") : t("transport.play")}
          title={t("transport.playPauseTitle")}
        >
          <PlayIcon />
        </button>
        <button
          className="icon-button"
          onClick={() => session.stopAll()}
          aria-label={t("transport.stop")}
          title={t("transport.stop")}
        >
          <StopIcon />
        </button>
        <button
          className={`icon-button record${recording ? " on" : ""}${countingIn ? " counting-in" : ""}`}
          onClick={() => (recording ? void session.stopRecording() : void session.record())}
          aria-pressed={recording}
          aria-label={t("transport.record")}
          title={t("transport.recordTitle")}
        >
          <RecordIcon />
        </button>
        <RecordOptions />
        <button
          className={loop ? "icon-button toggle on" : "icon-button toggle"}
          onClick={() => edit(loop ? "Loop off" : "Loop on", (p) => void (p.loop.enabled = !p.loop.enabled))}
          aria-pressed={loop}
          aria-label={t("transport.loop")}
          title={t("transport.loopTitle")}
        >
          <LoopIcon />
        </button>
      </div>

      <div className="position-display" data-testid="position" data-frames="0" ref={display}>
        <span className="bars-beats" ref={barsBeats}>
          1.1.000
        </span>
        <span className="time" ref={time}>
          0:00.000
        </span>
      </div>

      <div className="tempo-group">
        <label className="field">
          <input
            key={tempo}
            type="number"
            min={20}
            max={300}
            step={0.1}
            defaultValue={tempo}
            onBlur={(e) => commitTempo(Number(e.target.value))}
            onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
            aria-label={t("transport.tempo")}
          />
          <span>{t("units.bpm")}</span>
        </label>
        <span className="field signature">
          {timeSignature.numerator}/{timeSignature.denominator}
        </span>
        <button
          className={metronome ? "icon-button toggle on" : "icon-button toggle"}
          onClick={() => edit("Metronome", (p) => void (p.metronome = !p.metronome))}
          aria-pressed={metronome}
          aria-label={t("transport.metronome")}
          title={t("transport.metronomeTitle")}
        >
          <MetronomeIcon />
        </button>
      </div>

      <div className="view-group">
        <button
          className={mixer ? "icon-button toggle on wide" : "icon-button toggle wide"}
          onClick={onToggleMixer}
          aria-pressed={mixer}
          aria-label={t("transport.mixer")}
          title={t("transport.mixerTitle")}
        >
          {t("transport.mixer")}
        </button>
        <button
          className="icon-button"
          onClick={onOpenSettings}
          aria-label={t("transport.settings")}
          title={t("transport.settings")}
        >
          ⚙
        </button>
        <button
          className="icon-button"
          onClick={onOpenAbout}
          aria-label={t("transport.about")}
          title={t("transport.about")}
        >
          ⓘ
        </button>
        <button
          className={snap ? "icon-button toggle on" : "icon-button toggle"}
          onClick={onToggleSnap}
          aria-pressed={snap}
          aria-label={t("transport.snap")}
          title={t("transport.snapTitle")}
        >
          <MagnetIcon />
        </button>
        <button
          className="icon-button"
          onClick={() => onZoom(1.5)}
          aria-label={t("transport.zoomOut")}
          title={t("transport.zoomOutTitle")}
        >
          −
        </button>
        <button
          className="icon-button"
          onClick={() => onZoom(1 / 1.5)}
          aria-label={t("transport.zoomIn")}
          title={t("transport.zoomInTitle")}
        >
          +
        </button>
      </div>
    </header>
  );

  function commitTempo(bpm: number) {
    if (Number.isFinite(bpm) && bpm >= 20 && bpm <= 300 && bpm !== tempo) {
      edit("Change tempo", (p) => void (p.tempo = bpm));
    }
  }
}
