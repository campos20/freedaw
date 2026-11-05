import { afterEach, describe, expect, it, vi } from "vitest";
import { checkForUpdate, isNewer } from "./updates";

describe("isNewer", () => {
  it("compares each part numerically", () => {
    expect(isNewer("0.10.0", "0.9.9")).toBe(true);
    expect(isNewer("v1.0.0", "0.9.9")).toBe(true);
    expect(isNewer("0.1.1", "0.1.0")).toBe(true);
  });

  it("is false for the same or an older release", () => {
    expect(isNewer("v0.1.0", "0.1.0")).toBe(false);
    expect(isNewer("0.1.0", "0.2.0")).toBe(false);
  });

  it("rejects tags that aren't versions", () => {
    expect(() => isNewer("nightly", "0.1.0")).toThrow();
  });
});

describe("checkForUpdate", () => {
  afterEach(() => vi.unstubAllGlobals());

  const answer = (body: unknown, status = 200) =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(body), { status })),
    );

  it("reports a newer release without its tag prefix", async () => {
    answer({ tag_name: "v0.2.0" });
    await expect(checkForUpdate("0.1.0")).resolves.toEqual({ kind: "available", version: "0.2.0" });
  });

  it("reports being up to date", async () => {
    answer({ tag_name: "v0.1.0" });
    await expect(checkForUpdate("0.1.0")).resolves.toEqual({ kind: "up-to-date" });
  });

  it("treats a 404 as no published releases", async () => {
    answer({ message: "Not Found" }, 404);
    await expect(checkForUpdate("0.1.0")).resolves.toEqual({ kind: "no-releases" });
  });

  it("rejects on other errors such as rate limiting", async () => {
    answer({ message: "rate limited" }, 403);
    await expect(checkForUpdate("0.1.0")).rejects.toThrow("403");
  });
});
