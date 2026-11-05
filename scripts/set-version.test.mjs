import { describe, expect, it } from "vitest";
import { compare, nextVersion } from "./set-version.mjs";

describe("nextVersion", () => {
  it("bumps releases", () => {
    expect(nextVersion("0.1.0", "patch")).toBe("0.1.1");
    expect(nextVersion("0.1.3", "minor")).toBe("0.2.0");
    expect(nextVersion("0.4.3", "major")).toBe("1.0.0");
  });

  it("finishes a pre-release of the same kind", () => {
    expect(nextVersion("1.2.3-rc.1", "patch")).toBe("1.2.3");
    expect(nextVersion("1.2.0-rc.1", "minor")).toBe("1.2.0");
    expect(nextVersion("2.0.0-beta", "major")).toBe("2.0.0");
    expect(nextVersion("1.2.3-rc.1", "minor")).toBe("1.3.0");
  });

  it("accepts a greater exact version, with or without a v", () => {
    expect(nextVersion("0.1.0", "0.3.0")).toBe("0.3.0");
    expect(nextVersion("0.1.0", "v1.0.0-rc.1")).toBe("1.0.0-rc.1");
    expect(nextVersion("1.0.0-rc.1", "1.0.0-rc.2")).toBe("1.0.0-rc.2");
  });

  it("rejects versions that don't move forward or aren't semver", () => {
    expect(() => nextVersion("0.2.0", "0.2.0")).toThrow();
    expect(() => nextVersion("0.2.0", "0.1.9")).toThrow();
    expect(() => nextVersion("1.0.0", "1.0.0-rc.1")).toThrow();
    expect(() => nextVersion("0.2.0", "1.0")).toThrow();
    expect(() => nextVersion("0.2.0", "minr")).toThrow();
  });
});

describe("compare", () => {
  it("follows semver precedence", () => {
    const sorted = [
      "1.0.0-alpha",
      "1.0.0-alpha.1",
      "1.0.0-alpha.beta",
      "1.0.0-beta",
      "1.0.0-beta.2",
      "1.0.0-beta.11",
      "1.0.0-rc.1",
      "1.0.0",
      "1.0.1",
      "1.10.0",
    ];
    for (let i = 1; i < sorted.length; i++) expect(compare(sorted[i - 1], sorted[i])).toBeLessThan(0);
  });
});
