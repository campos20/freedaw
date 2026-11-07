// Keeps the user manual (docs/manual) consistent: links, anchors and images resolve, every
// screenshot is used, and the effects reference covers every built-in effect.
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { DEVICES } from "../packages/schema/src/generated/devices.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const manual = join(root, "docs/manual");

function markdownFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? markdownFiles(join(dir, e.name)) : e.name.endsWith(".md") ? [join(dir, e.name)] : [],
  );
}

/** GitHub's heading anchors: lowercase, punctuation dropped, spaces to dashes. */
function slug(heading) {
  return heading
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s/g, "-");
}

const anchors = (file) =>
  new Set(
    [...readFileSync(file, "utf8").matchAll(/^#{1,6} (.+)$/gm)].map((m) => slug(m[1].replace(/`/g, ""))),
  );

const files = markdownFiles(manual);
/** Relative links and images: `[text](target)` / `![alt](target)`. */
const links = files.flatMap((file) =>
  [...readFileSync(file, "utf8").matchAll(/!?\[[^\]]*\]\(([^)\s]+)\)/g)]
    .map((m) => m[1])
    .filter((target) => !/^[a-z]+:/.test(target))
    .map((target) => ({ file, target })),
);

describe("user manual", () => {
  it("has pages", () => {
    expect(files.length).toBeGreaterThan(10);
  });

  it("links to files and headings that exist", () => {
    for (const { file, target } of links) {
      const [path, anchor] = target.split("#");
      const destination = path ? resolve(dirname(file), path) : file;
      const where = `${relative(root, file)} → ${target}`;
      expect(existsSync(destination), where).toBe(true);
      if (anchor && destination.endsWith(".md")) expect(anchors(destination).has(anchor), where).toBe(true);
    }
  });

  it("uses every screenshot", () => {
    const used = new Set(
      links
        .filter(({ target }) => target.endsWith(".png"))
        .map(({ file, target }) => resolve(dirname(file), target)),
    );
    const images = join(manual, "images");
    for (const locale of readdirSync(images)) {
      for (const image of readdirSync(join(images, locale))) {
        expect(used.has(join(images, locale, image)), `${locale}/${image} is not used`).toBe(true);
      }
    }
  });

  it("describes every built-in effect, control and choice", () => {
    const text = readFileSync(join(manual, "en/effects.md"), "utf8");
    const lower = text.toLowerCase();
    for (const info of Object.values(DEVICES)) {
      expect(text, `## ${info.name}`).toContain(`## ${info.name}`);
      for (const param of info.params) {
        // EQ bands are documented once: "Band 3 frequency" → "frequency".
        const band = /^Band \d+ (.+)$/.exec(param.name);
        const name = band ? band[1] : param.name;
        expect(lower, `${info.name}: ${param.name}`).toContain(name.toLowerCase());
        for (const option of param.options ?? []) expect(text, `${info.name}: ${option}`).toContain(option);
      }
    }
  });
});
