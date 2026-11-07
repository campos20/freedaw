import type { AudioSettings, Diagnostics } from "@freedaw/platform";
import type { AudioDeviceList } from "@freedaw/schema";
import { type ReactNode, useEffect, useState } from "react";
import { formatNumber, getChosenLocale, LOCALES, setLocale, useT } from "../i18n";
import { useRecording, useSession, useSessionUi } from "../state/hooks";
import { REPO_URL } from "./updates";

const SAMPLE_RATES = [44_100, 48_000, 88_200, 96_000];
const BUFFER_SIZES = [32, 64, 128, 256, 512, 1024];

/** Language, device selection, latency compensation and calibration. */
export function Settings({ onClose }: { onClose: () => void }) {
  const session = useSession();
  const t = useT();
  const support = session.platform.capabilities.settings;
  const saved = useRecording((s) => s.settings);
  const engine = useRecording((s) => s.engine);
  const latency = useRecording((s) => s.latency);
  const xruns = useRecording((s) => s.xruns);
  const busy = useSessionUi((s) => s.busy);
  const [draft, setDraft] = useState<AudioSettings>(saved);
  const [devices, setDevices] = useState<AudioDeviceList>();
  const [diagnostics, setDiagnostics] = useState<Diagnostics>({});
  const [calibrationInput, setCalibrationInput] = useState(0);
  const [message, setMessage] = useState<string>();

  const refresh = () => {
    session.platform.listDevices().then(setDevices, () => {});
    session.platform.diagnostics().then(setDiagnostics, () => {});
  };
  useEffect(refresh, [session]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const hosts = devices?.hosts ?? [];
  const host = hosts.find((h) => h.name === draft.host) ?? hosts.find((h) => h.isDefault) ?? hosts[0];
  const outputs = host?.devices.filter((d) => d.maxOutputChannels > 0) ?? [];
  const inputs = host?.devices.filter((d) => d.maxInputChannels > 0) ?? [];
  const rate = engine?.sampleRate ?? 48_000;
  const ms = (frames: number) => formatNumber((frames / rate) * 1000, 1);
  const set = (patch: Partial<AudioSettings>) => setDraft((d) => ({ ...d, ...patch }));

  const apply = async () => {
    setMessage(undefined);
    try {
      await session.applyAudioSettings(draft);
      setMessage(t("settings.applied"));
      refresh();
    } catch (e) {
      setMessage(e instanceof Error ? e.message : String(e));
    }
  };

  const calibrate = async () => {
    setMessage(undefined);
    const frames = await session.calibrate(calibrationInput);
    setMessage(frames === undefined ? undefined : t("settings.measured", { ms: ms(frames), frames }));
  };

  return (
    <div className="dialog-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-label={t("settings.title")}>
        <header>
          <h2>{t("settings.title")}</h2>
          <button className="close" onClick={onClose} aria-label={t("common.close")}>
            ✕
          </button>
        </header>

        <section>
          <h3>{t("settings.general")}</h3>
          <LanguagePicker />
        </section>

        <section>
          <h3>{t("settings.devices")}</h3>
          {support.host && (
            <Field label={t("settings.driver")}>
              <select
                value={draft.host ?? ""}
                onChange={(e) =>
                  set({ host: e.target.value || undefined, outputDevice: undefined, inputDevice: undefined })
                }
              >
                <option value="">{t("common.default")}</option>
                {hosts.map((h) => (
                  <option key={h.name} value={h.name}>
                    {h.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {support.outputDevice && (
            <Field label={t("settings.output")}>
              <select
                value={draft.outputDevice ?? ""}
                onChange={(e) => set({ outputDevice: e.target.value || undefined })}
              >
                <option value="">{t("common.default")}</option>
                {outputs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {support.inputDevice && (
            <Field label={t("settings.input")}>
              <select
                value={draft.inputDevice ?? ""}
                onChange={(e) => set({ inputDevice: e.target.value || undefined })}
                aria-label={t("settings.inputDevice")}
              >
                <option value="">{t("common.none")}</option>
                <option value="default">{t("common.default")}</option>
                {inputs.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                    {d.maxInputChannels > 2
                      ? ` (${t("settings.channels", { count: d.maxInputChannels })})`
                      : ""}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {support.sampleRate && (
            <Field label={t("settings.sampleRate")}>
              <select
                value={draft.sampleRate ?? ""}
                onChange={(e) => set({ sampleRate: Number(e.target.value) || undefined })}
              >
                <option value="">{t("settings.deviceDefault")}</option>
                {SAMPLE_RATES.map((r) => (
                  <option key={r} value={r}>
                    {t("units.kHz", { value: formatNumber(r / 1000, 1) })}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {support.bufferSize && (
            <Field label={t("settings.bufferSize")}>
              <select
                value={draft.bufferSize ?? ""}
                onChange={(e) => set({ bufferSize: Number(e.target.value) || undefined })}
              >
                <option value="">{t("settings.deviceDefault")}</option>
                {BUFFER_SIZES.map((b) => (
                  <option key={b} value={b}>
                    {t("settings.samples", { count: b, ms: formatNumber((b / rate) * 1000, 1) })}
                  </option>
                ))}
              </select>
            </Field>
          )}
          {!support.host && <p className="note">{t("settings.browserNote")}</p>}
          <div className="actions">
            <button className="primary" onClick={() => void apply()} disabled={!!busy}>
              {t("settings.apply")}
            </button>
          </div>
        </section>

        <section>
          <h3>{t("settings.latency")}</h3>
          <p data-testid="latency">
            {t("settings.latencyValue", { ms: ms(latency.frames), frames: latency.frames })} —{" "}
            {latency.calibrated ? t("settings.calibrated") : t("settings.estimated")}
          </p>
          <p className="note">{t("settings.calibrationNote")}</p>
          <div className="actions">
            <label>
              {t("settings.loopbackInput")}
              <select value={calibrationInput} onChange={(e) => setCalibrationInput(Number(e.target.value))}>
                {Array.from({ length: Math.max(1, engine?.inputChannels ?? 1) }, (_, c) => (
                  <option key={c} value={c}>
                    {t("units.input", { n: c + 1 })}
                  </option>
                ))}
              </select>
            </label>
            <button onClick={() => void calibrate()} disabled={!!busy}>
              {busy?.key === "session.calibrating" ? t("settings.calibrating") : t("settings.calibrate")}
            </button>
          </div>
        </section>

        <section>
          <h3>{t("settings.status")}</h3>
          <dl>
            {Object.entries(diagnostics).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{String(v)}</dd>
              </div>
            ))}
            {engine && (
              <div>
                <dt>inputChannels</dt>
                <dd>{engine.inputChannels}</dd>
              </div>
            )}
            {support.bufferSize && (
              <div>
                <dt>dropouts</dt>
                <dd data-testid="xruns">{xruns}</dd>
              </div>
            )}
          </dl>
        </section>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field-row">
      <span>{label}</span>
      {children}
    </label>
  );
}

/** UI language: follows the system unless one is picked. Applies immediately. */
function LanguagePicker() {
  const t = useT();
  return (
    <>
      <Field label={t("settings.language")}>
        <select
          value={getChosenLocale() ?? ""}
          onChange={(e) => setLocale(e.target.value || undefined)}
          data-testid="language"
        >
          <option value="">{t("settings.systemLanguage")}</option>
          {LOCALES.map((l) => (
            <option key={l.code} value={l.code} lang={l.code}>
              {l.name}
            </option>
          ))}
        </select>
      </Field>
      <p className="note">
        <a href={`${REPO_URL}/blob/main/packages/ui/src/i18n/README.md`} target="_blank" rel="noreferrer">
          {t("settings.translateHint")}
        </a>
      </p>
    </>
  );
}
