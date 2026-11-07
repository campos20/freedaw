import { useEffect, useRef, useState } from "react";
import { getLocale, useT } from "../i18n";
import { useProject, useSession, useSessionUi } from "../state/hooks";

/** The project name button and its menu: new, rename, import/export, recent projects. */
export function ProjectMenu() {
  const session = useSession();
  const t = useT();
  const name = useProject((s) => s.project.name);
  const currentId = useProject((s) => s.project.id);
  const projects = useSessionUi((s) => s.projects);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [open]);

  const act = (action: () => void) => () => {
    setOpen(false);
    action();
  };

  return (
    <div className="project-menu" ref={root}>
      <button
        className="project-button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="project-name" data-testid="project-name">
          {name}
        </span>
        <span aria-hidden>▾</span>
      </button>
      {open && (
        <div className="menu" role="menu">
          <label className="menu-field">
            <span>{t("project.name")}</span>
            <input
              defaultValue={name}
              aria-label={t("project.nameLabel")}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  session.rename(e.currentTarget.value);
                  setOpen(false);
                }
              }}
              onBlur={(e) => session.rename(e.target.value)}
            />
          </label>
          <button role="menuitem" onClick={act(() => void session.newProject())}>
            {t("project.new")}
          </button>
          <label role="menuitem" className="menu-file">
            {t("project.import")}
            <input
              type="file"
              accept=".freedaw,.tessera,application/zip"
              data-testid="import-archive"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                setOpen(false);
                if (file) void session.importArchive(file);
              }}
            />
          </label>
          <button role="menuitem" onClick={act(() => void session.exportArchive())}>
            {t("project.export")}
          </button>
          {projects.length > 0 && <div className="menu-heading">{t("project.recent")}</div>}
          {projects.map((p) => (
            <div className="menu-project" key={p.id}>
              <button
                role="menuitem"
                className={p.id === currentId ? "current" : undefined}
                onClick={act(() => p.id !== currentId && void session.openProject(p.id))}
                title={
                  p.modifiedAt
                    ? t("project.savedAt", { date: new Date(p.modifiedAt).toLocaleString(getLocale()) })
                    : undefined
                }
              >
                {p.name}
              </button>
              <button
                className="delete"
                aria-label={t("project.deleteLabel", { name: p.name })}
                title={t("project.deleteTitle")}
                onClick={act(() => {
                  if (confirm(t("project.deleteConfirm", { name: p.name }))) void session.deleteProject(p.id);
                })}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
