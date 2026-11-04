import { TauriPlatform } from "@freedaw/platform/tauri";
import { App } from "@freedaw/ui";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

const platform = new TauriPlatform();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App platform={platform} />
  </StrictMode>,
);
