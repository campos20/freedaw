import { useCallback, useEffect, useState } from "react";
import { useSession } from "../state/hooks";
import { checkForUpdate, RELEASES_URL, REPO_URL, type UpdateStatus } from "./updates";

type Check = { kind: "checking" } | { kind: "failed" } | UpdateStatus;

/** Version, project link and update check. GitHub is only contacted while this is open. */
export function About({ version, onClose }: { version: string; onClose: () => void }) {
  const edition = useSession().platform.edition;
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
      <div className="dialog" role="dialog" aria-label="About FreeDAW">
        <header>
          <h2>About FreeDAW</h2>
          <button className="close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </header>
        <div className="field-row">
          <span>Version</span>
          <span data-testid="app-version">
            {version} ({edition === "web" ? "Web" : "Desktop"})
          </span>
        </div>
        <div className="field-row">
          <span>Updates</span>
          <span data-testid="update-status">
            {check.kind === "checking" && "Checking…"}
            {check.kind === "up-to-date" && "You're on the latest version."}
            {check.kind === "no-releases" && "No releases published yet."}
            {check.kind === "available" && (
              <>
                Version {check.version} is available.{" "}
                {edition === "web" ? (
                  "Reload the page to update."
                ) : (
                  <a href={RELEASES_URL} target="_blank" rel="noreferrer">
                    Download
                  </a>
                )}
              </>
            )}
            {check.kind === "failed" && (
              <>
                Couldn't check for updates. <button onClick={retry}>Try again</button>
              </>
            )}
          </span>
        </div>
        <div className="field-row">
          <span>Source code</span>
          <a href={REPO_URL} target="_blank" rel="noreferrer">
            github.com/campos20/freedaw
          </a>
        </div>
        <div className="field-row">
          <span>License</span>
          <span>GPL-3.0-or-later</span>
        </div>
      </div>
    </div>
  );
}
