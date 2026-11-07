// Reports how complete each UI translation is, and lists what is missing.
//
//   pnpm i18n:status          summary for every locale
//   pnpm i18n:status pt-BR    summary plus the missing keys of one locale
//
// Missing strings fall back to English at runtime, so an incomplete translation still works.
// Loads the .ts catalogs with Node's type stripping (--experimental-strip-types), hence Node 22.6+.
import { readdirSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const dir = fileURLToPath(new URL("../packages/ui/src/i18n/locales/", import.meta.url));

/** `key → text`, with plural forms as `key#form`. */
function flatten(node, prefix = "", out = new Map()) {
  if (typeof node === "string") return out.set(prefix, node);
  const plural = typeof node.other === "string";
  for (const [key, child] of Object.entries(node)) {
    flatten(child, prefix ? `${prefix}${plural ? "#" : "."}${key}` : key, out);
  }
  return out;
}

async function load(file) {
  const module = await import(pathToFileURL(dir + file).href);
  return Object.values(module).find((value) => typeof value === "object");
}

const english = flatten(await load("en.ts"));
// A plural counts once, by its `other` form (languages need different sets of forms).
const required = [...english.keys()].filter((k) => !k.includes("#") || k.endsWith("#other"));
const only = process.argv[2];

const files = readdirSync(dir).filter((f) => f.endsWith(".ts") && !["en.ts", "index.ts"].includes(f));
for (const file of files.sort()) {
  const code = file.replace(/\.ts$/, "");
  if (only && code !== only) continue;
  const own = flatten(await load(file));
  const missing = required.filter((key) => !own.has(key));
  const done = required.length - missing.length;
  const percent = ((done / required.length) * 100).toFixed(1);
  console.log(`${code.padEnd(8)} ${percent.padStart(5)}%  ${done}/${required.length}`);
  if (only) for (const key of missing) console.log(`  missing: ${key.replace("#other", "")}`);
}
if (only && !files.includes(`${only}.ts`)) {
  console.error(`No locale file ${only}.ts in ${dir}`);
  process.exit(1);
}
