import { useCallback, useEffect, useState } from "react";
import { useT } from "../i18n";
import { useSession } from "../state/hooks";
import {
  checkForUpdate,
  PRIVACY_URL,
  RELEASES_URL,
  REPO_URL,
  SPONSOR_URL,
  TERMS_URL,
  type UpdateStatus,
} from "./updates";

type Check = { kind: "checking" } | { kind: "failed" } | UpdateStatus;

/** Version, project link and update check. GitHub is only contacted while this is open. */
export function About({ version, onClose }: { version: string; onClose: () => void }) {
  const edition = useSession().platform.edition;
  const t = useT();
  const [check, setCheck] = useState<Check>({ kind: "checking" });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => {
    setCheck({ kind: "checking" });
    setAttempt((a) => a + 1);
  }, []);

  useEffect(() => {
    const abort = new AbortController();
    checkForUpdate(version, abort.signal).then(setCheck, () => {
      if (!abort.signal.aborted) setCheck({ kind: "failed" });
    });
    return () => abort.abort();
  }, [version, attempt]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="dialog-backdrop" onPointerDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="dialog" role="dialog" aria-label={t("about.title")}>
        <header>
          <h2>{t("about.title")}</h2>
          <button className="close" onClick={onClose} aria-label={t("common.close")}>
            ✕
          </button>
        </header>
        <div className="field-row">
          <span>{t("about.version")}</span>
          <span data-testid="app-version">
            {version} ({edition === "web" ? t("common.web") : t("common.desktop")})
          </span>
        </div>
        <div className="field-row">
          <span>{t("about.updates")}</span>
          <span data-testid="update-status">
            {check.kind === "checking" && t("about.checking")}
            {check.kind === "up-to-date" && t("about.upToDate")}
            {check.kind === "no-releases" && t("about.noReleases")}
            {check.kind === "available" && (
              <>
                {t("about.available", { version: check.version })}{" "}
                {edition === "web" ? (
                  t("about.reload")
                ) : (
                  <a href={RELEASES_URL} target="_blank" rel="noreferrer">
                    {t("about.download")}
                  </a>
                )}
              </>
            )}
            {check.kind === "failed" && (
              <>
                {t("about.checkFailed")} <button onClick={retry}>{t("about.retry")}</button>
              </>
            )}
          </span>
        </div>
        <div className="field-row">
          <span>{t("about.source")}</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            github.com/campos20/freedaw
          </a>
        </div>
        <div className="field-row">
          <span>{t("about.support")}</span>
          <a href={SPONSOR_URL} target="_blank" rel="noreferrer">
            {t("about.sponsor")}
          </a>
        </div>
        <div className="field-row">
          <span>{t("about.license")}</span>
          <span>GPL-3.0-or-later</span>
        </div>
        <div className="field-row">
          <span>{t("about.legal")}</span>
          <span>
            <a href={PRIVACY_URL} target="_blank" rel="noreferrer">
              {t("about.privacy")}
            </a>
            {" · "}
            <a href={TERMS_URL} target="_blank" rel="noreferrer">
              {t("about.terms")}
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}
