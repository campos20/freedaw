// Sets the app version everywhere it lives: every package.json that has one (the web and desktop
// editions read theirs, and tauri.conf.json points at the desktop one), the Cargo workspace
// version, and Cargo.lock.
//
//   node scripts/set-version.mjs patch|minor|major|<x.y.z[-pre]>
//
// Prints the new version. The release workflow (.github/workflows/release.yml) runs this.
import { execFileSync } from "node:child_process";
import { readdirSync, readFileSync, writeFileSync, existsSync, appendFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SEMVER = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;

/** Parses `x.y.z[-pre]`; throws on anything else (no leading `v`, no build metadata). */
export function parse(version) {
  const m = SEMVER.exec(version);
  if (!m) throw new Error(`"${version}" is not a semantic version (x.y.z or x.y.z-pre)`);
  return { major: +m[1], minor: +m[2], patch: +m[3], pre: m[4] ? m[4].split(".") : [] };
}

/** Semver precedence: negative if a < b, 0 if equal, positive if a > b. */
export function compare(a, b) {
  const x = parse(a);
  const y = parse(b);
  for (const k of ["major", "minor", "patch"]) if (x[k] !== y[k]) return x[k] - y[k];
  // A pre-release sorts before its release.
  if (!x.pre.length || !y.pre.length) return y.pre.length - x.pre.length;
  for (let i = 0; i < Math.min(x.pre.length, y.pre.length); i++) {
    const [p, q] = [x.pre[i], y.pre[i]];
    if (p === q) continue;
    const [pn, qn] = [/^\d+$/.test(p), /^\d+$/.test(q)];
    if (pn && qn) return +p - +q;
    if (pn !== qn) return pn ? -1 : 1;
    return p < q ? -1 : 1;
  }
  return x.pre.length - y.pre.length;
}

/** The version after `current` for a bump (`patch`, `minor`, `major`) or an exact version. */
export function nextVersion(current, bump) {
  const { major, minor, patch, pre } = parse(current);
  const isPre = pre.length > 0;
  let next;
  switch (bump) {
    // Bumping a pre-release finishes it when it already is that kind of release (1.1.0-rc.1 → 1.1.0).
    case "major":
      next = isPre && minor === 0 && patch === 0 ? `${major}.0.0` : `${major + 1}.0.0`;
      break;
    case "minor":
      next = isPre && patch === 0 ? `${major}.${minor}.0` : `${major}.${minor + 1}.0`;
      break;
    case "patch":
      next = isPre ? `${major}.${minor}.${patch}` : `${major}.${minor}.${patch + 1}`;
      break;
    default:
      next = bump.replace(/^v/, "");
      if (compare(next, current) <= 0) {
        throw new Error(`The new version ${next} must be greater than the current ${current}`);
      }
  }
  return next;
}

function main() {
  const root = join(dirname(fileURLToPath(import.meta.url)), "..");
  const bump = process.argv[2];
  if (!bump) throw new Error("Usage: node scripts/set-version.mjs patch|minor|major|<x.y.z[-pre]>");

  const desktop = join(root, "apps/desktop/package.json");
  const current = JSON.parse(readFileSync(desktop, "utf8")).version;
  const next = nextVersion(current, bump);

  const manifests = ["apps", "packages"].flatMap((dir) =>
    readdirSync(join(root, dir))
      .map((name) => join(root, dir, name, "package.json"))
      .filter(existsSync),
  );
  for (const file of manifests) {
    const text = readFileSync(file, "utf8");
    if (!/^ {2}"version": "[^"]*"/m.test(text)) continue;
    writeFileSync(file, text.replace(/^( {2}"version": )"[^"]*"/m, `$1"${next}"`));
  }

  const cargo = join(root, "Cargo.toml");
  const toml = readFileSync(cargo, "utf8");
  const workspaceVersion = /(\[workspace\.package\][^[]*?\nversion = )"[^"]*"/;
  if (!workspaceVersion.test(toml)) {
    throw new Error("Couldn't find the version in Cargo.toml's [workspace.package]");
  }
  writeFileSync(cargo, toml.replace(workspaceVersion, `$1"${next}"`));
  // Updates only the workspace crates' entries in Cargo.lock.
  execFileSync("cargo", ["update", "--workspace", "--quiet"], { cwd: root, stdio: "inherit" });

  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `version=${next}\n`);
  console.log(next);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
