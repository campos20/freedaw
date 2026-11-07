import { fileURLToPath } from "node:url";
import { defineConfig, devices } from "@playwright/test";

// Generates the user manual's screenshots (docs/manual/images/<locale>/) from the real app:
//   pnpm manual:screenshots
// Not part of `pnpm e2e`. Add a locale to LOCALES once its manual pages exist.
const LOCALES = ["en"];
const PORT = 4173;
const FAKE_MIC = fileURLToPath(new URL("./e2e/fixtures/mic.wav", import.meta.url));

export default defineConfig({
  testDir: "manual",
  reporter: "list",
  // One long scene per locale; screenshots are taken along the way.
  timeout: 120_000,
  use: {
    baseURL: `http://localhost:${PORT}/`,
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  },
  projects: LOCALES.map((locale) => ({
    name: locale,
    use: {
      ...devices["Desktop Chrome"],
      viewport: { width: 1280, height: 800 },
      deviceScaleFactor: 1,
      locale,
      permissions: ["microphone"],
      launchOptions: {
        args: [
          "--autoplay-policy=no-user-gesture-required",
          "--use-fake-device-for-media-stream",
          "--use-fake-ui-for-media-stream",
          `--use-file-for-fake-audio-capture=${FAKE_MIC}`,
        ],
      },
    },
  })),
  webServer: {
    command: `pnpm exec vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/`,
    reuseExistingServer: !process.env.CI,
  },
});
