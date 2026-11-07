import { useEffect, useRef, useState } from "react";
import { useT } from "../i18n";
import { useRecording, useSession } from "../state/hooks";

/** Count-in and punch settings next to the record button. */
export function RecordOptions() {
  const session = useSession();
  const t = useT();
  const countInBars = useRecording((s) => s.countInBars);
  const punch = useRecording((s) => s.punch);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);
  return (
    <div className="record-options" ref={ref}>
      <button
        className="icon-button narrow"
        aria-label={t("recordOptions.label")}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        ▾
      </button>
      {open && (
        <div className="popover" role="dialog" aria-label={t("recordOptions.label")}>
          <label>
            {t("recordOptions.countIn")}
            <select
              value={countInBars}
              onChange={(e) => session.setCountIn(Number(e.target.value))}
              aria-label={t("recordOptions.countIn")}
            >
              <option value={0}>{t("common.off")}</option>
              <option value={1}>{t("recordOptions.bars", { count: 1 })}</option>
              <option value={2}>{t("recordOptions.bars", { count: 2 })}</option>
            </select>
          </label>
          <label title={t("recordOptions.punchTitle")}>
            <input
              type="checkbox"
              checked={punch}
              onChange={(e) => session.setPunch(e.target.checked)}
              aria-label={t("recordOptions.punch")}
            />
            {t("recordOptions.punchLabel")}
          </label>
        </div>
      )}
    </div>
  );
}
