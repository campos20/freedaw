import { WebPlatform } from "@freedaw/platform/web";
import { App } from "@freedaw/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

declare global {
  interface Window {
    /** Set by public/coi-register.js while it reloads the page to become cross-origin isolated. */
    freedawCoiReloadPending?: boolean;
  }
}

function boot() {
  const platform = new WebPlatform();
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App platform={platform} />
    </StrictMode>,
  );
}

// Don't start the app on a page that is about to reload itself (see coi-register.js).
if (window.freedawCoiReloadPending) window.addEventListener("freedaw-coi-done", boot, { once: true });
else boot();
